from knowledge_base import KnowledgeManager
from .vector_store import VectorStore
from .ollama_rag import OllamaRAGPipeline
from .knowledge_indexer import KnowledgeIndexer
from typing import Tuple
import os
from dotenv import load_dotenv

load_dotenv()

class OllamaAIBrain:
    """AI brain using Ollama (local LLM) - Free and private"""

    def __init__(self, use_rag: bool = True):
        self.use_rag = use_rag
        self.fallback_manager = KnowledgeManager()
        self.conversation_history = []
        self.max_history = 10

        # Initialize advanced components
        if use_rag:
            try:
                print("Initializing Ollama AI components...")
                self.vector_store = VectorStore()
                self.rag_pipeline = OllamaRAGPipeline(self.vector_store)

                # Index knowledge base if empty
                if self.vector_store.get_count() == 0:
                    print("Indexing knowledge base...")
                    self._index_knowledge()

                print("Ollama AI brain ready!")
            except Exception as e:
                print(f"Failed to initialize Ollama components: {e}")
                print("Make sure Ollama is installed and running: https://ollama.ai")
                print("Falling back to basic knowledge manager")
                self.use_rag = False
        else:
            print("Using basic knowledge manager (RAG disabled)")

    def _index_knowledge(self):
        """Index the knowledge base into vector store"""
        indexer = KnowledgeIndexer()
        documents, metadatas = indexer.index_knowledge()

        if documents:
            self.vector_store.add_documents(documents, metadatas)
            print(f"Successfully indexed {len(documents)} documents")

    def process_query(self, user_input: str) -> Tuple[str, bool]:
        """
        Process user query with Ollama RAG or fallback
        Returns (response, should_speak)
        """
        user_input_lower = user_input.lower().strip()

        # Add to conversation history
        self.conversation_history.append({"role": "user", "content": user_input})
        if len(self.conversation_history) > self.max_history:
            self.conversation_history.pop(0)

        # Check for exit commands
        if any(cmd in user_input_lower for cmd in ["exit", "quit", "stop", "bye", "goodbye"]):
            return "Goodbye! Thanks for learning about Mars with me.", True

        # Check for help
        if any(cmd in user_input_lower for cmd in ["help", "what can you", "capabilities"]):
            return self._get_help_response(), True

        # Process with RAG if available
        if self.use_rag:
            response = self.rag_pipeline.query(user_input)
        else:
            # Fallback to basic knowledge manager
            response = self._process_with_fallback(user_input)

        # Add AI response to history
        self.conversation_history.append({"role": "assistant", "content": response})

        return response, True

    def _process_with_fallback(self, user_input: str) -> str:
        """Process query using fallback knowledge manager"""
        user_input_lower = user_input.lower().strip()

        # Refine query
        user_input_lower = self._refine_query(user_input_lower)

        # Check for specific commands
        if "overview" in user_input_lower or "tell me about mars" in user_input_lower:
            return self.fallback_manager.get_mars_overview()

        if "mission" in user_input_lower or "rover" in user_input_lower or "rovers" in user_input_lower:
            return self.fallback_manager.get_mars_missions()

        if "solar system" in user_input_lower:
            return self.fallback_manager.get_solar_system_overview()

        if "fact" in user_input_lower or "interesting" in user_input_lower:
            return self._get_random_fact()

        # Search knowledge base
        return self.fallback_manager.search(user_input)

    def _refine_query(self, query: str) -> str:
        """Refine user query for better knowledge retrieval"""
        grammar_fixes = {
            "how rovers are": "how many rovers are",
            "how rover is": "how many rovers are",
            "how many rover": "how many rovers",
            "what rovers": "what are the rovers",
            "tell me rovers": "tell me about rovers",
            "tell me rover": "tell me about rovers"
        }

        for old, new in grammar_fixes.items():
            query = query.replace(old, new)

        replacements = {
            "what's": "what is",
            "how's": "how is",
            "can u": "can you",
            "tell me": "about",
            "info": "information",
            "details": "about"
        }

        for old, new in replacements.items():
            query = query.replace(old, new)

        return query.strip()

    def _get_help_response(self) -> str:
        """Generate help response"""
        mode = "Ollama RAG" if self.use_rag else "Basic"
        return f"""I'm your Mars and Solar System AI assistant ({mode} mode)!

I can tell you about:
• Mars overview and general information
• Mars missions (past, present, and future)
• Mars surface features (Olympus Mons, Valles Marineris, etc.)
• Mars atmosphere and climate
• Mars geology and water
• Mars habitability and potential for life
• Human exploration challenges
• Solar system overview
• Facts about Mars and other planets

Using Ollama for local LLM - Free and private!

Try asking me questions like:
"What is Mars?"
"Tell me about Mars missions"
"What is Olympus Mons?"
"Is Mars habitable?"
"Tell me about the solar system"
"How many rovers are on Mars?"
"""

    def _get_random_fact(self) -> str:
        """Get a random Mars fact"""
        facts = self.fallback_manager.mars_knowledge.get("mars_facts", [])
        import random
        fact = random.choice(facts)
        return f"Here's an interesting fact about Mars: {fact}"

    def get_conversation_context(self) -> str:
        """Get recent conversation context"""
        if not self.conversation_history:
            return ""

        context = "Recent conversation:\n"
        for msg in self.conversation_history[-4:]:
            role = "You" if msg["role"] == "user" else "AI"
            context += f"{role}: {msg['content']}\n"

        return context

    def clear_history(self):
        """Clear conversation history"""
        self.conversation_history = []

    def reindex_knowledge(self):
        """Reindex the knowledge base into vector store"""
        if self.use_rag:
            print("Reindexing knowledge base...")
            self.vector_store.delete_collection()
            self._index_knowledge()
            print("Reindexing complete!")
        else:
            print("RAG is not enabled. Cannot reindex.")

    def change_model(self, model: str):
        """Change the Ollama model"""
        if self.use_rag:
            self.rag_pipeline.set_model(model)
        else:
            print("RAG is not enabled.")
