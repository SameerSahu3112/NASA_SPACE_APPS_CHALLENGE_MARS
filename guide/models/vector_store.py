import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
import os
from typing import List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

class VectorStore:
    def __init__(self):
        """Initialize ChromaDB vector store with sentence transformers"""
        self.persist_directory = os.getenv('CHROMA_PERSIST_DIRECTORY', './data/chroma_db')
        self.collection_name = os.getenv('CHROMA_COLLECTION_NAME', 'mars_knowledge')
        self.embedding_model_name = os.getenv('EMBEDDING_MODEL', 'all-MiniLM-L6-v2')

        # Initialize embedding model
        print(f"Loading embedding model: {self.embedding_model_name}")
        self.embedding_model = SentenceTransformer(self.embedding_model_name)

        # Initialize ChromaDB
        self.client = chromadb.PersistentClient(
            path=self.persist_directory,
            settings=Settings(anonymized_telemetry=False)
        )

        # Get or create collection
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"}
        )

        print(f"Vector store initialized with {self.collection.count()} documents")

    def add_documents(self, documents: List[str], metadatas: List[Dict] = None, ids: List[str] = None):
        """Add documents to the vector store"""
        if not ids:
            ids = [f"doc_{i}" for i in range(len(documents))]

        # Generate embeddings
        embeddings = self.embedding_model.encode(documents).tolist()

        # Add to collection
        self.collection.add(
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )

        print(f"Added {len(documents)} documents to vector store")

    def search(self, query: str, n_results: int = 5) -> List[Dict]:
        """Search for similar documents"""
        # Generate query embedding
        query_embedding = self.embedding_model.encode([query]).tolist()

        # Search
        results = self.collection.query(
            query_embeddings=query_embedding,
            n_results=n_results
        )

        # Format results
        formatted_results = []
        for i in range(len(results['ids'][0])):
            formatted_results.append({
                'id': results['ids'][0][i],
                'document': results['documents'][0][i],
                'metadata': results['metadatas'][0][i] if results['metadatas'] else {},
                'distance': results['distances'][0][i] if 'distances' in results else 0
            })

        return formatted_results

    def delete_collection(self):
        """Delete the entire collection"""
        self.client.delete_collection(name=self.collection_name)
        print(f"Collection {self.collection_name} deleted")

    def get_count(self) -> int:
        """Get number of documents in the collection"""
        return self.collection.count()
