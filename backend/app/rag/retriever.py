"""
Knowledge Retriever
==================

Handles intelligent retrieval of relevant knowledge from the vector store
for RAG pipeline. Includes advanced retrieval strategies and ranking.
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
from .vector_store import VectorStore
from .embeddings import EmbeddingService

logger = logging.getLogger(__name__)

class RetrievedDocument:
    """Represents a retrieved document with relevance score."""
    
    def __init__(
        self,
        content: str,
        metadata: Dict[str, Any],
        score: float,
        source: str = None
    ):
        self.content = content
        self.metadata = metadata
        self.score = score
        self.source = source or metadata.get("source", "unknown")
    
    def __repr__(self):
        return f"RetrievedDocument(score={self.score:.3f}, source={self.source})"

class KnowledgeRetriever:
    """Retrieves relevant knowledge for RAG pipeline."""
    
    def __init__(
        self,
        vector_store: VectorStore,
        embedding_service: EmbeddingService,
        default_k: int = 5,
        score_threshold: float = 0.7
    ):
        """
        Initialize knowledge retriever.
        
        Args:
            vector_store: Vector database instance
            embedding_service: Embedding service instance
            default_k: Default number of documents to retrieve
            score_threshold: Minimum similarity score threshold
        """
        self.vector_store = vector_store
        self.embedding_service = embedding_service
        self.default_k = default_k
        self.score_threshold = score_threshold
    
    async def retrieve(
        self,
        query: str,
        k: Optional[int] = None,
        filters: Optional[Dict[str, Any]] = None,
        strategy: str = "similarity"
    ) -> List[RetrievedDocument]:
        """
        Retrieve relevant documents for a query.
        
        Args:
            query: Search query
            k: Number of documents to retrieve
            filters: Metadata filters
            strategy: Retrieval strategy ('similarity', 'mmr', 'contextual')
            
        Returns:
            List of retrieved documents
        """
        k = k or self.default_k
        
        if strategy == "similarity":
            return await self._similarity_retrieval(query, k, filters)
        elif strategy == "mmr":
            return await self._mmr_retrieval(query, k, filters)
        elif strategy == "contextual":
            return await self._contextual_retrieval(query, k, filters)
        else:
            raise ValueError(f"Unknown retrieval strategy: {strategy}")
    
    async def _similarity_retrieval(
        self,
        query: str,
        k: int,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[RetrievedDocument]:
        """Basic similarity-based retrieval."""
        # Get query embedding
        query_embedding = await self.embedding_service.embed_query(query)
        
        # Search vector store
        results = self.vector_store.similarity_search(
            query=query,
            n_results=k,
            where=filters,
            query_embedding=query_embedding
        )
        
        # Convert to RetrievedDocument objects
        retrieved_docs = []
        
        logger.info(f"Vector store search returned: {len(results.get('documents', [[]]))} document batches")
        
        if results["documents"] and results["documents"][0]:
            documents = results["documents"][0]
            metadatas = results["metadatas"][0] if results["metadatas"] else [{}] * len(documents)
            distances = results["distances"][0] if results["distances"] else [0.0] * len(documents)
            
            logger.info(f"Found {len(documents)} documents with distances: {distances[:3] if distances else []}")
            
            for doc, metadata, distance in zip(documents, metadatas, distances):
                # Convert distance to similarity score (assuming cosine distance)
                score = 1.0 - distance if distance <= 1.0 else 0.0
                
                logger.debug(f"Document score: {score:.3f}, threshold: {self.score_threshold}")
                
                if score >= self.score_threshold:
                    retrieved_doc = RetrievedDocument(
                        content=doc,
                        metadata=metadata or {},
                        score=score
                    )
                    retrieved_docs.append(retrieved_doc)
                else:
                    logger.debug(f"Document filtered out: score {score:.3f} < threshold {self.score_threshold}")
        else:
            logger.warning("No documents found in vector store search results")
        
        # Sort by score descending
        retrieved_docs.sort(key=lambda x: x.score, reverse=True)
        
        logger.info(f"Retrieved {len(retrieved_docs)} documents for query: {query[:50]}...")
        return retrieved_docs
    
    async def _mmr_retrieval(
        self,
        query: str,
        k: int,
        filters: Optional[Dict[str, Any]] = None,
        lambda_param: float = 0.5
    ) -> List[RetrievedDocument]:
        """
        Maximum Marginal Relevance (MMR) retrieval for diversity.
        
        Args:
            lambda_param: Balance between relevance and diversity (0-1)
        """
        # Get more initial candidates
        initial_k = min(k * 3, 20)
        candidates = await self._similarity_retrieval(query, initial_k, filters)
        
        if not candidates:
            return []
        
        # Get query embedding
        query_embedding = await self.embedding_service.embed_query(query)
        
        # Get embeddings for all candidates
        candidate_texts = [doc.content for doc in candidates]
        candidate_embeddings = await self.embedding_service.embed_documents(candidate_texts)
        
        selected = []
        remaining_indices = list(range(len(candidates)))
        
        while len(selected) < k and remaining_indices:
            if not selected:
                # First selection: highest similarity to query
                best_idx = 0
                best_score = candidates[0].score
                for i, candidate in enumerate(candidates[1:], 1):
                    if candidate.score > best_score:
                        best_idx = i
                        best_score = candidate.score
            else:
                # MMR selection: balance relevance and diversity
                best_idx = None
                best_mmr_score = -1
                
                for idx in remaining_indices:
                    # Relevance to query
                    relevance = candidates[idx].score
                    
                    # Maximum similarity to already selected documents
                    max_sim_to_selected = 0
                    for selected_doc in selected:
                        selected_idx = candidates.index(selected_doc)
                        similarity = self._cosine_similarity(
                            candidate_embeddings[idx],
                            candidate_embeddings[selected_idx]
                        )
                        max_sim_to_selected = max(max_sim_to_selected, similarity)
                    
                    # MMR score
                    mmr_score = lambda_param * relevance - (1 - lambda_param) * max_sim_to_selected
                    
                    if mmr_score > best_mmr_score:
                        best_mmr_score = mmr_score
                        best_idx = idx
            
            if best_idx is not None:
                selected.append(candidates[best_idx])
                remaining_indices.remove(best_idx)
        
        logger.info(f"MMR retrieved {len(selected)} diverse documents")
        return selected
    
    async def _contextual_retrieval(
        self,
        query: str,
        k: int,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[RetrievedDocument]:
        """
        Contextual retrieval considering educational context.
        """
        # Extract educational context from query
        context_filters = self._extract_educational_context(query)
        
        # Combine with provided filters
        combined_filters = {**(filters or {}), **context_filters}
        
        # Use similarity retrieval with enhanced filters
        return await self._similarity_retrieval(query, k, combined_filters)
    
    def _extract_educational_context(self, query: str) -> Dict[str, Any]:
        """Extract educational context from query."""
        context = {}
        
        # Subject detection
        subjects = {
            "matematika": ["matek", "számtan", "algebra", "geometria"],
            "fizika": ["fizika", "mechanika", "elektromosság"],
            "kémia": ["kémia", "molekula", "atom", "reakció"],
            "biológia": ["biológia", "élőlény", "sejt", "növény", "állat"],
            "történelem": ["történelem", "múlt", "háború", "király"],
            "irodalom": ["irodalom", "vers", "költő", "író"],
            "angol": ["angol", "english", "nyelvtan"],
            "földrajz": ["földrajz", "térkép", "ország", "kontinens"]
        }
        
        query_lower = query.lower()
        for subject, keywords in subjects.items():
            if any(keyword in query_lower for keyword in keywords):
                context["subject"] = subject
                break
        
        # Grade level detection
        grade_patterns = {
            r"\b(\d+)\.?\s*osztály": "class_grade",
            r"\b(\d+)\.?\s*évfolyam": "class_grade",
            r"\balkalmaz[oó]": "class_grade",  # Advanced level indicator
            r"\balapfok": "class_grade"  # Basic level indicator
        }
        
        import re
        for pattern, key in grade_patterns.items():
            match = re.search(pattern, query_lower)
            if match and pattern.startswith(r"\b(\d+)"):
                try:
                    context[key] = int(match.group(1))
                    break
                except (ValueError, IndexError):
                    pass
        
        return context
    
    def _cosine_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """Calculate cosine similarity between two vectors."""
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return dot_product / (norm1 * norm2)
    
    async def retrieve_by_subject(
        self,
        subject: str,
        query: str,
        k: Optional[int] = None
    ) -> List[RetrievedDocument]:
        """Retrieve documents filtered by subject."""
        filters = {"subject": subject}
        return await self.retrieve(query, k=k, filters=filters)
    
    async def retrieve_by_grade(
        self,
        grade: int,
        query: str,
        k: Optional[int] = None
    ) -> List[RetrievedDocument]:
        """Retrieve documents filtered by grade level."""
        filters = {"class_grade": grade}
        return await self.retrieve(query, k=k, filters=filters)
    
    def format_context(self, retrieved_docs: List[RetrievedDocument]) -> str:
        """Format retrieved documents as context for LLM."""
        if not retrieved_docs:
            return "Nincs releváns információ a tudásbázisban."
        
        context_parts = []
        for i, doc in enumerate(retrieved_docs, 1):
            source = doc.metadata.get("source", "Ismeretlen forrás")
            subject = doc.metadata.get("subject", "")
            grade = doc.metadata.get("class_grade", "")
            
            header = f"[Forrás {i}] {source}"
            if subject:
                header += f" - {subject}"
            if grade:
                header += f" ({grade}. osztály)"
            
            context_parts.append(f"{header}\n{doc.content}")
        
        return "\n\n".join(context_parts)