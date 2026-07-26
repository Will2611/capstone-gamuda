import json
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
from google.genai import types
from pathlib import Path

# 加载 .env 环境变量
load_dotenv()

app = FastAPI()

# 1. 初始化 Gemini 客户端
# 确保在 .env 文件中设置了 GEMINI_API_KEY=your_gemini_api_key
client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

JSON_FILE_PATH = Path(
    r"C:\Users\User\visualstudioproject\capstone-project\capstone-project\back-end\src\database\data\pos_analytics_mock.json"
)

def load_pos_data():
    """retrieve local POS Mock JSON data"""
    if not os.path.exists(JSON_FILE_PATH):
        raise FileNotFoundError(f"Cannot find POS mock file at {JSON_FILE_PATH}")
    with open(JSON_FILE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@app.post("/api/ai/recommendations")
def get_ai_recommendations():
    try:
        # 1. 读取 POS 数据
        pos_data = load_pos_data()

        # 2. 构建 Prompt
        system_prompt = """
You are an AI Business Intelligence Assistant specializing in restaurant analytics.

Your responsibility is to analyze historical POS data and provide business insights for restaurant owners.

The POS data may include:
- Revenue reports
- Sales trends
- Best-selling items
- Low-performing items
- Peak and off-peak customer traffic
- Historical promotion performance
- Customer purchasing behavior
- Upcoming holidays or seasonal events

Your tasks are:
1. Predict future business performance.
2. Identify key business insights.
3. Highlight business risks and opportunities.
4. Recommend exactly TWO promotional campaigns that are practical and data-driven.

Promotion recommendations should be realistic and based on the restaurant's historical data.

Return ONLY valid JSON strictly following this schema:

{
  "performancePrediction": {
    "summary": "Overall prediction of business performance.",
    "confidence": "High",
    "trend": "Increasing",
    "expectedRevenueChange": "+8%",
    "keyInsights": [
      "Insight 1",
      "Insight 2"
    ]
  },
  "businessOpportunities": [
    "Opportunity 1",
    "Opportunity 2"
  ],
  "businessRisks": [
    "Risk 1",
    "Risk 2"
  ],
  "recommendedPromotions": [
    {
      "title": "",
      "description": "",
      "targetGoal": "",
      "suggestedStartDate": "YYYY-MM-DD",
      "suggestedEndDate": "YYYY-MM-DD",
      "suggestedStartTime": "HH:MM",
      "suggestedEndTime": "HH:MM",
      "isAllDay": false,
      "expectedRevenueImpact": "+15%"
    },
    {
      "title": "",
      "description": "",
      "targetGoal": "",
      "suggestedStartDate": "YYYY-MM-DD",
      "suggestedEndDate": "YYYY-MM-DD",
      "suggestedStartTime": "HH:MM",
      "suggestedEndTime": "HH:MM",
      "isAllDay": false,
      "expectedRevenueImpact": "+12%"
    }
  ]
}

Do not return Markdown codeblock ```json.
Do not explain anything.
Return JSON only.
"""

        user_prompt = f"""
Below is the restaurant's historical POS data.

Please analyze the business performance, identify important trends, predict future performance, and recommend two promotional campaigns.

POS Data:
{json.dumps(pos_data, ensure_ascii=False, indent=2)}
"""

        # 3. 调用 Gemini API (使用推荐的 gemini-2.5-flash 模型)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json", # 强制 Gemini 输出 JSON 格式
                temperature=0.7,
            ),
        )

        # 4. 获取 AI 返回内容并解析
        raw_content = response.text

        if not raw_content:
            raise HTTPException(status_code=500, detail="AI returned an empty response.")

        ai_result = json.loads(raw_content)

        return {
            "status": "success",
            "data": ai_result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))