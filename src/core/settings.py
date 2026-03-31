import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8')
    
    SCRAPING_BROWSER_WS_URL: str = os.getenv("SCRAPING_BROWSER_WS_URL", "ws://localhost:3000")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "llama-3.3-70b-specdec")
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")

settings = Settings()
