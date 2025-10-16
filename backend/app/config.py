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
    
    # 📚 RAG Pipeline Settings
    VECTOR_STORE_PATH: str = Field(default="./chroma_db", env="VECTOR_STORE_PATH")
    COLLECTION_NAME: str = Field(default="school_knowledge", env="COLLECTION_NAME")
    OPENAI_MODEL: str = Field(default="gpt-3.5-turbo", env="OPENAI_MODEL")
    
    # 🔤 Embedding Settings
    USE_OPENAI_EMBEDDINGS: bool = Field(default=True, env="USE_OPENAI_EMBEDDINGS")
    EMBEDDING_MODEL: str = Field(default="intfloat/multilingual-e5-base", env="EMBEDDING_MODEL")
    OPENAI_EMBEDDING_MODEL: str = Field(default="text-embedding-3-large", env="OPENAI_EMBEDDING_MODEL")
    
    # 📄 Document Processing
    CHUNK_SIZE: int = Field(default=500, env="CHUNK_SIZE")
    CHUNK_OVERLAP: int = Field(default=50, env="CHUNK_OVERLAP")
    
    # 🎯 AI Response Settings
    DEFAULT_MAX_TOKENS: int = Field(default=1000, env="DEFAULT_MAX_TOKENS")
    RAG_MAX_TOKENS: int = Field(default=1000, env="RAG_MAX_TOKENS")
    AI_TUTOR_MAX_TOKENS: int = Field(default=800, env="AI_TUTOR_MAX_TOKENS")
    AI_CHAT_MAX_TOKENS: int = Field(default=1000, env="AI_CHAT_MAX_TOKENS")
    AI_QUESTION_GENERATION_MAX_TOKENS: int = Field(default=1200, env="AI_QUESTION_GENERATION_MAX_TOKENS")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

# 🔧 Példányosítás (importálható bárhonnan)
settings = Settings()

def get_settings() -> Settings:
    """Get application settings instance."""
    return settings
