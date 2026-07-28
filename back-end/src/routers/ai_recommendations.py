import os
import json
from typing import List
from fastapi import APIRouter, HTTPException, status
from google import genai
from google.genai import types

from src.database.schemas.ai_recommendations import AIPromotionRequest, AIPromotionResponse, AIRewriteRequest, AIRewriteResponse
from src.services.google_sheets import sheet_service

router = APIRouter(prefix="/api/ai", tags=["AI Recommendations"])

# Initialize Gemini Client
gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

async def fetch_mcp_trello_active_promos() -> List[str]:
    """Retrieves active card titles from Trello/MCP to prevent duplicate promo recommendations."""
    try:
        # TODO: Replace with your actual MCP client call if active
        return [
            "Merdeka Family Bundle Deal",
            "Weekend Football Finals Screening Special"
        ]
    except Exception as err:
        print(f"⚠️ Warning: Could not fetch Trello promos: {err}")
        return []

@router.post(
    "/recommendations",
    response_model=AIPromotionResponse,
    status_code=status.HTTP_200_OK
)
async def generate_ai_promotions(payload: AIPromotionRequest):
    try:
        # 1. Fetch live metrics from Google Sheet service
        sheet_data = sheet_service.fetch_dashboard_sheet_data()
        
        # 2. Fetch existing Trello promotions
        existing_trello_promos = await fetch_mcp_trello_active_promos()

        # 3. Formulate System Instructions
        system_instruction = f"""
You are an expert AI Promotion Generator for a restaurant owner.
Analyze the provided merchant metrics and create creative, practical marketing promotions.

CRITICAL GUARDRAILS:
1. OUTPUT MUST BE VALID JSON conforming strictly to the requested schema.
2. GENERATE A MAXIMUM OF 3 PROMOTIONS. NEVER EXCEED 3.
3. DO NOT DUPLICATE or clone existing active cards from Trello:
   Existing Active Promos: {json.dumps(existing_trello_promos)}
4. IF USER INPUT IS EMPTY: Suggest 3 high-impact strategies tailored to top-selling items and customer segments from Google Sheets.
5. IF USER INPUT IS PROVIDED: Tailor recommendations around the user's specific theme while avoiding duplicate ideas.
6. Return recommended_start_date and recommended_end_date using format YYYY-MM-DD.
"""

        user_content = f"""
Merchant Sheet Context:
- Top Menu Items: {json.dumps(sheet_data.get('menu_items', []))}
- Target Customer Segments: {json.dumps(sheet_data.get('customer_segments', []))}
- Financial Overview: {json.dumps(sheet_data.get('financial_summary', []))}

User Input / Topic: {payload.user_input if payload.user_input else "Generate top 3 overall growth ideas."}
"""

        # 4. Call Gemini 2.5 Flash with structured JSON output
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=user_content,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=AIPromotionResponse,
                temperature=0.7,
            ),
        )

        if not response.text:
            raise HTTPException(status_code=500, detail="Gemini returned an empty response.")

        # Parse & ensure max 3 safeguard
        parsed_result = AIPromotionResponse.model_validate_json(response.text)
        if len(parsed_result.promotions) > 3:
            parsed_result.promotions = parsed_result.promotions[:3]

        return parsed_result

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate recommendations: {str(e)}"
        )

    

@router.post(
    "/rewrite-field",
    response_model=AIRewriteResponse,
    status_code=status.HTTP_200_OK
)
async def rewrite_promotion_field(payload: AIRewriteRequest):
    try:
        # 1. Fetch live metrics & Trello/PgAdmin historical context
        sheet_data = sheet_service.fetch_dashboard_sheet_data()
        existing_trello_promos = await fetch_mcp_trello_active_promos()

        system_instruction = f"""
You are an expert restaurant marketing copywriter.
Your job is to generate high-converting promotional text for a single field: '{payload.field}'.

RULES:
1. OUTPUT MUST BE VALID JSON matching: {{"generated_text": "..."}}
2. DO NOT copy or duplicate these active/past promotions: {json.dumps(existing_trello_promos)}
3. Keep the tone engaging, professional, and tailored to restaurant customers.
4. 'iteration_index' is currently {payload.iteration_index}. Use a distinct marketing angle (e.g., urgency, discount, family-focused, seasonal) to ensure each generation feels fresh.
"""

        if payload.field == "title":
            user_prompt = f"""
Generate a catchy, concise promotion title (under 10 words).
Current input text: "{payload.current_text or 'None'}"
Top selling menu items for reference: {json.dumps(sheet_data.get('menu_items', []))}
Return iteration variation #{payload.iteration_index}.
"""
        else: # description
            user_prompt = f"""
Generate a compelling promotion description (2-3 sentences max) highlighting offer details and target audience.
Promotion Title Context: "{payload.current_title or 'Special Restaurant Offer'}"
Current description text: "{payload.current_text or 'None'}"
Return iteration variation #{payload.iteration_index}.
"""

        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=AIRewriteResponse,
                temperature=0.8,
            ),
        )

        if not response.text:
            raise HTTPException(status_code=500, detail="Gemini returned empty text")

        return AIRewriteResponse.model_validate_json(response.text)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Field rewrite failed: {str(e)}"
        )