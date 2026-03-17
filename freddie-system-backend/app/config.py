import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    OPENAI_API_KEY: str
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/auth/google/callback"
    
    # Defaults
    WHATSAPP_API_URL: str = "https://api.whatsapp.com/..."

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()