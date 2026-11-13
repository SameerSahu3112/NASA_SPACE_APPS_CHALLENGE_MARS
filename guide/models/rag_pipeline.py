from openai import OpenAI
from typing import List, Dict, Any, Optional
import os
from dotenv import load_dotenv
from .vector_store import VectorStore

load_dotenv()

class RAGPipeline:
    def __init__(self, vector_store: VectorStore):
        """Initialize RAG pipeline with OpenAI and vector store"""
        self.vector_store = vector_store
        self.api_key = os.getenv('OPENAI_API_KEY')
        self.model = os.getenv('OPENAI_MODEL', 'gpt-4-turbo-preview')
        self.top_k = int(os.getenv('RAG_TOP_K_RESULTS', 5))

        if not self.api_key:
            print("Warning: OPENAI_API_KEY not found. RAG will use fallback mode.")
            self.client = None
        else:
            self.client = OpenAI(api_key=self.api_key)
            print(f"RAG pipeline initialized with model: {self.model}")

        # System prompt for Mars AI
        self.system_prompt = """You are an expert AI assistant specialized in Mars and the Solar System. Your knowledge is based on the provided context.

Your role:
- Answer questions accurately using only the provided context
- If the context doesn't contain the answer, say you don't have that information
- Be engaging and educational
- Focus on Mars, its missions, geology, atmosphere, habitability, and the solar system
- Use specific details from the context when available
- If asked about unrelated topics, politely redirect to Mars/solar system topics

Keep responses conversational but informative."""
    
    def query(self, user_query: str) -> str:
        """Query the RAG pipeline"""
        # Search vector store for relevant context
        search_results = self.vector_store.search(user_query, n_results=self.top_k)

        # Extract context from search results
        context = self._build_context(search_results)

        # Generate response using LLM
        if self.client:
            response = self._generate_with_llm(user_query, context)
        else:
            # Fallback: return context directly
            response = self._generate_fallback(user_query, context, search_results)

        return response
    
    def _build_context(self, search_results: List[Dict]) -> str:
        """Build context string from search results"""
        if not search_results:
            return "No relevant information found in the knowledge base."

        context_parts = []
        for result in search_results:
            doc = result['document']
            metadata = result.get('metadata', {})
            source = metadata.get('source', 'unknown')

            context_parts.append(f"[Source: {source}]\n{doc}")

        return "\n\n".join(context_parts)
    
    def _generate_with_llm(self, query: str, context: str) -> str:
        """Generate response using OpenAI LLM"""
        try:
            messages = [
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {query}"}
            ]

            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=1000
            )

            return response.choices[0].message.content

        except Exception as e:
            print(f"Error generating response with LLM: {e}")
            return self._generate_fallback(query, context)
    
    def _generate_fallback(self, query: str, context: str, search_results: List[Dict] = None) -> str:
        """Generate response without LLM (fallback mode)"""
        if "No relevant information" in context:
            return "I don't have information about that in my knowledge base. I can tell you about Mars missions, surface features, atmosphere, geology, and the solar system. What would you like to know?"

        # Simple response using context
        return f"Based on my knowledge base:\n\n{context}"
    
    def set_temperature(self, temperature: float):
        """Set the temperature for LLM generation"""
        if 0 <= temperature <= 2:
            self.temperature = temperature
        else:
            print("Temperature must be between 0 and 2")
