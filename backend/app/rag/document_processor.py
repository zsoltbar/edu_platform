"""
Document Processor
=================

Handles document ingestion, preprocessing, and chunking for RAG pipeline.
Supports various document formats including PDF, DOCX, TXT, and Markdown.
"""

import logging
import re
from pathlib import Path
from typing import List, Dict, Any, Optional, Union
import hashlib

# Document processing imports (with fallbacks)
try:
    import PyPDF2
    HAS_PDF = True
except ImportError:
    HAS_PDF = False

try:
    import docx
    HAS_DOCX = True
except ImportError:
    HAS_DOCX = False

try:
    import markdown
    HAS_MARKDOWN = True
except ImportError:
    HAS_MARKDOWN = False

logger = logging.getLogger(__name__)

class DocumentChunk:
    """Represents a chunk of processed document."""
    
    def __init__(
        self,
        content: str,
        metadata: Dict[str, Any],
        chunk_id: Optional[str] = None
    ):
        self.content = content
        self.metadata = metadata
        self.chunk_id = chunk_id or self._generate_id()
    
    def _generate_id(self) -> str:
        """Generate unique ID for the chunk."""
        content_hash = hashlib.md5(self.content.encode()).hexdigest()
        return f"chunk_{content_hash[:12]}"

class DocumentProcessor:
    """Processes documents for RAG pipeline."""
    
    def __init__(
        self,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        min_chunk_size: int = 100
    ):
        """
        Initialize document processor.
        
        Args:
            chunk_size: Maximum size of each chunk (in characters)
            chunk_overlap: Overlap between consecutive chunks
            min_chunk_size: Minimum size for a chunk to be valid
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.min_chunk_size = min_chunk_size
    
    def process_file(
        self,
        file_path: Union[str, Path],
        source_metadata: Optional[Dict[str, Any]] = None
    ) -> List[DocumentChunk]:
        """
        Process a file into document chunks.
        
        Args:
            file_path: Path to the file
            source_metadata: Additional metadata for the document
            
        Returns:
            List of document chunks
        """
        file_path = Path(file_path)
        
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Extract text based on file type
        text = self._extract_text(file_path)
        
        # Create base metadata
        metadata = {
            "source": str(file_path),
            "filename": file_path.name,
            "file_type": file_path.suffix.lower(),
            "file_size": file_path.stat().st_size,
            **(source_metadata or {})
        }
        
        # Process text into chunks
        return self.process_text(text, metadata)
    
    def process_text(
        self,
        text: str,
        base_metadata: Optional[Dict[str, Any]] = None
    ) -> List[DocumentChunk]:
        """
        Process text into document chunks.
        
        Args:
            text: Text content to process
            base_metadata: Base metadata for all chunks
            
        Returns:
            List of document chunks
        """
        # Clean and normalize text
        cleaned_text = self._clean_text(text)
        
        # Split into chunks
        chunks = self._split_text(cleaned_text)
        
        # Create DocumentChunk objects
        document_chunks = []
        for i, chunk_text in enumerate(chunks):
            if len(chunk_text.strip()) >= self.min_chunk_size:
                chunk_metadata = {
                    "chunk_index": i,
                    "chunk_count": len(chunks),
                    "char_count": len(chunk_text),
                    "word_count": len(chunk_text.split()),
                    **(base_metadata or {})
                }
                
                chunk = DocumentChunk(
                    content=chunk_text.strip(),
                    metadata=chunk_metadata
                )
                document_chunks.append(chunk)
        
        logger.info(f"Processed text into {len(document_chunks)} chunks")
        return document_chunks
    
    def _extract_text(self, file_path: Path) -> str:
        """Extract text from various file formats."""
        suffix = file_path.suffix.lower()
        
        try:
            if suffix == '.pdf':
                return self._extract_pdf_text(file_path)
            elif suffix in ['.docx', '.doc']:
                return self._extract_docx_text(file_path)
            elif suffix == '.md':
                return self._extract_markdown_text(file_path)
            elif suffix in ['.txt', '.text']:
                return self._extract_plain_text(file_path)
            else:
                # Try as plain text
                logger.warning(f"Unknown file type {suffix}, treating as plain text")
                return self._extract_plain_text(file_path)
        except Exception as e:
            logger.error(f"Error extracting text from {file_path}: {e}")
            return ""
    
    def _extract_pdf_text(self, file_path: Path) -> str:
        """Extract text from PDF file."""
        if not HAS_PDF:
            raise ImportError("PyPDF2 not available for PDF processing")
        
        text = ""
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        return text
    
    def _extract_docx_text(self, file_path: Path) -> str:
        """Extract text from DOCX file."""
        if not HAS_DOCX:
            raise ImportError("python-docx not available for DOCX processing")
        
        doc = docx.Document(file_path)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text
    
    def _extract_markdown_text(self, file_path: Path) -> str:
        """Extract text from Markdown file."""
        with open(file_path, 'r', encoding='utf-8') as file:
            md_content = file.read()
        
        if HAS_MARKDOWN:
            # Convert to plain text (remove markdown formatting)
            md = markdown.Markdown()
            html = md.convert(md_content)
            # Simple HTML tag removal
            text = re.sub(r'<[^>]+>', '', html)
            return text
        else:
            # Return raw markdown
            return md_content
    
    def _extract_plain_text(self, file_path: Path) -> str:
        """Extract text from plain text file."""
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text."""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters but keep basic punctuation
        text = re.sub(r'[^\w\s\.,!?;:()"-]', '', text)
        
        # Normalize quotes
        text = re.sub(r'[""]', '"', text)
        text = re.sub(r'['']', "'", text)
        
        return text.strip()
    
    def _split_text(self, text: str) -> List[str]:
        """Split text into chunks with overlap."""
        if len(text) <= self.chunk_size:
            return [text]
        
        chunks = []
        start = 0
        
        while start < len(text):
            # Calculate end position
            end = start + self.chunk_size
            
            if end >= len(text):
                # Last chunk
                chunks.append(text[start:])
                break
            
            # Try to break at sentence boundary
            chunk_text = text[start:end]
            
            # Look for sentence endings near the end
            sentence_endings = ['.', '!', '?', '\n']
            best_break = -1
            
            for i in range(len(chunk_text) - 1, max(0, len(chunk_text) - 200), -1):
                if chunk_text[i] in sentence_endings and chunk_text[i + 1].isspace():
                    best_break = i + 1
                    break
            
            if best_break > 0:
                # Break at sentence ending
                chunks.append(text[start:start + best_break])
                start = start + best_break - self.chunk_overlap
            else:
                # Break at word boundary
                words = chunk_text.split()
                if len(words) > 1:
                    chunk_text = ' '.join(words[:-1])
                chunks.append(chunk_text)
                start = start + len(chunk_text) - self.chunk_overlap
            
            # Ensure we make progress
            if start <= len(chunks[-1]) if chunks else 0:
                start = (len(chunks[-1]) if chunks else 0) + 1
        
        return chunks
    
    def extract_metadata_from_content(self, text: str) -> Dict[str, Any]:
        """Extract metadata from document content."""
        metadata = {}
        
        # Basic statistics
        metadata['char_count'] = len(text)
        metadata['word_count'] = len(text.split())
        metadata['line_count'] = text.count('\n') + 1
        
        # Try to extract title (first line if it looks like a title)
        lines = text.split('\n')
        if lines:
            first_line = lines[0].strip()
            if len(first_line) < 100 and first_line:
                metadata['title'] = first_line
        
        # Language detection could be added here
        # metadata['language'] = detect_language(text)
        
        return metadata