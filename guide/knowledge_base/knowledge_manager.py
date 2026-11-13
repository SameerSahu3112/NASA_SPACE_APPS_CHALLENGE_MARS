from .mars_knowledge import MARS_KNOWLEDGE, SOLAR_SYSTEM_KNOWLEDGE
import re
from typing import List, Dict, Any

class KnowledgeManager:
    def __init__(self):
        self.mars_knowledge = MARS_KNOWLEDGE
        self.solar_system_knowledge = SOLAR_SYSTEM_KNOWLEDGE
        self.all_knowledge = {**MARS_KNOWLEDGE, **SOLAR_SYSTEM_KNOWLEDGE}

        # Keyword mappings for better query matching
        self.keyword_map = {
            "rover": "mars_missions",
            "rovers": "mars_missions",
            "mission": "mars_missions",
            "missions": "mars_missions",
            "landing": "mars_missions",
            "spacecraft": "mars_missions",
            "exploration": "mars_missions",
            "curiosity": "mars_missions",
            "perseverance": "mars_missions",
            "opportunity": "mars_missions",
            "spirit": "mars_missions",
            "sojourner": "mars_missions",
            "ingenuity": "mars_missions",
            "viking": "mars_missions",
            "volcano": "mars_surface_features",
            "mountain": "mars_surface_features",
            "canyon": "mars_surface_features",
            "ice": "mars_surface_features",
            "air": "mars_atmosphere",
            "weather": "mars_atmosphere",
            "climate": "mars_atmosphere",
            "life": "mars_habitability",
            "living": "mars_habitability",
            "humans": "mars_human_exploration",
            "people": "mars_human_exploration",
            "colonization": "mars_human_exploration",
            "planet": "solar_system_overview",
            "planets": "solar_system_overview"
        }
    
    def search(self, query: str) -> str:
        """Search knowledge base for relevant information"""
        query_lower = query.lower()
        results = []

        # First, check keyword map for direct matches
        for keyword, knowledge_key in self.keyword_map.items():
            if keyword in query_lower:
                if knowledge_key in self.mars_knowledge:
                    return self._format_response(knowledge_key, self.mars_knowledge[knowledge_key])
                elif knowledge_key in self.solar_system_knowledge:
                    return self._format_response(knowledge_key, self.solar_system_knowledge[knowledge_key])

        # Search Mars knowledge
        for key, value in self.mars_knowledge.items():
            if self._match_query(query_lower, key, value):
                results.append(self._format_response(key, value))

        # Search Solar System knowledge
        for key, value in self.solar_system_knowledge.items():
            if self._match_query(query_lower, key, value):
                results.append(self._format_response(key, value))

        if results:
            return "\n\n".join(results)
        else:
            return self._get_general_facts(query_lower)
    
    def _match_query(self, query: str, key: str, value: Any) -> bool:
        """Check if query matches the knowledge item"""
        key_lower = key.lower()
        
        # Direct key match
        if query in key_lower or key_lower in query:
            return True
        
        # Check in nested dictionaries
        if isinstance(value, dict):
            value_str = str(value).lower()
            return query in value_str
        
        # Check in lists
        if isinstance(value, list):
            for item in value:
                if isinstance(item, dict):
                    item_str = str(item).lower()
                    if query in item_str:
                        return True
                elif isinstance(item, str):
                    if query in item.lower():
                        return True
        
        return False
    
    def _format_response(self, key: str, value: Any) -> str:
        """Format the knowledge item for response"""
        if isinstance(value, dict):
            response = f"{key.replace('_', ' ').title()}:\n"
            for k, v in value.items():
                if isinstance(v, dict):
                    response += f"  {k.replace('_', ' ').title()}:\n"
                    for sub_k, sub_v in v.items():
                        response += f"    {sub_k.replace('_', ' ').title()}: {sub_v}\n"
                elif isinstance(v, list):
                    response += f"  {k.replace('_', ' ').title()}:\n"
                    for item in v:
                        if isinstance(item, dict):
                            response += f"    - {item.get('name', item)}: {item.get('achievement', item.get('feature', ''))}\n"
                        else:
                            response += f"    - {item}\n"
                else:
                    response += f"  {k.replace('_', ' ').title()}: {v}\n"
            return response
        elif isinstance(value, list):
            response = f"{key.replace('_', ' ').title()}:\n"
            for item in value:
                response += f"  - {item}\n"
            return response
        else:
            return f"{key.replace('_', ' ').title()}: {value}"
    
    def _get_general_facts(self, query: str) -> str:
        """Get general Mars facts when no specific match found"""
        facts = self.mars_knowledge.get("mars_facts", [])
        
        keyword_facts = []
        for fact in facts:
            if any(keyword in query for keyword in ["mars", "red planet", "fact", "interesting"]):
                keyword_facts.append(fact)
        
        if keyword_facts:
            return "Here are some interesting facts about Mars:\n" + "\n".join(f"  - {fact}" for fact in keyword_facts[:3])
        
        return "I can tell you about Mars and the solar system. Ask me about Mars missions, surface features, atmosphere, geology, habitability, or specific planets in the solar system."
    
    def get_mars_overview(self) -> str:
        """Get comprehensive Mars overview"""
        return self._format_response("mars_overview", self.mars_knowledge["mars_overview"])
    
    def get_mars_missions(self) -> str:
        """Get information about Mars missions"""
        return self._format_response("mars_missions", self.mars_knowledge["mars_missions"])
    
    def get_solar_system_overview(self) -> str:
        """Get solar system overview"""
        return self._format_response("solar_system_overview", self.mars_knowledge["solar_system_overview"])
    
    def explain_concept(self, concept: str) -> str:
        """Explain a specific concept in detail"""
        concept_map = {
            "olympus mons": "mars_surface_features",
            "valles marineris": "mars_surface_features",
            "polar ice caps": "mars_surface_features",
            "atmosphere": "mars_atmosphere",
            "water": "mars_water",
            "geology": "mars_geology",
            "habitability": "mars_habitability",
            "human exploration": "mars_human_exploration",
            "moons": "mars_water"
        }
        
        concept_lower = concept.lower()
        for key, value in concept_map.items():
            if key in concept_lower:
                return self._format_response(value, self.mars_knowledge[value])
        
        return self.search(concept)
