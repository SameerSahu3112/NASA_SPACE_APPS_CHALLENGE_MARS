# Mars AI - Advanced Features Guide

## Overview

The Mars AI now supports two modes:
- **Basic Mode**: Uses keyword-based search and knowledge base (no API key required)
- **Advanced Mode**: Uses RAG, vector database, and LLM for natural conversations (requires OpenAI API key)

## Advanced Mode Features

### 1. Vector Database (ChromaDB)
- **Purpose**: Stores document embeddings for semantic similarity search
- **Benefits**: Understands meaning, not just keywords
- **Storage**: Persistent in `data/chroma_db/`
- **Similarity Metric**: Cosine similarity

### 2. Sentence Transformers
- **Model**: all-MiniLM-L6-v2 (fast, efficient)
- **Alternative**: all-mpnet-base-v2 (better quality, slower)
- **Purpose**: Converts text to high-dimensional vectors
- **Capability**: Captures semantic meaning of text

### 3. RAG Pipeline (Retrieval-Augmented Generation)
- **Process**:
  1. User asks a question
  2. Vector store searches for relevant documents
  3. Retrieved context is passed to LLM
  4. LLM generates natural, contextual response
- **Benefits**: Accurate + conversational responses

### 4. OpenAI GPT Integration
- **Models**: GPT-4-turbo-preview (default) or GPT-3.5-turbo
- **System Prompt**: Guides AI to be Mars-focused
- **Temperature**: 0.7 (balanced creativity)
- **Max Tokens**: 1000

### 5. NASA API Integration
- **Mars Rover Photos**: Get real photos from Curiosity, Opportunity, Spirit
- **Astronomy Picture of the Day**: Daily space imagery
- **Near Earth Objects**: Track asteroids and comets
- **Mars Weather**: Weather patterns and conditions

## Setup Instructions

### Step 1: Install Dependencies

```bash
cd guide
pip install -r requirements.txt
```

### Step 2: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add:
```
OPENAI_API_KEY=your_actual_api_key_here
OPENAI_MODEL=gpt-4-turbo-preview
```

### Step 3: Run the AI

```bash
python3 mars_ai.py
```

Select "Advanced" mode when prompted.

## Architecture

```
User Query
    ↓
Query Refinement
    ↓
Vector Store Search (ChromaDB)
    ↓
Retrieve Top-K Documents
    ↓
Build Context
    ↓
OpenAI GPT Generation
    ↓
Natural Response
```

## File Structure

```
models/
├── vector_store.py          # ChromaDB wrapper
├── rag_pipeline.py          # RAG with OpenAI
├── knowledge_indexer.py     # Convert knowledge to documents
├── ai_brain_advanced.py     # Advanced AI brain
└── nasa_api.py             # NASA API integration
```

## Performance Tips

### For Speed
- Use GPT-3.5-turbo instead of GPT-4
- Use all-MiniLM-L6-v2 embeddings
- Reduce RAG_TOP_K_RESULTS to 3

### For Quality
- Use GPT-4-turbo-preview
- Use all-mpnet-base-v2 embeddings
- Increase RAG_TOP_K_RESULTS to 7

### For Cost
- Use GPT-3.5-turbo (cheaper)
- Cache frequent queries
- Use Basic mode when possible

## Troubleshooting

### OpenAI API Errors
- Check your API key is valid
- Ensure you have credits in your OpenAI account
- Verify internet connection

### ChromaDB Errors
- Delete `data/chroma_db/` and reindex
- Check disk space
- Ensure write permissions

### Embedding Model Errors
- First run downloads model (~100MB)
- Ensure sufficient disk space
- Check internet connection for first download

## Comparison: Basic vs Advanced

| Feature | Basic | Advanced |
|---------|-------|----------|
| Search Type | Keyword | Semantic |
| Response Style | Structured | Conversational |
| Understanding | Good | Excellent |
| API Required | No | Yes (OpenAI) |
| Offline Capable | Yes | No |
| Speed | Fast | Moderate |
| Cost | Free | Pay-per-use |
| Context Memory | Limited | Full |

## Example Queries

### Basic Mode Works Well
- "What is Olympus Mons?"
- "Tell me about Mars missions"
- "How many moons does Mars have?"

### Advanced Mode Excels
- "Compare Olympus Mons to Mount Everest"
- "Why is Mars called the Red Planet?"
- "What would it be like to live on Mars?"
- "Explain the challenges of human Mars exploration"

## Future Enhancements

- [ ] Local LLM support (Ollama)
- [ ] Multi-modal AI (image processing)
- [ ] Web interface
- [ ] Real-time mission telemetry
- [ ] 3D Mars visualization
- [ ] Custom fine-tuning

## API Costs (Estimates)

OpenAI API costs (as of 2024):
- GPT-3.5-turbo: ~$0.002 per 1K tokens
- GPT-4-turbo: ~$0.01 per 1K tokens

Typical Mars AI query: ~500 tokens
- GPT-3.5: ~$0.001 per query
- GPT-4: ~$0.005 per query

100 queries/day:
- GPT-3.5: ~$3/month
- GPT-4: ~$15/month
