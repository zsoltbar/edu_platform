"""
RAG API Router
=============

FastAPI router for RAG (Retrieval-Augmented Generation) endpoints.
Provides API access to the educational knowledge base and AI responses.
"""

import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
import os
from pathlib import Path

from ..auth import get_current_user
from ..models import User
from ..rag.rag_pipeline import RAGPipeline
from ..config import get_settings

logger = logging.getLogger(__name__)

# Initialize RAG pipeline (singleton pattern)
_rag_pipeline = None

def get_rag_pipeline() -> RAGPipeline:
    """Get or create RAG pipeline instance."""
    global _rag_pipeline
    if _rag_pipeline is None:
        settings = get_settings()
        _rag_pipeline = RAGPipeline(
            openai_api_key=settings.OPENAI_API_KEY,
            vector_store_path=getattr(settings, 'VECTOR_STORE_PATH', './chroma_db'),
            collection_name=getattr(settings, 'COLLECTION_NAME', 'school_knowledge'),
            embedding_model=getattr(settings, 'EMBEDDING_MODEL', 'intfloat/multilingual-e5-base'),
            openai_model=getattr(settings, 'OPENAI_MODEL', 'gpt-3.5-turbo'),
            openai_embedding_model=getattr(settings, 'OPENAI_EMBEDDING_MODEL', 'text-embedding-3-large'),
            use_openai_embeddings=getattr(settings, 'USE_OPENAI_EMBEDDINGS', False),
            score_threshold=getattr(settings, 'SCORE_THRESHOLD', 0.2)
        )
    return _rag_pipeline

router = APIRouter(prefix="/rag", tags=["RAG"])

# Request/Response Models
class RAGQueryRequest(BaseModel):
    query: str = Field(..., description="User query for RAG system")
    context_k: int = Field(5, description="Number of context documents to retrieve", ge=1, le=20)
    max_tokens: int = Field(500, description="Maximum tokens in response", ge=50, le=2000)
    temperature: float = Field(0.7, description="Response creativity", ge=0.0, le=1.0)
    include_sources: bool = Field(True, description="Whether to include source information")

class RAGQueryResponse(BaseModel):
    answer: str
    query: str
    context_used: bool
    num_sources: int
    model_used: str
    sources: Optional[List[Dict[str, Any]]] = None

class SearchRequest(BaseModel):
    query: str = Field(..., description="Search query")
    k: int = Field(10, description="Number of results to return", ge=1, le=50)
    subject: Optional[str] = Field(None, description="Filter by subject")
    grade: Optional[int] = Field(None, description="Filter by grade level", ge=1, le=12)



class KnowledgeBaseStats(BaseModel):
    total_documents: int
    subjects: List[str]
    grades: List[int]
    sources_count: int
    embedding_dimension: int

@router.post("/query", response_model=RAGQueryResponse)
async def query_rag(
    request: RAGQueryRequest,
    current_user: User = Depends(get_current_user),
    rag_pipeline: RAGPipeline = Depends(get_rag_pipeline)
):
    """
    Query the RAG system for AI-enhanced responses.
    
    Uses the school knowledge base to provide contextually relevant answers
    to educational questions.
    """
    try:
        logger.info(f"RAG query from user {current_user.id}: {request.query[:50]}...")
        
        response = await rag_pipeline.generate_response(
            query=request.query,
            context_k=request.context_k,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            include_sources=request.include_sources
        )
        
        return RAGQueryResponse(**response)
        
    except Exception as e:
        logger.error(f"RAG query error: {e}")
        raise HTTPException(status_code=500, detail=f"RAG query failed: {str(e)}")

@router.post("/search")
async def search_knowledge_base(
    request: SearchRequest,
    current_user: User = Depends(get_current_user),
    rag_pipeline: RAGPipeline = Depends(get_rag_pipeline)
):
    """
    Search the knowledge base directly without AI generation.
    
    Returns relevant documents from the school knowledge base
    based on similarity search.
    """
    try:
        # Build filters
        filters = {}
        if request.subject:
            filters["subject"] = request.subject
        if request.grade:
            filters["class_grade"] = request.grade
        
        print(f"Filters applied: {filters}")
        print(f"Search query: {request.query}")
        print(f"Search parameters: k={request.k}")

        results = await rag_pipeline.search_knowledge_base(
            query=request.query,
            k=request.k,
            filters=filters if filters else None
        )
        
        return {"results": results, "query": request.query}
        
    except Exception as e:
        logger.error(f"Knowledge base search error: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")



@router.get("/debug-metadata")
async def debug_metadata(
    current_user: User = Depends(get_current_user),
    rag_pipeline: RAGPipeline = Depends(get_rag_pipeline)
):
    """Debug endpoint to inspect actual metadata in the database."""
    try:
        # Get raw data from collection
        collection = rag_pipeline.vector_store.collection
        result = collection.get(limit=10, include=['metadatas'])
        
        return {
            "total_count": collection.count(),
            "sample_metadatas": result.get('metadatas', [])[:5]
        }
    except Exception as e:
        logger.error(f"Debug metadata error: {e}")
        raise HTTPException(status_code=500, detail=f"Debug failed: {str(e)}")

@router.get("/stats", response_model=KnowledgeBaseStats)
async def get_knowledge_base_stats(
    current_user: User = Depends(get_current_user),
    rag_pipeline: RAGPipeline = Depends(get_rag_pipeline)
):
    """
    Get statistics about the knowledge base.
    
    Returns information about the number of documents, subjects covered,
    grade levels, and other metadata.
    """
    try:
        stats = rag_pipeline.get_knowledge_base_stats()
        
        if "error" in stats:
            raise HTTPException(status_code=500, detail=stats["error"])
        
        return KnowledgeBaseStats(**stats)
        
    except Exception as e:
        logger.error(f"Stats retrieval error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")

@router.delete("/reset")
async def reset_knowledge_base(
    current_user: User = Depends(get_current_user),
    rag_pipeline: RAGPipeline = Depends(get_rag_pipeline)
):
    """
    Reset the entire knowledge base.
    
    Only admin users can reset the knowledge base.
    This operation cannot be undone!
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin users can reset the knowledge base")
    
    try:
        rag_pipeline.vector_store.reset_collection()
        logger.warning(f"Knowledge base reset by admin: {current_user.name}")
        
        return {"message": "Knowledge base has been reset successfully"}
        
    except Exception as e:
        logger.error(f"Knowledge base reset error: {e}")
        raise HTTPException(status_code=500, detail=f"Reset failed: {str(e)}")



# Health check for RAG system
@router.get("/health")
async def rag_health_check(rag_pipeline: RAGPipeline = Depends(get_rag_pipeline)):
    """Check if RAG system is working properly."""
    try:
        stats = rag_pipeline.get_knowledge_base_stats()
        return {
            "status": "healthy",
            "documents_count": stats.get("total_documents", 0),
            "embedding_service": "available",
            "vector_store": "connected"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }