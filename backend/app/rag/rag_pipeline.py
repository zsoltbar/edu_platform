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
import openai
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
        chunk_size: int = 1000,
        chunk_overlap: int = 200
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
        """
        self.openai_api_key = openai_api_key
        self.openai_model = openai_model
        
        # Initialize OpenAI client
        self.openai_client = OpenAI(api_key=openai_api_key)
        
        # Initialize components
        self.embedding_service = EmbeddingService(
            openai_api_key=openai_api_key,
            model_name=embedding_model
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
            embedding_service=self.embedding_service
        )
    
    async def ingest_document(
        self,
        file_path: Union[str, Path],
        metadata: Optional[Dict[str, Any]] = None,
        use_openai_embeddings: bool = False
    ) -> int:
        """
        Ingest a single document into the knowledge base.
        
        Args:
            file_path: Path to the document file
            metadata: Additional metadata for the document
            use_openai_embeddings: Whether to use OpenAI embeddings
            
        Returns:
            Number of chunks processed
        """
        logger.info(f"Ingesting document: {file_path}")
        
        try:
            # Process document into chunks
            chunks = self.document_processor.process_file(file_path, metadata)
            
            if not chunks:
                logger.warning(f"No chunks extracted from {file_path}")
                return 0
            
            # Generate embeddings
            chunk_texts = [chunk.content for chunk in chunks]
            embeddings = await self.embedding_service.embed_documents(
                chunk_texts,
                use_openai=use_openai_embeddings
            )
            
            # Prepare data for vector store
            documents = [chunk.content for chunk in chunks]
            metadatas = [chunk.metadata for chunk in chunks]
            ids = [chunk.chunk_id for chunk in chunks]
            
            # Add to vector store
            self.vector_store.add_documents(
                documents=documents,
                metadatas=metadatas,
                embeddings=embeddings,
                ids=ids
            )
            
            logger.info(f"Successfully ingested {len(chunks)} chunks from {file_path}")
            return len(chunks)
            
        except Exception as e:
            logger.error(f"Error ingesting document {file_path}: {e}")
            raise
    
    async def ingest_directory(
        self,
        directory_path: Union[str, Path],
        file_extensions: List[str] = None,
        recursive: bool = True,
        base_metadata: Optional[Dict[str, Any]] = None,
        use_openai_embeddings: bool = False
    ) -> Dict[str, int]:
        """
        Ingest all documents from a directory.
        
        Args:
            directory_path: Path to directory
            file_extensions: List of file extensions to process
            recursive: Whether to process subdirectories
            base_metadata: Base metadata for all documents
            use_openai_embeddings: Whether to use OpenAI embeddings
            
        Returns:
            Dictionary mapping file paths to number of chunks processed
        """
        directory_path = Path(directory_path)
        file_extensions = file_extensions or ['.pdf', '.docx', '.txt', '.md']
        
        if not directory_path.exists():
            raise FileNotFoundError(f"Directory not found: {directory_path}")
        
        results = {}
        
        # Find files to process
        if recursive:
            files = []
            for ext in file_extensions:
                files.extend(directory_path.rglob(f"*{ext}"))
        else:
            files = []
            for ext in file_extensions:
                files.extend(directory_path.glob(f"*{ext}"))
        
        logger.info(f"Found {len(files)} files to process in {directory_path}")
        
        # Process files
        for file_path in files:
            try:
                # Create metadata including directory structure
                file_metadata = {
                    "directory": str(file_path.parent.relative_to(directory_path)),
                    **(base_metadata or {})
                }
                
                chunk_count = await self.ingest_document(
                    file_path,
                    metadata=file_metadata,
                    use_openai_embeddings=use_openai_embeddings
                )
                results[str(file_path)] = chunk_count
                
            except Exception as e:
                logger.error(f"Error processing {file_path}: {e}")
                results[str(file_path)] = 0
        
        total_chunks = sum(results.values())
        logger.info(f"Ingested {total_chunks} total chunks from {len(files)} files")
        return results
    
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
1. Válaszolj a kérdésekre a megadott kontextus alapján
2. Ha a kontextusban nincs releváns információ, jelezd ezt
3. Használj egyszerű, érthető nyelvet
4. Adj konkrét példákat, ha lehet
5. Segíts a tanulási folyamatban

Stílus:
- Barátságos és támogató hangnem
- Pedagógiai szemlélet
- Magyar nyelv használata
- Strukturált válaszok

Ha bizonytalan vagy, kérdezz vissza vagy javasolj további forrásokat."""
    
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
            
            # Get sample documents to analyze
            sample_docs = self.vector_store.get_documents_by_metadata({}, limit=100)
            
            subjects = set()
            grades = set()
            sources = set()
            
            if sample_docs["metadatas"]:
                for metadata in sample_docs["metadatas"]:
                    if metadata.get("subject"):
                        subjects.add(metadata["subject"])
                    if metadata.get("class_grade"):
                        grades.add(metadata["class_grade"])
                    if metadata.get("source"):
                        sources.add(metadata["source"])
            
            return {
                "total_documents": total_docs,
                "subjects": sorted(list(subjects)),
                "grades": sorted(list(grades)),
                "sources_count": len(sources),
                "embedding_dimension": self.embedding_service.get_embedding_dimension()
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
    
    async def ingest_directory(
        self,
        directory_path: str,
        base_metadata: Optional[Dict[str, Any]] = None,
        use_openai_embeddings: bool = False
    ) -> Dict[str, int]:
        """
        Ingest all documents from a directory.
        
        Args:
            directory_path: Path to directory containing documents
            base_metadata: Base metadata to apply to all documents
            use_openai_embeddings: Whether to use OpenAI embeddings
            
        Returns:
            Dictionary mapping filename to number of chunks processed
        """
        directory_path = Path(directory_path)
        if not directory_path.exists():
            raise ValueError(f"Directory does not exist: {directory_path}")
        
        results = {}
        
        for file_path in directory_path.iterdir():
            if file_path.is_file() and file_path.suffix.lower() in {'.pdf', '.docx', '.txt', '.md'}:
                try:
                    chunks_processed = await self.ingest_document(
                        file_path=file_path,
                        metadata=base_metadata,
                        use_openai_embeddings=use_openai_embeddings
                    )
                    results[file_path.name] = chunks_processed
                    logger.info(f"Processed {file_path.name}: {chunks_processed} chunks")
                except Exception as e:
                    logger.error(f"Error processing {file_path.name}: {e}")
                    results[file_path.name] = 0
        
        return results