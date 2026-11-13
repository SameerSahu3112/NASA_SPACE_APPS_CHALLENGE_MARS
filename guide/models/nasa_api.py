import requests
import os
from typing import Dict, List, Optional
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

class NASAAPI:
    """NASA API integration for real-time Mars data"""

    def __init__(self):
        self.api_key = os.getenv('NASA_API_KEY', 'DEMO_KEY')  # DEMO_KEY works for limited requests
        self.base_url = "https://api.nasa.gov"

    def get_mars_rover_photos(self, rover: str = 'curiosity', sol: int = None, earth_date: str = None) -> Dict:
        """
        Get photos from Mars rovers
        rover: curiosity, opportunity, spirit
        sol: Martian sol (day) number
        earth_date: YYYY-MM-DD format
        """
        endpoint = f"{self.base_url}/mars-photos/api/v1/rovers/{rover}/photos"
        params = {'api_key': self.api_key}

        if sol:
            params['sol'] = sol
        elif earth_date:
            params['earth_date'] = earth_date
        else:
            # Default to latest photos
            params['sol'] = 1000

        try:
            response = requests.get(endpoint, params=params)
            response.raise_for_status()
            data = response.json()

            if data.get('photos'):
                return {
                    'success': True,
                    'rover': rover,
                    'sol': data['photos'][0]['sol'],
                    'earth_date': data['photos'][0]['earth_date'],
                    'total_photos': len(data['photos']),
                    'photos': data['photos'][:10]  # Return first 10 photos
                }
            else:
                return {'success': False, 'message': 'No photos found for this date/sol'}

        except Exception as e:
            return {'success': False, 'error': str(e)}

    def get_apod(self, date: str = None) -> Dict:
        """
        Get Astronomy Picture of the Day
        date: YYYY-MM-DD format (optional, defaults to today)
        """
        endpoint = f"{self.base_url}/planetary/apod"
        params = {'api_key': self.api_key}

        if date:
            params['date'] = date

        try:
            response = requests.get(endpoint, params=params)
            response.raise_for_status()
            data = response.json()
            return {'success': True, 'data': data}

        except Exception as e:
            return {'success': False, 'error': str(e)}

    def get_mars_weather(self) -> Dict:
        """
        Get Mars weather data (simplified - NASA doesn't have a public weather API)
        This returns a summary based on known Mars weather patterns
        """
        # Since NASA doesn't have a public Mars weather API, we return known patterns
        return {
            'success': True,
            'source': 'knowledge_base',
            'weather_patterns': {
                'temperature_range': '-87°C to -5°C (-125°F to 23°F)',
                'seasonal_variations': 'Mars has seasons similar to Earth but twice as long',
                'dust_storms': 'Can cover the entire planet, especially during southern spring/summer',
                'pressure': 'About 0.6 kPa (0.006 atm)',
                'atmosphere': '95% carbon dioxide, 2.7% nitrogen, 1.6% argon'
            }
        }

    def get_asteroid_neo(self) -> Dict:
        """Get Near Earth Objects data"""
        endpoint = f"{self.base_url}/neo/rest/v1/neo/browse"
        params = {'api_key': self.api_key}

        try:
            response = requests.get(endpoint, params=params)
            response.raise_for_status()
            data = response.json()

            return {
                'success': True,
                'total_neos': data.get('page', {}).get('total_elements', 0),
                'near_earth_objects': data.get('near_earth_objects', [])[:5]
            }

        except Exception as e:
            return {'success': False, 'error': str(e)}

    def format_rover_photos_response(self, data: Dict) -> str:
        """Format rover photos data for AI response"""
        if not data.get('success'):
            return f"Couldn't retrieve rover photos: {data.get('message', 'Unknown error')}"

        photos = data.get('photos', [])
        if not photos:
            return "No photos available."

        response = f"Found {data['total_photos']} photos from {data['rover'].title()} rover on Sol {data['sol']} ({data['earth_date']}):\n\n"

        for i, photo in enumerate(photos[:5], 1):
            camera = photo.get('camera', {}).get('full_name', 'Unknown')
            response += f"{i}. Camera: {camera}\n"

        return response

    def format_apod_response(self, data: Dict) -> str:
        """Format APOD data for AI response"""
        if not data.get('success'):
            return f"Couldn't retrieve Astronomy Picture of the Day: {data.get('error', 'Unknown error')}"

        apod = data.get('data', {})
        title = apod.get('title', 'Unknown')
        date = apod.get('date', 'Unknown')
        explanation = apod.get('explanation', 'No explanation available')

        return f"Astronomy Picture of the Day ({date}):\n\n{title}\n\n{explanation}"
