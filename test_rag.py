#!/usr/bin/env python3
"""
RAG System Test Script
======================

Simple test script to verify RAG system functionality.
"""

import asyncio
import os
import sys
from pathlib import Path

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent.parent))

from backend.app.rag.rag_pipeline import RAGPipeline
from backend.app.config import settings

async def test_rag_system():
    """Test the RAG system components."""
    print("🧠 Testing RAG System...")
    
    # Check if OpenAI API key is available
    if not settings.OPENAI_API_KEY:
        print("❌ OPENAI_API_KEY not found in environment")
        print("   Please set your OpenAI API key in .env file")
        return False
    
    try:
        # Initialize RAG pipeline
        print("📚 Initializing RAG pipeline...")
        rag = RAGPipeline(
            openai_api_key=settings.OPENAI_API_KEY,
            vector_store_path="./test_chroma_db",
            collection_name="test_knowledge"
        )
        
        # Create test document
        test_content = """
        Matematika - Pitagorasz tétel
        
        A Pitagorasz tétel a geometria egyik legfontosabb tétele.
        
        A tétel kimondja: Derékszögű háromszögben a befogók négyzetének 
        összege megegyezik az átfogó négyzetével.
        
        Képletben: a² + b² = c²
        
        ahol a és b a befogók hossza, c pedig az átfogó hossza.
        
        Példa:
        Ha egy derékszögű háromszög befogói 3 és 4 egység hosszúak,
        akkor az átfogó hossza: √(3² + 4²) = √(9 + 16) = √25 = 5 egység.
        """
        
        # Create test document file
        test_file = Path("test_document.txt")
        test_file.write_text(test_content, encoding='utf-8')
        
        print("📄 Ingesting test document...")
        chunks = await rag.ingest_document(
            file_path=test_file,
            metadata={
                "subject": "Matematika",
                "class_grade": 9,
                "source": "test_document"
            },
            use_openai_embeddings=False  # Use local embeddings for testing
        )
        
        print(f"✅ Document processed into {chunks} chunks")
        
        # Test query
        print("\n🔍 Testing RAG query...")
        test_query = "Mi a Pitagorasz tétel?"
        
        response = await rag.generate_response(
            query=test_query,
            context_k=3,
            max_tokens=200,
            temperature=0.7
        )
        
        print(f"❓ Query: {test_query}")
        print(f"🤖 Response: {response['answer']}")
        print(f"📊 Context used: {response['context_used']}")
        print(f"📚 Sources: {response['num_sources']}")
        
        # Test search
        print("\n🔎 Testing knowledge base search...")
        search_results = await rag.search_knowledge_base(
            query="Pitagorasz tétel példa",
            k=2
        )
        
        print(f"📋 Search results: {len(search_results)} documents found")
        for i, result in enumerate(search_results):
            print(f"   {i+1}. Score: {result['score']:.3f}")
            print(f"      Content preview: {result['content'][:100]}...")
        
        # Get stats
        print("\n📈 Knowledge base statistics:")
        stats = rag.get_knowledge_base_stats()
        for key, value in stats.items():
            print(f"   {key}: {value}")
        
        # Cleanup
        test_file.unlink(missing_ok=True)
        rag.vector_store.reset_collection()
        
        print("\n✅ RAG system test completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ RAG system test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🚀 Starting RAG System Test\n")
    success = asyncio.run(test_rag_system())
    
    if success:
        print("\n🎉 All tests passed! RAG system is ready to use.")
        print("\nNext steps:")
        print("1. Start the backend server: cd backend && uvicorn app.main:app --reload")
        print("2. Upload documents via /api/rag/upload endpoint") 
        print("3. Test AI chat via /api/rag/query endpoint")
    else:
        print("\n💥 Tests failed. Please check the error messages above.")
        sys.exit(1)