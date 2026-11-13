#!/usr/bin/env python3
"""
Mars AI Assistant - Voice-Enabled AI Specialized in Mars and Solar System Knowledge
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from voice_recognition import VoiceAssistant
from models import AIBrain
from models.ai_brain_advanced import AdvancedAIBrain
from models.ai_brain_ollama import OllamaAIBrain
import time
import os
from dotenv import load_dotenv

load_dotenv()

class MarsAI:
    def __init__(self, use_advanced: bool = None, use_ollama: bool = None):
        self.voice = VoiceAssistant()
        self.running = False

        # Determine which brain to use
        if use_ollama is not None and use_ollama:
            # Explicitly requested Ollama
            print("Using Ollama AI Brain (Local LLM - Free)")
            self.brain = OllamaAIBrain(use_rag=True)
        elif use_advanced is not None and use_advanced:
            # Explicitly requested OpenAI
            print("Using Advanced AI Brain (RAG + OpenAI)")
            self.brain = AdvancedAIBrain(use_rag=True)
        elif use_advanced is None and use_ollama is None:
            # Auto-detect: prefer Ollama, then OpenAI, then basic
            if os.getenv('OLLAMA_MODEL') or self._check_ollama_installed():
                print("Auto-detected Ollama - Using Ollama AI Brain")
                self.brain = OllamaAIBrain(use_rag=True)
            elif os.getenv('OPENAI_API_KEY'):
                print("Auto-detected OpenAI API key - Using Advanced AI Brain")
                self.brain = AdvancedAIBrain(use_rag=True)
            else:
                print("No API key detected - Using Basic AI Brain")
                self.brain = AIBrain()
        else:
            # Default to basic
            print("Using Basic AI Brain (Knowledge Base)")
            self.brain = AIBrain()

    def _check_ollama_installed(self):
        """Check if Ollama is installed"""
        try:
            import subprocess
            result = subprocess.run(['ollama', '--version'], capture_output=True, timeout=2)
            return result.returncode == 0
        except:
            return False
        
    def initialize(self):
        """Initialize the AI assistant"""
        print("=" * 60)
        print("MARS AI ASSISTANT")
        print("=" * 60)
        if self.voice.audio_available:
            print("Initializing voice recognition...")
        print("Initializing knowledge base...")
        print("Initializing AI brain...")
        print("\nMars AI is ready!")
        print("=" * 60)
        
    def start(self):
        """Start the AI assistant"""
        self.initialize()
        self.running = True

        # Welcome message
        welcome = "Hello! I'm your Mars and Solar System AI assistant. I can tell you everything about Mars, its missions, surface features, and the solar system. What would you like to know?"
        self.voice.speak(welcome)
        print(f"\nAI: {welcome}\n")

        while self.running:
            try:
                # Listen to user
                user_input = self.voice.listen(timeout=10)

                if user_input:
                    print(f"\nYou: {user_input}")

                    # Process query
                    response, should_speak = self.brain.process_query(user_input)

                    print(f"\nAI: {response}\n")

                    if should_speak:
                        self.voice.speak(response)

                    # Check if user wants to exit
                    if any(cmd in user_input.lower() for cmd in ["exit", "quit", "stop", "bye"]):
                        self.running = False

                else:
                    # No speech detected, prompt again
                    print("I didn't catch that. Could you please repeat?")
                    if self.voice.audio_available:
                        self.voice.speak("I didn't catch that. Could you please repeat?")

                time.sleep(0.5)

            except KeyboardInterrupt:
                print("\nInterrupted by user")
                self.running = False
            except Exception as e:
                print(f"Error: {e}")
                if self.voice.audio_available:
                    self.voice.speak("I encountered an error. Let's try again.")
                time.sleep(1)

        # Goodbye message
        goodbye = "Thank you for exploring Mars with me! Goodbye!"
        self.voice.speak(goodbye)
        print(f"\nAI: {goodbye}")
        print("\nMars AI Assistant shutting down...")
    
    def start_text_mode(self):
        """Start in text-only mode (no voice)"""
        print("=" * 60)
        print("MARS AI ASSISTANT - TEXT MODE")
        print("=" * 60)
        print("Type your questions about Mars and the solar system.")
        print("Type 'exit' or 'quit' to end the conversation.\n")
        
        self.running = True
        
        # Welcome message
        welcome = "Hello! I'm your Mars and Solar System AI assistant. I can tell you everything about Mars, its missions, surface features, and the solar system. What would you like to know?"
        print(f"AI: {welcome}\n")
        
        while self.running:
            try:
                user_input = input("You: ").strip()
                
                if not user_input:
                    continue
                
                # Process query
                response, should_speak = self.brain.process_query(user_input)
                
                print(f"\nAI: {response}\n")
                
                # Check if user wants to exit
                if any(cmd in user_input.lower() for cmd in ["exit", "quit", "stop", "bye"]):
                    self.running = False
                
            except KeyboardInterrupt:
                print("\nInterrupted by user")
                self.running = False
            except Exception as e:
                print(f"Error: {e}")
                print("Let's try again.\n")
        
        print("\nThank you for exploring Mars with me! Goodbye!")
        print("Mars AI Assistant shutting down...")

def main():
    # Ask user for AI mode
    print("Select AI Mode:")
    print("1. Ollama (Local LLM - Free, requires Ollama installation)")
    print("2. OpenAI (RAG + GPT - requires API key)")
    print("3. Basic (Knowledge Base - no dependencies)")

    try:
        ai_choice = input("\nEnter AI mode (1, 2, or 3, default=3): ").strip()

        if ai_choice == "1":
            mars_ai = MarsAI(use_ollama=True)
        elif ai_choice == "2":
            mars_ai = MarsAI(use_advanced=True)
        else:
            mars_ai = MarsAI()  # Basic mode
    except:
        mars_ai = MarsAI()  # Basic mode on error

    # Check if audio is available
    if not mars_ai.voice.audio_available:
        print("Audio not available. Starting in text mode...")
        mars_ai.start_text_mode()
        return

    # Ask user for interaction mode
    print("\nSelect Interaction Mode:")
    print("1. Voice mode (requires microphone)")
    print("2. Text mode (type questions)")

    try:
        choice = input("\nEnter choice (1 or 2): ").strip()

        if choice == "1":
            mars_ai.start()
        elif choice == "2":
            mars_ai.start_text_mode()
        else:
            print("Invalid choice. Starting in text mode...")
            mars_ai.start_text_mode()

    except KeyboardInterrupt:
        print("\nExiting...")
    except Exception as e:
        print(f"Error: {e}")
        print("Starting in text mode as fallback...")
        mars_ai.start_text_mode()

if __name__ == "__main__":
    main()
