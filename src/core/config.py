"""Configuration settings."""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    """Application settings."""
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/mtg_tcg_db"
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    
    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_RELOAD: bool = True
    API_WORKERS: int = 1
    
    # Security
    SECRET_KEY: str = "your-secret-key-here"
    JWT_SECRET_KEY: str = "your-jwt-secret-key"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Email / SMTP Configurations
    SMTP_TLS: bool = True
    SMTP_PORT: int = 587
    SMTP_SERVER: str = "smtp.hostinger.com"
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    EMAILS_FROM_EMAIL: str = "info@geekorium.shop"
    EMAILS_FROM_NAME: str = "Geekorium Shop"
    
    # CORS
    ALLOWED_HOSTS: List[str] = ["*"]
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Environment
    DEBUG: bool = True
    ENVIRONMENT: str = "development"

    def model_post_init(self, __context) -> None:
        """Validate settings after initialization."""
        if self.ENVIRONMENT == "production":
            if not self.SMTP_PASSWORD or self.SMTP_PASSWORD == "SET_ME_VIA_ENV_VAR":
                raise ValueError("SMTP_PASSWORD must be set in production environment")
            if not self.SMTP_USERNAME:
                raise ValueError("SMTP_USERNAME must be set in production environment")
    
settings = Settings()
