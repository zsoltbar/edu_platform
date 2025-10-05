# app/config.py
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    # 🗄️ DATABASE
    DATABASE_URL: str = Field(..., env="DATABASE_URL")

    # 🔐 AUTH
    SECRET_KEY: str = Field(..., env="SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 óra

    # ⚙️ APP
    APP_NAME: str = "EduPlatform"
    DEBUG: bool = Field(default=True, env="DEBUG")

    # 🧠 AI / OpenAI modul
    OPENAI_API_KEY: str | None = Field(default=None, env="OPENAI_API_KEY")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

# 🔧 Példányosítás (importálható bárhonnan)
settings = Settings()
