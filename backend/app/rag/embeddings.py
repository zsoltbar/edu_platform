"""
Embedding Service
================

Handles text embeddings using sentence-transformers and OpenAI embeddings.
Provides unified interface for different embedding models.
"""

import asyncio
import logging
from typing import List, Optional, Union
import numpy as np
from sentence_transformers import SentenceTransformer
import openai
from openai import OpenAI
import tiktoken

logger = logging.getLogger(__name__)

class EmbeddingService:
    """Service for generating text embeddings."""
    
    def __init__(
        self,
        openai_api_key: Optional[str] = None,
        model_name: str = "all-MiniLM-L6-v2",
        openai_model: str = "text-embedding-ada-002"
    ):
        """
        Initialize embedding service.
        
        Args:
            openai_api_key: OpenAI API key for OpenAI embeddings
            model_name: Sentence transformer model name
            openai_model: OpenAI embedding model name
        """
        self.openai_client = None
        if openai_api_key:
            self.openai_client = OpenAI(api_key=openai_api_key)
            
        self.openai_model = openai_model
        self.local_model = None
        self.model_name = model_name
        self.tokenizer = tiktoken.get_encoding("cl100k_base")
        
        # Load local model lazily
        self._load_local_model()
    
    def _load_local_model(self):
        """Load sentence transformer model."""
        try:
            self.local_model = SentenceTransformer(self.model_name)
            logger.info(f"Loaded local embedding model: {self.model_name}")
        except Exception as e:
            logger.error(f"Failed to load local model: {e}")
            self.local_model = None
    
    async def embed_text(
        self, 
        text: Union[str, List[str]], 
        use_openai: bool = False
    ) -> Union[np.ndarray, List[np.ndarray]]:
        """
        Generate embeddings for text.
        
        Args:
            text: Text or list of texts to embed
            use_openai: Whether to use OpenAI embeddings
            
        Returns:
            Embeddings as numpy arrays
        """
        if use_openai and self.openai_client:
            return await self._embed_with_openai(text)
        else:
            return self._embed_with_local_model(text)
    
    def _embed_with_local_model(
        self, 
        text: Union[str, List[str]]
    ) -> Union[np.ndarray, List[np.ndarray]]:
        """Generate embeddings using local sentence transformer."""
        if not self.local_model:
            raise RuntimeError("Local embedding model not available")
            
        if isinstance(text, str):
            embedding = self.local_model.encode([text])
            return embedding[0]
        else:
            embeddings = self.local_model.encode(text)
            return embeddings
    
    async def _embed_with_openai(
        self, 
        text: Union[str, List[str]]
    ) -> Union[np.ndarray, List[np.ndarray]]:
        """Generate embeddings using OpenAI API."""
        if not self.openai_client:
            raise RuntimeError("OpenAI client not configured")
        
        texts = [text] if isinstance(text, str) else text
        
        # Handle token limits
        processed_texts = []
        for t in texts:
            tokens = self.tokenizer.encode(t)
            if len(tokens) > 8000:  # OpenAI limit
                # Truncate text
                truncated_tokens = tokens[:8000]
                t = self.tokenizer.decode(truncated_tokens)
            processed_texts.append(t)
        
        try:
            response = await asyncio.to_thread(
                self.openai_client.embeddings.create,
                input=processed_texts,
                model=self.openai_model
            )
            
            embeddings = [np.array(data.embedding) for data in response.data]
            
            if isinstance(text, str):
                return embeddings[0]
            return embeddings
            
        except Exception as e:
            logger.error(f"OpenAI embedding error: {e}")
            # Fallback to local model
            return self._embed_with_local_model(text)
    
    def get_embedding_dimension(self, use_openai: bool = False) -> int:
        """Get embedding dimension."""
        if use_openai:
            return 1536  # OpenAI ada-002 dimension
        else:
            if self.local_model:
                return self.local_model.get_sentence_embedding_dimension()
            return 384  # Default MiniLM dimension
    
    async def embed_query(self, query: str, use_openai: bool = False) -> np.ndarray:
        """Embed a search query."""
        return await self.embed_text(query, use_openai=use_openai)
    
    async def embed_documents(
        self, 
        documents: List[str], 
        use_openai: bool = False,
        batch_size: int = 32
    ) -> List[np.ndarray]:
        """
        Embed multiple documents in batches.
        
        Args:
            documents: List of document texts
            use_openai: Whether to use OpenAI embeddings
            batch_size: Batch size for processing
            
        Returns:
            List of embedding arrays
        """
        embeddings = []
        
        for i in range(0, len(documents), batch_size):
            batch = documents[i:i + batch_size]
            batch_embeddings = await self.embed_text(batch, use_openai=use_openai)
            
            if isinstance(batch_embeddings, np.ndarray) and len(batch) == 1:
                embeddings.append(batch_embeddings)
            else:
                embeddings.extend(batch_embeddings)
        
        return embeddings