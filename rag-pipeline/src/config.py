"""
Configuration Settings
====================

Settings for the RAG document processing pipeline.
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import Optional

class RAGPipelineSettings(BaseSettings):
    """Settings for RAG document processing pipeline."""
    
    # OpenAI Configuration
    openai_api_key: str
    openai_model: str = "gpt-3.5-turbo"
    openai_embedding_model: str = "text-embedding-ada-002"
    
    # Vector Database Configuration
    vector_db_path: str = "../backend/chroma_db"
    collection_name: str = "school_knowledge"
    
    # Embedding Configuration
    local_embedding_model: str = "all-MiniLM-L6-v2"
    use_openai_embeddings: bool = False
    
    # Document Processing Configuration
    chunk_size: int = 1000
    chunk_overlap: int = 200
    min_chunk_size: int = 100
    batch_size: int = 32
    
    # Document Directory
    documents_dir: str = "./documents"
    
    # Logging Configuration
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

def get_settings() -> RAGPipelineSettings:
    """Get settings instance."""
    return RAGPipelineSettings()