FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for better caching)
COPY requirements.txt .

# Create a modified requirements.txt for Docker (skip audio dependencies)
RUN sed -i -e '/pyaudio/d' -e '/whisper/d' requirements.txt

# Install Python dependencies (without audio packages)
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Create data directory
RUN mkdir -p data

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Expose port (optional, for future web interface)
EXPOSE 8000

# Default command
CMD ["python3", "mars_ai.py"]
