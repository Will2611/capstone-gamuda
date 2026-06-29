import os

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama").lower()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")

MAX_HISTORY_TURNS = int(os.getenv("LLM_MAX_HISTORY", "20"))
