import whisper
import pyttsx3
import time
import threading
import os
import numpy as np
from typing import Optional

class WhisperVoiceAssistant:
    """Voice assistant using Whisper for speech recognition"""

    def __init__(self, model_size: str = "base"):
        """
        Initialize Whisper voice assistant
        model_size: tiny, base, small, medium, large (base is recommended for speed)
        """
        self.audio_available = True
        self.model_size = model_size
        self.model = None
        self.engine = None
        self.is_listening = False
        self.listening_thread = None

        # Check if running in Docker
        if os.path.exists('/.dockerenv'):
            print("Running in Docker. Audio not available.")
            self.audio_available = False
            return

        # Initialize Whisper model
        try:
            print(f"Loading Whisper model ({model_size})...")
            self.model = whisper.load_model(model_size)
            print("Whisper model loaded successfully!")
        except Exception as e:
            print(f"Error loading Whisper model: {e}")
            print("Make sure you have installed: pip install openai-whisper")
            self.audio_available = False
            return

        # Initialize text-to-speech
        try:
            self.engine = pyttsx3.init()
            self.engine.setProperty('rate', 150)
            self.engine.setProperty('volume', 0.9)
        except Exception as e:
            print(f"Error initializing TTS: {e}")
            # Continue without TTS

    def speak(self, text: str):
        """Convert text to speech"""
        print(f"AI speaking: {text}")
        if self.engine:
            self.engine.say(text)
            self.engine.runAndWait()

    def listen_from_file(self, audio_file: str) -> Optional[str]:
        """
        Transcribe audio from file using Whisper
        audio_file: path to audio file (wav, mp3, etc.)
        """
        if not self.model:
            print("Whisper model not available")
            return None

        try:
            print(f"Transcribing from {audio_file}...")
            result = self.model.transcribe(audio_file)
            text = result["text"].strip()
            print(f"Transcribed: {text}")
            return text
        except Exception as e:
            print(f"Error transcribing audio: {e}")
            return None

    def listen_from_array(self, audio_array: np.ndarray, sample_rate: int = 16000) -> Optional[str]:
        """
        Transcribe audio from numpy array using Whisper
        audio_array: numpy array of audio samples
        sample_rate: sample rate (default 16000 for Whisper)
        """
        if not self.model:
            print("Whisper model not available")
            return None

        try:
            print("Transcribing audio...")
            result = self.model.transcribe(audio_array, fp16=False)
            text = result["text"].strip()
            print(f"Transcribed: {text}")
            return text
        except Exception as e:
            print(f"Error transcribing audio: {e}")
            return None

    def listen(self, timeout: int = 5) -> Optional[str]:
        """
        Listen to user voice input (placeholder - needs audio capture implementation)
        For real-time audio capture, you need to use pyaudio or sounddevice
        """
        if not self.audio_available:
            print("Audio not available. Please use text mode.")
            return None

        # This is a placeholder - you need to implement audio capture
        # For real-time capture, consider using:
        # - sounddevice library (easier to use)
        # - pyaudio (what we had before)
        # - audio recording then transcribe with Whisper

        print("Real-time audio capture not implemented with Whisper.")
        print("Use the old voice_recognition.py for real-time, or use file-based transcription.")
        return None

    def speak_async(self, text: str):
        """Speak without blocking"""
        thread = threading.Thread(target=self.speak, args=(text,))
        thread.daemon = True
        thread.start()

    def change_model(self, model_size: str):
        """Change Whisper model size"""
        if model_size in ["tiny", "base", "small", "medium", "large"]:
            self.model_size = model_size
            self.model = whisper.load_model(model_size)
            print(f"Model changed to: {model_size}")
        else:
            print("Invalid model size. Use: tiny, base, small, medium, or large")
