from langchain_ollama import ChatOllama
from langchain.prompts import ChatPromptTemplate
from langchain.schema.runnable import RunnablePassthrough
from langchain.schema.output_parser import StrOutputParser
from typing import List, Dict, Any
import os
from dotenv import load_dotenv
from .vector_store import VectorStore

load_dotenv()

class OllamaRAGPipeline:
    """RAG Pipeline using Ollama (local LLM) - Free and private"""

    def __init__(self, vector_store: VectorStore):
        """Initialize RAG pipeline with Ollama and vector store"""
        self.vector_store = vector_store
        self.model = os.getenv('OLLAMA_MODEL', 'llama3.2')  # Default to llama3.2
        self.top_k = int(os.getenv('RAG_TOP_K_RESULTS', 5))

        # Initialize Ollama
        try:
            self.llm = ChatOllama(
                model=self.model,
                temperature=0.7,
                num_predict=1000
            )
            print(f"Ollama RAG pipeline initialized with model: {self.model}")
        except Exception as e:
            print(f"Error initializing Ollama: {e}")
            print("Make sure Ollama is installed and running: https://ollama.ai")
            self.llm = None

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
        if not self.llm:
            return self._generate_fallback(user_query)

        # Search vector store for relevant context
        search_results = self.vector_store.search(user_query, n_results=self.top_k)

        # Extract context from search results
        context = self._build_context(search_results)

        # Generate response using Ollama
        try:
            response = self._generate_with_ollama(user_query, context)
        except Exception as e:
            print(f"Error generating response with Ollama: {e}")
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

    def _generate_with_ollama(self, query: str, context: str) -> str:
        """Generate response using Ollama LLM"""
        prompt = ChatPromptTemplate.from_messages([
            ("system", self.system_prompt),
            ("user", "Context:\n{context}\n\nQuestion: {question}")
        ])

        chain = (
            {
                "context": RunnablePassthrough(),
                "question": RunnablePassthrough()
            }
            | prompt
            | self.llm
            | StrOutputParser()
        )

        response = chain.invoke({
            "context": context,
            "question": query
        })

        return response

    def _generate_fallback(self, query: str, context: str = None, search_results: List[Dict] = None) -> str:
        """Generate response without LLM (fallback mode)"""
        if not search_results:
            return "I don't have information about that in my knowledge base. I can tell you about Mars missions, surface features, atmosphere, geology, and the solar system. What would you like to know?"

        # Simple response using top result
        top_result = search_results[0]['document']
        return f"Based on my knowledge base:\n\n{top_result}"

    def set_model(self, model: str):
        """Change the Ollama model"""
        self.model = model
        if self.llm:
            self.llm = ChatOllama(
                model=model,
                temperature=0.7,
                num_predict=1000
            )
            print(f"Model changed to: {model}")

    def set_temperature(self, temperature: float):
        """Set the temperature for LLM generation"""
        if 0 <= temperature <= 2:
            if self.llm:
                self.llm = ChatOllama(
                    model=self.model,
                    temperature=temperature,
                    num_predict=1000
                )
        else:
            print("Temperature must be between 0 and 2")
