"""
Vector Store
===========

Manages vector storage and similarity search using ChromaDB.
Handles document storage, embedding indexing, and retrieval.
"""

import logging
import uuid
from typing import List, Dict, Any, Optional, Tuple
import chromadb
from chromadb.config import Settings
import numpy as np

logger = logging.getLogger(__name__)

class VectorStore:
    """Vector database for storing and retrieving document embeddings."""
    
    def __init__(
        self,
        collection_name: str = "school_knowledge",
        persist_directory: str = "./chroma_db",
        embedding_function=None
    ):
        """
        Initialize vector store.
        
        Args:
            collection_name: Name of the collection
            persist_directory: Directory to persist the database
            embedding_function: Custom embedding function
        """
        self.collection_name = collection_name
        self.persist_directory = persist_directory
        
        # Initialize ChromaDB client
        self.client = chromadb.PersistentClient(
            path=persist_directory,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        
        # Get or create collection
        try:
            self.collection = self.client.get_collection(
                name=collection_name,
                embedding_function=embedding_function
            )
            logger.info(f"Loaded existing collection: {collection_name}")
        except Exception:
            self.collection = self.client.create_collection(
                name=collection_name,
                embedding_function=embedding_function,
                metadata={"hnsw:space": "cosine"}
            )
            logger.info(f"Created new collection: {collection_name}")
    
    def add_documents(
        self,
        documents: List[str],
        metadatas: List[Dict[str, Any]],
        embeddings: Optional[List[np.ndarray]] = None,
        ids: Optional[List[str]] = None
    ) -> List[str]:
        """
        Add documents to the vector store.
        
        Args:
            documents: List of document texts
            metadatas: List of metadata dictionaries
            embeddings: Pre-computed embeddings (optional)
            ids: Document IDs (optional, will generate if not provided)
            
        Returns:
            List of document IDs
        """
        # Generate IDs if not provided
        if ids is None:
            ids = [str(uuid.uuid4()) for _ in documents]
        
        # Convert embeddings to lists if provided
        if embeddings is not None:
            embeddings = [emb.tolist() if isinstance(emb, np.ndarray) else emb 
                         for emb in embeddings]
        
        try:
            self.collection.add(
                documents=documents,
                metadatas=metadatas,
                embeddings=embeddings,
                ids=ids
            )
            logger.info(f"Added {len(documents)} documents to vector store")
            return ids
        except Exception as e:
            logger.error(f"Error adding documents: {e}")
            raise
    
    def similarity_search(
        self,
        query: str,
        n_results: int = 5,
        where: Optional[Dict[str, Any]] = None,
        query_embedding: Optional[np.ndarray] = None
    ) -> Dict[str, Any]:
        """
        Search for similar documents.
        
        Args:
            query: Search query text
            n_results: Number of results to return
            where: Metadata filter conditions
            query_embedding: Pre-computed query embedding
            
        Returns:
            Search results with documents, metadatas, and distances
        """
        try:
            # Use embedding if provided, otherwise let ChromaDB handle it
            if query_embedding is not None:
                query_embeddings = [query_embedding.tolist()]
                results = self.collection.query(
                    query_embeddings=query_embeddings,
                    n_results=n_results,
                    where=where,
                    include=["documents", "metadatas", "distances"]
                )
            else:
                results = self.collection.query(
                    query_texts=[query],
                    n_results=n_results,
                    where=where,
                    include=["documents", "metadatas", "distances"]
                )
            
            return results
        except Exception as e:
            logger.error(f"Error during similarity search: {e}")
            return {"documents": [[]], "metadatas": [[]], "distances": [[]]}
    
    def get_documents_by_metadata(
        self,
        where: Dict[str, Any],
        limit: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get documents by metadata filter.
        
        Args:
            where: Metadata filter conditions (empty dict means get all)
            limit: Maximum number of results
            
        Returns:
            Filtered documents
        """
        try:
            # Handle empty where clause - ChromaDB requires either a proper where clause or None
            if not where:
                results = self.collection.get(
                    limit=limit,
                    include=["documents", "metadatas"]
                )
            else:
                results = self.collection.get(
                    where=where,
                    limit=limit,
                    include=["documents", "metadatas"]
                )
            return results
        except Exception as e:
            logger.error(f"Error getting documents by metadata: {e}")
            return {"documents": [], "metadatas": []}
    
    def update_document(
        self,
        document_id: str,
        document: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        embedding: Optional[np.ndarray] = None
    ):
        """
        Update an existing document.
        
        Args:
            document_id: ID of the document to update
            document: New document text
            metadata: New metadata
            embedding: New embedding
        """
        try:
            update_data = {"ids": [document_id]}
            
            if document is not None:
                update_data["documents"] = [document]
            if metadata is not None:
                update_data["metadatas"] = [metadata]
            if embedding is not None:
                update_data["embeddings"] = [embedding.tolist()]
            
            self.collection.update(**update_data)
            logger.info(f"Updated document: {document_id}")
        except Exception as e:
            logger.error(f"Error updating document: {e}")
            raise
    
    def delete_documents(self, ids: List[str]):
        """Delete documents by IDs."""
        try:
            self.collection.delete(ids=ids)
            logger.info(f"Deleted {len(ids)} documents")
        except Exception as e:
            logger.error(f"Error deleting documents: {e}")
            raise
    
    def delete_by_metadata(self, where: Dict[str, Any]):
        """Delete documents by metadata filter."""
        try:
            self.collection.delete(where=where)
            logger.info(f"Deleted documents matching filter: {where}")
        except Exception as e:
            logger.error(f"Error deleting documents by metadata: {e}")
            raise
    
    def count_documents(self) -> int:
        """Get total number of documents in the collection."""
        try:
            return self.collection.count()
        except Exception as e:
            logger.error(f"Error counting documents: {e}")
            return 0
    
    def reset_collection(self):
        """Delete all documents from the collection."""
        try:
            self.client.delete_collection(name=self.collection_name)
            self.collection = self.client.create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"}
            )
            logger.info(f"Reset collection: {self.collection_name}")
        except Exception as e:
            logger.error(f"Error resetting collection: {e}")
            raise