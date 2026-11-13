"""
MIRA AI Copilot — Dedicated Speech Normalization Pipeline (Python)
Converts scientific, planetary, mathematical, and coordinate text into
clean, natural spoken language.
"""

import re

def normalize_speech_text(raw_text: str) -> str:
    if not raw_text:
        return ""

    text = raw_text

    # 1. Remove emojis and special non-ASCII symbols
    text = re.sub(r'[\U0001F300-\U0001F9FF\u2600-\u26FF\u2700-\u27BF]', ' ', text)

    # 2. Remove markdown link markup: [Anchor Text](https://...) -> "Anchor Text"
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)

    # 3. Remove raw URLs
    text = re.sub(r'https?://[^\s)]+', ' ', text)

    # 4. Remove code blocks and inline code backticks
    text = re.sub(r'```[\s\S]*?```', ' ', text)
    text = re.sub(r'`([^`]+)`', r'\1', text)

    # 5. Convert LaTeX and scientific notation symbols to spoken equivalents
    text = re.sub(r'\\Delta\s*v', 'delta v', text, flags=re.IGNORECASE)
    text = re.sub(r'\\Delta', 'delta', text, flags=re.IGNORECASE)
    text = re.sub(r'I_\{?sp\}?', 'specific impulse', text, flags=re.IGNORECASE)
    text = re.sub(r'\\text\{([^}]+)\}', r'\1', text)
    text = re.sub(r'\\times\s*10\^\{?(-?\d+)\}?', r' times ten to the power of \1', text)
    text = re.sub(r'\\times', ' times ', text, flags=re.IGNORECASE)
    text = re.sub(r'\\approx', ' approximately ', text, flags=re.IGNORECASE)
    text = re.sub(r'\\pm', ' plus or minus ', text, flags=re.IGNORECASE)
    text = re.sub(r'\\le|\\leq', ' less than or equal to ', text, flags=re.IGNORECASE)
    text = re.sub(r'\\ge|\\geq', ' greater than or equal to ', text, flags=re.IGNORECASE)
    text = re.sub(r'\\sim', ' approximately ', text, flags=re.IGNORECASE)
    text = re.sub(r'\\cdot', ' times ', text, flags=re.IGNORECASE)

    # 6. Remove LaTeX math delimiters ($ and $$)
    text = re.sub(r'\$\$?', ' ', text)

    # 7. Remove remaining LaTeX backslash commands
    text = re.sub(r'\\[a-zA-Z]+', ' ', text)

    # 8. Convert coordinates: e.g. "18.38° N, 77.58° E"
    def coord_sub(match):
        lat, lat_dir, lon, lon_dir = match.groups()
        lat_word = 'South' if lat_dir.upper() == 'S' else 'North'
        lon_word = 'West' if lon_dir.upper() == 'W' else 'East'
        return f"{lat} degrees {lat_word}, {lon} degrees {lon_word}"

    text = re.sub(
        r'(-?\d+(?:\.\d+)?)\s*°\s*([NSns])\s*[,/ ]+\s*(-?\d+(?:\.\d+)?)\s*°\s*([EWew])',
        coord_sub,
        text
    )

    # Standalone degree coordinates
    dir_map = {'N': 'North', 'S': 'South', 'E': 'East', 'W': 'West'}
    def single_coord_sub(match):
        num, d = match.groups()
        return f"{num} degrees {dir_map.get(d.upper(), d)}"

    text = re.sub(r'(\d+(?:\.\d+)?)\s*°\s*([NSnsEWew])', single_coord_sub, text)

    # 9. Convert scientific units into natural speech
    text = re.sub(r'\bkm/s\b', ' kilometers per second', text, flags=re.IGNORECASE)
    text = re.sub(r'\bm/s\b', ' meters per second', text, flags=re.IGNORECASE)
    text = re.sub(r'\bkm/h\b', ' kilometers per hour', text, flags=re.IGNORECASE)
    text = re.sub(r'\bm/px\b', ' meters per pixel', text, flags=re.IGNORECASE)
    text = re.sub(r'\bd/s\b', ' days per second', text, flags=re.IGNORECASE)
    text = re.sub(r'\bg/cm³\b', ' grams per cubic centimeter', text, flags=re.IGNORECASE)
    text = re.sub(r'\bkg/m³\b', ' kilograms per cubic meter', text, flags=re.IGNORECASE)
    text = re.sub(r'\bAU\b', ' astronomical units', text)
    text = re.sub(r'\bkm²\b', ' square kilometers', text, flags=re.IGNORECASE)
    text = re.sub(r'\bkm\b', ' kilometers', text, flags=re.IGNORECASE)
    text = re.sub(r'\bcm\b', ' centimeters', text, flags=re.IGNORECASE)
    text = re.sub(r'\bmm\b', ' millimeters', text, flags=re.IGNORECASE)
    text = re.sub(r'\bGa\b', ' billion years', text)
    text = re.sub(r'\bMa\b', ' million years', text)
    text = re.sub(r'\bwt%\b', ' percent by weight', text, flags=re.IGNORECASE)

    # 10. Clean markdown structural formatting
    text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)
    text = re.sub(r'^[-*•]\s+', '', text, flags=re.MULTILINE)
    text = re.sub(r'[*_~`]', '', text)
    text = re.sub(r'[|>]', ' ', text)
    text = re.sub(r'\{[^}]*\}', ' ', text)

    # 11. Normalize slashes
    text = re.sub(r'\s*[/\\_]\s*', ' ', text)

    # 12. Remove repeated punctuation
    text = re.sub(r'\.{2,}', '.', text)
    text = re.sub(r'\?{2,}', '?', text)
    text = re.sub(r'!{2,}', '!', text)

    # 13. Collapse whitespace
    text = re.sub(r'\s+', ' ', text).strip()

    return text
