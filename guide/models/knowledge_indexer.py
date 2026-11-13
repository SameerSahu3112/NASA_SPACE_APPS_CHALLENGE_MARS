from knowledge_base import MARS_KNOWLEDGE, SOLAR_SYSTEM_KNOWLEDGE
from typing import List, Dict, Any
import json

class KnowledgeIndexer:
    """Convert structured knowledge base into documents for vector store"""

    def __init__(self):
        self.mars_knowledge = MARS_KNOWLEDGE
        self.solar_system_knowledge = SOLAR_SYSTEM_KNOWLEDGE

    def index_knowledge(self) -> tuple[List[str], List[Dict]]:
        """Convert knowledge base into document chunks and metadata"""
        documents = []
        metadatas = []

        # Index Mars knowledge
        for key, value in self.mars_knowledge.items():
            docs, metas = self._process_knowledge_item(key, value, "mars")
            documents.extend(docs)
            metadatas.extend(metas)

        # Index Solar System knowledge
        for key, value in self.solar_system_knowledge.items():
            docs, metas = self._process_knowledge_item(key, value, "solar_system")
            documents.extend(docs)
            metadatas.extend(metas)

        print(f"Indexed {len(documents)} documents from knowledge base")
        return documents, metadatas

    def _process_knowledge_item(self, key: str, value: Any, category: str) -> tuple[List[str], List[Dict]]:
        """Process a single knowledge item into documents"""
        documents = []
        metadatas = []

        if isinstance(value, dict):
            for sub_key, sub_value in value.items():
                if isinstance(sub_value, dict):
                    # Nested dictionary
                    doc_text = self._dict_to_text(sub_key, sub_value)
                    documents.append(doc_text)
                    metadatas.append({
                        'source': f"{category}_{key}",
                        'subsection': sub_key,
                        'type': 'nested_dict'
                    })
                elif isinstance(sub_value, list):
                    # List of items
                    for item in sub_value:
                        if isinstance(item, dict):
                            doc_text = f"{sub_key}: {item.get('name', '')} - {item.get('achievement', item.get('feature', ''))}"
                            documents.append(doc_text)
                            metadatas.append({
                                'source': f"{category}_{key}",
                                'subsection': sub_key,
                                'type': 'list_item'
                            })
                        else:
                            doc_text = f"{sub_key}: {item}"
                            documents.append(doc_text)
                            metadatas.append({
                                'source': f"{category}_{key}",
                                'subsection': sub_key,
                                'type': 'list_item'
                            })
                else:
                    # Simple key-value
                    doc_text = f"{sub_key}: {sub_value}"
                    documents.append(doc_text)
                    metadatas.append({
                        'source': f"{category}_{key}",
                        'subsection': sub_key,
                        'type': 'key_value'
                    })

        elif isinstance(value, list):
            # Top-level list
            for item in value:
                if isinstance(item, dict):
                    doc_text = json.dumps(item)
                else:
                    doc_text = str(item)
                documents.append(doc_text)
                metadatas.append({
                    'source': f"{category}_{key}",
                    'type': 'list_item'
                })

        else:
            # Simple value
            doc_text = f"{key}: {value}"
            documents.append(doc_text)
            metadatas.append({
                'source': f"{category}_{key}",
                'type': 'simple'
            })

        return documents, metadatas

    def _dict_to_text(self, prefix: str, data: Dict) -> str:
        """Convert dictionary to readable text"""
        parts = [f"{prefix}:"]
        for k, v in data.items():
            if isinstance(v, dict):
                parts.append(f"  {k}:")
                for sub_k, sub_v in v.items():
                    parts.append(f"    {sub_k}: {sub_v}")
            else:
                parts.append(f"  {k}: {v}")
        return "\n".join(parts)
