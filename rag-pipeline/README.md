# RAG Document Processing Pipeline

This standalone pipeline is used to batch process documents and ingest them into the ChromaDB vector database used by the backend application.

## Folder Structure

- `src/` - Core processing modules extracted from the backend
- `documents/` - Place your documents here for batch processing
- `document_processor.ipynb` - Main Jupyter notebook for batch processing
- `requirements.txt` - Python dependencies

## Usage

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Configure your `.env` file with the necessary settings

3. Place documents to process in the `documents/` folder

4. Run the Jupyter notebook `document_processor.ipynb` to batch process all documents

## Features

- Supports PDF, DOCX, TXT, and Markdown files
- Automatic text extraction and chunking
- Metadata extraction from filenames and content
- Direct integration with the backend's ChromaDB database
- Progress tracking and error handling
- Batch processing with configurable parameters

## Document Handling

The documents folder should contain the documents you want to process and add to the knowledge base. The pipeline will automatically extract grade, subject, and topic information from filenames.

## Supported Formats

- PDF files (`.pdf`)
- Word documents (`.docx`, `.doc`) 
- Plain text files (`.txt`)
- Markdown files (`.md`, `.markdown`)

## Recommended Naming Convention

For best metadata extraction, use descriptive filenames that include:
- Grade level: `grade_5_`, `grade_8_`, etc.
- Subject: `math_`, `science_`, `history_`, etc.
- Topic/difficulty: `algebra_`, `basic_`, `advanced_`, etc.

## Examples

- `grade_5_math_basic_addition.pdf`
- `grade_8_science_biology_cells.docx`
- `grade_10_history_world_war_2.txt`
- `math_algebra_quadratic_equations.md`

## Processing Notes

- The pipeline will automatically extract metadata from filenames
- Large files will be chunked into smaller segments for better retrieval
- All processed documents will be added to the same ChromaDB used by the backend
- Progress and statistics will be shown during processing