import speech_recognition as sr
import pyttsx3
import time
import threading
import os

class VoiceAssistant:
    def __init__(self):
        self.audio_available = True
        self.recognizer = None
        self.microphone = None
        self.engine = None
        self.is_listening = False
        self.listening_thread = None

        # Check if running in Docker or audio should be disabled
        if os.path.exists('/.dockerenv') or not self._test_audio():
            print("Audio not available. Running in text-only mode.")
            self.audio_available = False
            return

        try:
            self.recognizer = sr.Recognizer()
            self.microphone = sr.Microphone()
            self.engine = pyttsx3.init()
            self.engine.setProperty('rate', 150)
            self.engine.setProperty('volume', 0.9)
        except (AttributeError, ImportError, OSError) as e:
            print(f"Audio not available: {e}")
            print("Running in text-only mode")
            self.audio_available = False

    def _test_audio(self):
        """Test if audio devices are available"""
        try:
            import pyaudio
            p = pyaudio.PyAudio()
            device_count = p.get_device_count()
            p.terminate()
            return device_count > 0
        except:
            return False

    def speak(self, text):
        """Convert text to speech"""
        print(f"AI speaking: {text}")
        if self.audio_available:
            self.engine.say(text)
            self.engine.runAndWait()

    def listen(self, timeout=5):
        """Listen to user voice input"""
        if not self.audio_available:
            print("Audio not available. Please use text mode.")
            return None

        try:
            with self.microphone as source:
                print("Adjusting for ambient noise...")
                self.recognizer.adjust_for_ambient_noise(source, duration=1)
                print("Listening...")
                audio = self.recognizer.listen(source, timeout=timeout)

            print("Processing speech...")
            text = self.recognizer.recognize_google(audio)
            print(f"You said: {text}")
            return text

        except sr.WaitTimeoutError:
            print("No speech detected")
            return None
        except sr.UnknownValueError:
            print("Could not understand audio")
            return None
        except sr.RequestError as e:
            print(f"Speech recognition error: {e}")
            return None
        except Exception as e:
            print(f"Error: {e}")
            return None

    def start_continuous_listening(self, callback):
        """Start continuous listening in background thread"""
        self.is_listening = True
        
        def listen_loop():
            while self.is_listening:
                text = self.listen(timeout=3)
                if text:
                    callback(text)
                time.sleep(0.5)
        
        self.listening_thread = threading.Thread(target=listen_loop)
        self.listening_thread.daemon = True
        self.listening_thread.start()

    def stop_listening(self):
        """Stop continuous listening"""
        self.is_listening = False
        if self.listening_thread:
            self.listening_thread.join(timeout=2)

    def speak_async(self, text):
        """Speak without blocking"""
        thread = threading.Thread(target=self.speak, args=(text,))
        thread.daemon = True
        thread.start()
