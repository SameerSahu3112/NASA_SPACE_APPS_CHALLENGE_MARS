# Ollama Setup Guide

## What is Ollama?

Ollama is a free, open-source tool that lets you run large language models (LLMs) locally on your computer. It's:
- **Free**: No API costs
- **Private**: Your data stays on your computer
- **Fast**: Runs locally without internet
- **Easy**: Simple installation and use

## Installation

### macOS (Recommended)

```bash
# Install using Homebrew
brew install ollama

# Or download from https://ollama.ai
```

### Linux

```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Windows

Download from https://ollama.ai and run the installer

## Download the Model

After installing Ollama, download a model:

```bash
# Download Llama 3.2 (recommended - fast and smart)
ollama pull llama3.2

# Or Llama 3 (larger, more capable)
ollama pull llama3

# Or Mistral (good balance)
ollama pull mistral

# Or Phi (smaller, faster)
ollama pull phi
```

## Verify Installation

```bash
# Check Ollama is running
ollama --version

# Test the model
ollama run llama3.2 "Hello, how are you?"
```

## Configure Mars AI

### Option 1: Auto-detection (Easiest)

The Mars AI will automatically detect if Ollama is installed and use it!

Just run:
```bash
python3 mars_ai.py
```

Select option 1 (Ollama) when prompted.

### Option 2: Manual Configuration

1. Copy environment template:
```bash
cp .env.example .env
```

2. Edit `.env` and set:
```
OLLAMA_MODEL=llama3.2
```

3. Run the AI:
```bash
python3 mars_ai.py
```

## Model Comparison

| Model | Size | Speed | Quality | RAM Required |
|-------|------|-------|---------|--------------|
| phi | 2GB | Very Fast | Good | 4GB |
| llama3.2 | 4GB | Fast | Excellent | 8GB |
| llama3 | 8GB | Moderate | Best | 16GB |
| mistral | 7GB | Moderate | Very Good | 14GB |

**Recommendation**: Start with `llama3.2` - best balance of speed and quality.

## Troubleshooting

### Ollama not found

**Error**: `ollama: command not found`

**Solution**: Make sure Ollama is installed and in your PATH. Restart your terminal after installation.

### Model not found

**Error**: `model 'llama3.2' not found`

**Solution**: Download the model first:
```bash
ollama pull llama3.2
```

### Out of memory

**Error**: Out of memory errors

**Solution**: Use a smaller model like `phi` or close other applications.

### Ollama not running

**Error**: Connection refused

**Solution**: Make sure Ollama daemon is running:
```bash
# macOS/Linux
ollama serve

# Windows
Ollama should be running in the background
```

## Using Different Models

To change the model used by Mars AI:

1. Edit `.env`:
```
OLLAMA_MODEL=mistral
```

2. Or select a different model when prompted

3. Or change at runtime:
```python
mars_ai.brain.change_model("mistral")
```

## Performance Tips

### For Best Speed
- Use `phi` model (smallest)
- Use `tiny` Whisper model for speech
- Close other applications

### For Best Quality
- Use `llama3` model (largest)
- Use `base` or `small` Whisper model
- Ensure sufficient RAM

### For Balanced (Recommended)
- Use `llama3.2` model
- Use `base` Whisper model
- Standard configuration

## Whisper Setup (Optional)

Whisper is used for speech recognition. To use it:

1. Install dependencies:
```bash
pip install openai-whisper faster-whisper
```

2. The AI will automatically use Whisper when available

3. Configure model in `.env`:
```
WHISPER_MODEL=base
```

Whisper models:
- `tiny`: Fastest (~1GB)
- `base`: Recommended (~1GB)
- `small`: Better (~2GB)
- `medium`: Very good (~5GB)
- `large`: Best (~10GB)

## Comparison: Ollama vs OpenAI

| Feature | Ollama | OpenAI |
|---------|--------|--------|
| Cost | Free | Pay per use |
| Privacy | 100% Private | Data sent to OpenAI |
| Internet | Not required | Required |
| Speed | Fast (depends on hardware) | Very Fast |
| Quality | Excellent | Excellent |
| Setup | Requires installation | Just API key |
| Models | Llama, Mistral, etc. | GPT-3.5, GPT-4 |

## System Requirements

### Minimum
- RAM: 4GB
- Storage: 10GB
- OS: macOS, Linux, Windows

### Recommended
- RAM: 8GB+
- Storage: 20GB+
- GPU: Optional (but helps)

### For Best Performance
- RAM: 16GB+
- Storage: 50GB+
- GPU: NVIDIA (for CUDA acceleration)

## Next Steps

1. Install Ollama: https://ollama.ai
2. Download a model: `ollama pull llama3.2`
3. Install Python dependencies: `pip install -r requirements.txt`
4. Run the AI: `python3 mars_ai.py`
5. Select Ollama mode

Enjoy your free, private, local AI! 🚀
