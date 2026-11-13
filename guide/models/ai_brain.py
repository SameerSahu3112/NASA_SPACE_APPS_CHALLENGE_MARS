from knowledge_base import KnowledgeManager
import re
from typing import Optional, Tuple

class AIBrain:
    def __init__(self):
        self.knowledge = KnowledgeManager()
        self.conversation_history = []
        self.max_history = 10
    
    def process_query(self, user_input: str) -> Tuple[str, bool]:
        """
        Process user query and generate response
        Returns (response, should_speak)
        """
        user_input_lower = user_input.lower().strip()

        # Refine query to handle common grammar issues
        user_input_lower = self.refine_query(user_input_lower)

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

        # Check for specific commands
        if "overview" in user_input_lower or "tell me about mars" in user_input_lower:
            return self.knowledge.get_mars_overview(), True

        if "mission" in user_input_lower or "rover" in user_input_lower or "rovers" in user_input_lower:
            return self.knowledge.get_mars_missions(), True

        if "solar system" in user_input_lower:
            return self.knowledge.get_solar_system_overview(), True

        if "fact" in user_input_lower or "interesting" in user_input_lower:
            return self._get_random_fact(), True

        # Search knowledge base
        response = self.knowledge.search(user_input)

        # Add AI response to history
        self.conversation_history.append({"role": "assistant", "content": response})

        return response, True
    
    def _get_help_response(self) -> str:
        """Generate help response"""
        return """I'm your Mars and Solar System AI assistant! I can tell you about:
        
• Mars overview and general information
• Mars missions (past, present, and future)
• Mars surface features (Olympus Mons, Valles Marineris, etc.)
• Mars atmosphere and climate
• Mars geology and water
• Mars habitability and potential for life
• Human exploration challenges
• Solar system overview
• Facts about Mars and other planets

Try asking me questions like:
"What is Mars?"
"Tell me about Mars missions"
"What is Olympus Mons?"
"Is Mars habitable?"
"Tell me about the solar system"
"""
    
    def _get_random_fact(self) -> str:
        """Get a random Mars fact"""
        facts = self.knowledge.mars_knowledge.get("mars_facts", [])
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
    
    def is_mars_related(self, query: str) -> bool:
        """Check if query is related to Mars or solar system"""
        mars_keywords = [
            "mars", "red planet", "olympus", "valles", "phobos", "deimos",
            "curiosity", "perseverance", "rover", "mission", "solar system",
            "planet", "space", "astronomy", "nasa", "esa", "spacex"
        ]
        
        query_lower = query.lower()
        return any(keyword in query_lower for keyword in mars_keywords)
    
    def refine_query(self, query: str) -> str:
        """Refine user query for better knowledge retrieval"""
        query_lower = query.lower()

        # Common grammar fixes
        grammar_fixes = {
            "how rovers are": "how many rovers are",
            "how rover is": "how many rovers are",
            "how many rover": "how many rovers",
            "what rovers": "what are the rovers",
            "tell me rovers": "tell me about rovers",
            "tell me rover": "tell me about rovers"
        }

        for old, new in grammar_fixes.items():
            query_lower = query_lower.replace(old, new)

        # Common abbreviations and expansions
        replacements = {
            "what's": "what is",
            "how's": "how is",
            "can u": "can you",
            "tell me": "about",
            "info": "information",
            "details": "about"
        }

        for old, new in replacements.items():
            query_lower = query_lower.replace(old, new)

        return query_lower.strip()
