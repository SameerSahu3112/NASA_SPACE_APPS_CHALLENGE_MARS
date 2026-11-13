# Mars AI Assistant

A voice-enabled AI assistant specialized in Mars and Solar System knowledge. This AI can listen to your questions, process them using a comprehensive knowledge base, and speak back with accurate information about Mars, its missions, surface features, and the entire solar system.

## Features

### Basic Mode (No API Key Required)
- **Voice Recognition**: Listen to your questions using speech-to-text
- **Text-to-Speech**: Speak responses back to you
- **Comprehensive Knowledge Base**: Detailed information about:
  - Mars overview (characteristics, atmosphere, gravity, etc.)
  - Mars missions (past, present, and future)
  - Mars surface features (Olympus Mons, Valles Marineris, polar ice caps)
  - Mars geology and water
  - Mars habitability and potential for life
  - Human exploration challenges
  - Solar system overview
  - Interesting facts about Mars
- **Dual Mode**: Use in voice mode or text-only mode
- **Smart Query Processing**: Understands various question formats
- **Conversation History**: Maintains context during conversations

### Advanced Mode (Requires OPENAI_API_KEY or Ollama)
- **RAG (Retrieval-Augmented Generation)**: Combines vector search with LLM generation
- **Vector Database**: ChromaDB for semantic similarity search
- **Sentence Transformers**: High-quality embeddings for semantic understanding
- **OpenAI GPT Integration**: Natural language understanding and generation (paid)
- **Ollama Integration**: Local LLM - Free, private, no API key needed (recommended!)
- **NASA API Integration**: Real-time Mars rover photos and space data
- **Semantic Search**: Understands meaning, not just keywords
- **Context-Aware Responses**: LLM generates contextual, conversational answers
- **Whisper Speech Recognition**: Better accuracy for voice input

## Project Structure

```
guide/
├── mars_ai.py                  # Main application entry point
├── voice_recognition.py        # Voice recognition and text-to-speech
├── knowledge_base/
│   ├── __init__.py
│   ├── mars_knowledge.py      # Comprehensive Mars and solar system data
│   └── knowledge_manager.py   # Knowledge search and retrieval
├── models/
│   ├── __init__.py
│   ├── ai_brain.py            # Basic AI reasoning engine
│   ├── ai_brain_advanced.py   # Advanced AI with RAG and LLM
│   ├── vector_store.py        # ChromaDB vector database
│   ├── rag_pipeline.py        # RAG pipeline with OpenAI
│   ├── knowledge_indexer.py   # Knowledge base indexer
│   └── nasa_api.py           # NASA API integration
├── data/                      # Data storage (ChromaDB, etc.)
├── requirements.txt           # Python dependencies
├── .env.example              # Environment variables template
├── Dockerfile                 # Docker image configuration
├── docker-compose.yml         # Docker Compose configuration
└── README.md                  # This file
```

## Installation

### Prerequisites

- Python 3.7 or higher
- Microphone (for voice mode)
- Speakers (for text-to-speech)

### Step 1: Install Python Dependencies

```bash
cd guide
pip install -r requirements.txt
```

### Step 2: Install System Dependencies (for Voice Mode)

**macOS:**
```bash
# PortAudio is usually pre-installed
# If you encounter issues:
brew install portaudio
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install python3-pyaudio
```

**Windows:**
```bash
# Download and install PortAudio from:
# http://www.portaudio.com/download.html
# Or use pre-compiled binaries
```

### Step 3: Verify Installation

```bash
python3 -c "import speech_recognition; import pyttsx3; print('Dependencies installed successfully!')"
```

### Step 4: Advanced Mode Setup (Optional)

For advanced features (RAG, LLM, vector search), you have two options:

#### Option A: Ollama (Recommended - Free!)

1. Install Ollama from https://ollama.ai
2. Download a model:
```bash
ollama pull llama3.2
```
3. Install additional dependencies:
```bash
pip install -r requirements.txt
```
4. Run the AI and select Ollama mode

See [OLLAMA_SETUP.md](OLLAMA_SETUP.md) for detailed instructions.

#### Option B: OpenAI (Paid)

1. Copy environment template:
```bash
cp .env.example .env
```

2. Edit `.env` and add your OpenAI API key:
```
OPENAI_API_KEY=your_actual_api_key_here
```

3. Install additional dependencies:
```bash
pip install -r requirements.txt
```

The AI will automatically detect if you have an API key or Ollama installed and use advanced mode.

## Docker Installation

### Using Docker (Recommended for Easy Setup)

Docker provides a consistent environment and handles all dependencies automatically.

#### Build the Docker Image

```bash
cd guide
docker build -t mars-ai .
```

#### Run with Docker

```bash
docker run -it --rm mars-ai
```

#### Run with Docker Compose

```bash
cd guide
docker-compose up
```

#### Important Notes for Docker

- **Audio Support**: Docker containers don't have direct access to host audio devices by default
- **Linux Users**: Uncomment the `devices` section in `docker-compose.yml` to enable audio device access
- **macOS/Windows Users**: Audio support in Docker is limited; consider using text mode or running directly on host
- **Text Mode Recommended**: For Docker, text mode (option 2) works reliably across all platforms

#### Docker Volumes

The docker-compose.yml mounts:
- `./data` - For persistent data storage
- `./knowledge_base` - For easy knowledge base updates without rebuilding

## Usage

### Start the AI Assistant

```bash
cd guide
python3 mars_ai.py
```

### Voice Mode

1. Select option 1 for voice mode
2. Allow microphone access when prompted
3. Speak your questions about Mars and the solar system
4. The AI will listen, process, and speak back responses

### Text Mode

1. Select option 2 for text mode
2. Type your questions and press Enter
3. The AI will respond with text information

### Example Questions

- "Tell me about Mars"
- "What is Olympus Mons?"
- "Tell me about Mars missions"
- "What is the atmosphere of Mars like?"
- "Is Mars habitable?"
- "Tell me about the solar system"
- "What are the challenges of human exploration on Mars?"
- "Tell me an interesting fact about Mars"
- "What are Mars' moons?"
- "What is Valles Marineris?"

## AI Concepts Used

### Basic Mode

### 1. **Speech Recognition (ASR)**
- Uses Google Speech Recognition API via SpeechRecognition library
- Converts audio input to text
- Handles ambient noise adjustment

### 2. **Text-to-Speech (TTS)**
- Uses pyttsx3 for offline text-to-speech
- Configurable speech rate and volume
- Cross-platform support

### 3. **Knowledge Base**
- Structured data in Python dictionaries
- Hierarchical organization of information
- Easy to extend and update

### 4. **Information Retrieval**
- Keyword-based search algorithm
- Pattern matching for query understanding
- Context-aware responses

### 5. **Natural Language Processing (Basic)**
- Query refinement and normalization
- Intent detection (help, overview, facts, etc.)
- Conversation history management

### Advanced Mode

### 6. **Vector Database (ChromaDB)**
- Stores document embeddings for semantic search
- Persistent storage of knowledge base
- Cosine similarity for finding relevant documents
- Efficient retrieval of similar content

### 7. **Sentence Transformers**
- Uses all-MiniLM-L6-v2 for embeddings
- Converts text to high-dimensional vectors
- Captures semantic meaning of text
- Fast and accurate similarity search

### 8. **Retrieval-Augmented Generation (RAG)**
- Retrieves relevant context from vector database
- Passes context to LLM for response generation
- Combines retrieval with generation
- Maintains factual accuracy while being conversational

### 9. **OpenAI GPT Integration**
- Uses GPT-4-turbo or GPT-3.5-turbo for natural conversations
- System prompts guide AI behavior
- Temperature control for response variability
- Context window management

### 10. **NASA API Integration**
- Real-time Mars rover photos
- Astronomy Picture of the Day
- Near Earth Objects data
- Live space mission updates

## Advanced Features Usage

### Using Advanced Mode with Ollama (Recommended - Free!)

1. Install Ollama from https://ollama.ai
2. Download a model: `ollama pull llama3.2`
3. Run the AI and select "Ollama" mode when prompted
4. The AI will:
   - Index the knowledge base into a vector database
   - Use semantic search to find relevant information
   - Generate natural, conversational responses using local LLM
   - Understand context and follow-up questions
   - All data stays private on your computer!

### Using Advanced Mode with OpenAI (Paid)

1. Set up your `.env` file with your OpenAI API key
2. Run the AI and select "OpenAI" mode when prompted
3. Similar benefits to Ollama but with GPT models

### Benefits of Advanced Mode

- **Natural Conversations**: Responses feel more human-like
- **Better Understanding**: Semantic search captures meaning, not just keywords
- **Context Awareness**: Remembers conversation context for follow-up questions
- **Flexible Responses**: Can answer questions in multiple ways
- **Real-time Data**: Can fetch live data from NASA APIs
- **Private (Ollama)**: Your data never leaves your computer
- **Free (Ollama)**: No API costs, runs locally

### Performance Comparison

| Feature | Basic Mode | Ollama Mode | OpenAI Mode |
|---------|-----------|-------------|-------------|
| Speed | Fast | Moderate (local) | Fast (cloud) |
| Accuracy | High (keyword) | Very High (semantic) | Very High (semantic) |
| Natural Language | Good | Excellent | Excellent |
| Cost | Free | Free | Pay per use |
| Offline | Yes | Yes | No |
| Privacy | Full | Full | Data sent to OpenAI |
| Setup | Easy | Medium (install Ollama) | Easy (API key) |
| Context | Limited | Full | Full |

## Future Enhancements

The current implementation already includes many advanced features. Future enhancements could include:

1. **Web Interface**
   - Create a web-based chat interface
   - Real-time voice interaction in browser
   - Visual aids (images, diagrams, 3D Mars models)

2. **Local LLM Support**
   - Add Ollama integration for local models
   - Run Llama 2 or Mistral locally
   - No API key required, fully offline

3. **Multi-modal AI**
   - Process images (Mars rover photos)
   - Generate visual explanations
   - Image-to-text capabilities

4. **Custom Training**
   - Fine-tune models on Mars-specific data
   - Domain-specific embeddings
   - Specialized Mars knowledge graph

5. **Real-time Mission Tracking**
   - Live Mars rover status updates
   - Mission telemetry data
   - Social media integration

## Troubleshooting

### Microphone Not Detected
- Check system microphone permissions
- Verify microphone is not in use by another application
- Try a different microphone

### Speech Recognition Errors
- Ensure good internet connection (Google Speech Recognition requires internet)
- Speak clearly and at moderate volume
- Reduce background noise

### Text-to-Speech Issues
- Check system audio output
- Verify speakers are working
- Try different TTS engines if available

### Import Errors
- Ensure all dependencies are installed: `pip install -r requirements.txt`
- Check Python version (3.7+ required)
- Verify you're in the correct directory

## Knowledge Base

The AI knows about:

### Mars
- Physical characteristics (size, gravity, temperature)
- Atmosphere composition and pressure
- Surface features (volcanoes, canyons, ice caps)
- Geology and internal structure
- Water history and current state
- Moons (Phobos and Deimos)
- Habitability and potential for life
- Past, present, and future missions
- Human exploration challenges

### Solar System
- Sun characteristics
- All 8 planets
- Asteroid belt
- Kuiper belt
- Oort cloud

## License

This project is part of the NASA Space Apps Challenge - Mars.

## Contributing

To extend the knowledge base:
1. Edit `knowledge_base/mars_knowledge.py`
2. Add new information to the appropriate dictionary
3. Update `knowledge_manager.py` if needed

To enhance AI capabilities:
1. Modify `models/ai_brain.py`
2. Add new processing logic
3. Integrate additional AI libraries as needed

## Acknowledgments

- NASA for Mars and solar system data
- SpeechRecognition library for voice recognition
- pyttsx3 for text-to-speech functionality
