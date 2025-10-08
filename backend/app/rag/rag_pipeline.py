"""
RAG Pipeline
===========

Main RAG pipeline that orchestrates document processing, embedding generation,
vector storage, and retrieval-augmented generation with OpenAI.
"""

import logging
import asyncio
from pathlib import Path
from typing import List, Dict, Any, Optional, Union
from openai import OpenAI

from .document_processor import DocumentProcessor, DocumentChunk
from .embeddings import EmbeddingService
from .vector_store import VectorStore
from .retriever import KnowledgeRetriever, RetrievedDocument

logger = logging.getLogger(__name__)

class RAGPipeline:
    """Complete RAG pipeline for educational AI assistant."""
    
    def __init__(
        self,
        openai_api_key: str,
        vector_store_path: str = "./chroma_db",
        collection_name: str = "school_knowledge",
        embedding_model: str = "all-MiniLM-L6-v2",
        openai_model: str = "gpt-3.5-turbo",
        openai_embedding_model: str = "text-embedding-3-large",
        use_openai_embeddings: bool = False,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        score_threshold: float = 0.2
    ):
        """
        Initialize RAG pipeline.
        
        Args:
            openai_api_key: OpenAI API key
            vector_store_path: Path for vector database
            collection_name: Name of the vector collection
            embedding_model: Local embedding model name
            openai_model: OpenAI model for generation
            chunk_size: Document chunk size
            chunk_overlap: Overlap between chunks
            score_threshold: Minimum similarity score for retrieval (0.0-1.0)
        """
        self.openai_api_key = openai_api_key
        self.openai_model = openai_model
        
        # Initialize OpenAI client
        self.openai_client = OpenAI(api_key=openai_api_key)
        
        # Store embedding configuration
        self.use_openai_embeddings = use_openai_embeddings
        
        # Initialize components
        self.embedding_service = EmbeddingService(
            openai_api_key=openai_api_key,
            model_name=embedding_model,
            openai_model=openai_embedding_model
        )
        
        self.vector_store = VectorStore(
            collection_name=collection_name,
            persist_directory=vector_store_path
        )
        
        self.document_processor = DocumentProcessor(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )
        
        self.retriever = KnowledgeRetriever(
            vector_store=self.vector_store,
            embedding_service=self.embedding_service,
            score_threshold=score_threshold,
            use_openai_embeddings=use_openai_embeddings
        )
        
    async def generate_response(
        self,
        query: str,
        context_k: int = 5,
        max_tokens: int = 500,
        temperature: float = 0.7,
        system_prompt: Optional[str] = None,
        include_sources: bool = True
    ) -> Dict[str, Any]:
        """
        Generate AI response using RAG.
        
        Args:
            query: User query
            context_k: Number of context documents to retrieve
            max_tokens: Maximum tokens in response
            temperature: Response creativity (0-1)
            system_prompt: Custom system prompt
            include_sources: Whether to include source information
            
        Returns:
            Response with answer and metadata
        """
        logger.info(f"Generating RAG response for: {query[:50]}...")
        
        try:
            # Retrieve relevant context
            retrieved_docs = await self.retriever.retrieve(
                query=query,
                k=context_k,
                strategy="similarity"
            )
            
            # Format context
            context = self.retriever.format_context(retrieved_docs)
            
            # Create system prompt
            if not system_prompt:
                system_prompt = self._create_default_system_prompt()
            
            # Create user prompt with context
            user_prompt = self._create_user_prompt(query, context)
            
            # Generate response
            response = await asyncio.to_thread(
                self.openai_client.chat.completions.create,
                model=self.openai_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=max_tokens,
                temperature=temperature
            )
            
            answer = response.choices[0].message.content
            
            # Prepare response
            result = {
                "answer": answer,
                "query": query,
                "context_used": len(retrieved_docs) > 0,
                "num_sources": len(retrieved_docs),
                "model_used": self.openai_model
            }
            
            if include_sources and retrieved_docs:
                result["sources"] = [
                    {
                        "content": doc.content[:200] + "...",
                        "score": doc.score,
                        "source": doc.metadata.get("source", "unknown"),
                        "subject": doc.metadata.get("subject"),
                        "grade": doc.metadata.get("class_grade")
                    }
                    for doc in retrieved_docs
                ]
            
            logger.info(f"Generated response using {len(retrieved_docs)} sources")
            return result
            
        except Exception as e:
            logger.error(f"Error generating RAG response: {e}")
            # Fallback to direct OpenAI response
            return await self._fallback_response(query, max_tokens, temperature)
    
    def _create_default_system_prompt(self) -> str:
        """Create default system prompt for educational AI."""
        return """Te egy oktatási AI asszisztens vagy, aki segíti a tanulókat és tanárokat.

Feladataid:
1. Válaszolj a kérdésekre a megadott kontextus alapján, de ha a kontextus nem teljesen releváns, használhatod általános tudásodat is
2. Ha található valamilyen kapcsolódó információ a kontextusban, használd fel azt
3. Használj egyszerű, érthető nyelvet
4. Adj konkrét példákat, ha lehet
5. Segíts a tanulási folyamatban

Stílus:
- Barátságos és támogató hangnem
- Pedagógiai szemlélet
- Magyar nyelv használata
- Strukturált válaszok

Ha a kontextus csak részben releváns, akkor is próbálj hasznos választ adni. Csak akkor mondd, hogy nincs releváns információ, ha a kontextus egyáltalán nem kapcsolódik a kérdéshez."""
    
    def _create_user_prompt(self, query: str, context: str) -> str:
        """Create user prompt with query and context."""
        if context.strip() == "Nincs releváns információ a tudásbázisban.":
            return f"""Kérdés: {query}

Nincs specifikus kontextus a tudásbázisból. Válaszolj általános tudásod alapján, de jelezd, hogy ez nem a helyi tudásbázis információja."""
        
        return f"""Kontextus a tudásbázisból:
{context}

Kérdés: {query}

Válaszolj a kérdésre a fenti kontextus alapján. Ha a kontextus nem tartalmaz releváns információt, jelezd ezt."""
    
    async def _fallback_response(
        self,
        query: str,
        max_tokens: int,
        temperature: float
    ) -> Dict[str, Any]:
        """Generate fallback response without RAG context."""
        try:
            response = await asyncio.to_thread(
                self.openai_client.chat.completions.create,
                model=self.openai_model,
                messages=[
                    {
                        "role": "system",
                        "content": "Te egy oktatási AI asszisztens vagy. Válaszolj röviden és hasznosak legyenek a válaszaid."
                    },
                    {"role": "user", "content": query}
                ],
                max_tokens=max_tokens,
                temperature=temperature
            )
            
            return {
                "answer": response.choices[0].message.content,
                "query": query,
                "context_used": False,
                "num_sources": 0,
                "model_used": self.openai_model,
                "fallback": True
            }
        except Exception as e:
            logger.error(f"Fallback response failed: {e}")
            return {
                "answer": "Sajnos jelenleg nem tudok válaszolni a kérdésére. Kérem, próbálja újra később.",
                "query": query,
                "context_used": False,
                "num_sources": 0,
                "error": True
            }
    
    def get_knowledge_base_stats(self) -> Dict[str, Any]:
        """Get statistics about the knowledge base."""
        try:
            total_docs = self.vector_store.count_documents()
            
            if total_docs == 0:
                return {
                    "total_documents": 0,
                    "subjects": [],
                    "grades": [],
                    "sources_count": 0,
                    "embedding_dimension": 0
                }
            
            # FIX: Get ALL documents to ensure we capture all subjects/grades/sources
            # The previous limit=100 was causing the issue where only documents from
            # one subject were being returned due to ChromaDB clustering
            sample_docs = self.vector_store.get_documents_by_metadata({})  # No limit!
            
            subjects = set()
            grades = set()
            sources = set()
            
            # Process ALL documents to get accurate stats
            if sample_docs and sample_docs.get("metadatas"):
                logger.info(f"Processing {len(sample_docs['metadatas'])} documents for stats")
                
                for metadata in sample_docs["metadatas"]:
                    if metadata:  # Check if metadata exists
                        # Try different possible field names
                        subject = metadata.get("subject") or metadata.get("Subject")
                        grade = metadata.get("class_grade") or metadata.get("grade") or metadata.get("Grade")
                        source = metadata.get("source") or metadata.get("Source") or metadata.get("filename")
                        
                        if subject:
                            subjects.add(subject)
                        if grade:
                            grade_value = int(grade) if str(grade).isdigit() else grade
                            grades.add(grade_value)
                        if source:
                            sources.add(source)
            
            logger.info(f"Stats extraction result: subjects={len(subjects)}, grades={len(grades)}, sources={len(sources)}")
            logger.info(f"Subjects found: {sorted(list(subjects))}")
            logger.info(f"Grades found: {sorted(list(grades))}")
            
            return {
                "total_documents": total_docs,
                "subjects": sorted(list(subjects)),
                "grades": sorted(list(grades)),
                "sources_count": len(sources),
                "embedding_dimension": self.embedding_service.get_embedding_dimension() if total_docs > 0 else 0
            }
        except Exception as e:
            logger.error(f"Error getting knowledge base stats: {e}")
            return {"error": str(e)}
    
    async def search_knowledge_base(
        self,
        query: str,
        k: int = 10,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Search the knowledge base directly."""
        try:
            retrieved_docs = await self.retriever.retrieve(
                query=query,
                k=k,
                filters=filters
            )
            
            return [
                {
                    "content": doc.content,
                    "score": doc.score,
                    "metadata": doc.metadata
                }
                for doc in retrieved_docs
            ]
        except Exception as e:
            logger.error(f"Error searching knowledge base: {e}")
            return []
    
