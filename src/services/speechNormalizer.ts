/**
 * MIRA AI COPILOT — DEDICATED SPEECH NORMALIZATION PIPELINE
 * 
 * Converts scientific, planetary, mathematical, and coordinate text into
 * clean, natural spoken language for Web Speech API (speechSynthesis).
 * 
 * Root Cause Fix for Unwanted Symbols:
 *   - Strips raw markdown syntax, asterisks, hash headers, and emojis.
 *   - Strips raw URLs and markdown link brackets [text](url) -> speaks only "text".
 *   - Strips LaTeX math delimiters ($ and $$) and converts LaTeX symbols to natural words.
 *   - Pronounces units properly (e.g. "km/s" -> "kilometers per second", NOT "kilo meters slash s").
 *   - Pronounces Martian coordinates naturally (e.g. "18.38° N, 77.58° E" -> "18.38 degrees North, 77.58 degrees East").
 *   - Eliminates stray forward slashes, backslashes, braces, and raw JSON.
 */

export function normalizeSpeechText(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  // 1. Remove emojis and special non-ASCII symbols
  text = text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, ' ');

  // 2. Remove markdown link markup: [Anchor Text](https://...) -> "Anchor Text"
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // 3. Remove raw URLs
  text = text.replace(/https?:\/\/[^\s)]+/g, ' ');

  // 4. Remove code blocks and inline code backticks
  text = text.replace(/```[\s\S]*?```/g, ' ');
  text = text.replace(/`([^`]+)`/g, '$1');

  // 5. Convert LaTeX and scientific notation symbols to spoken equivalents
  text = text.replace(/\\Delta\s*v/gi, 'delta v');
  text = text.replace(/\\Delta/gi, 'delta');
  text = text.replace(/I_\{?sp\}?/gi, 'specific impulse');
  text = text.replace(/\\text\{([^}]+)\}/gi, '$1');
  text = text.replace(/\\times\s*10\^\{?(-?\d+)\}?/gi, ' times ten to the power of $1');
  text = text.replace(/\\times/gi, ' times ');
  text = text.replace(/\\approx/gi, ' approximately ');
  text = text.replace(/\\pm/gi, ' plus or minus ');
  text = text.replace(/\\le|\\leq/gi, ' less than or equal to ');
  text = text.replace(/\\ge|\\geq/gi, ' greater than or equal to ');
  text = text.replace(/\\sim/gi, ' approximately ');
  text = text.replace(/\\cdot/gi, ' times ');

  // 6. Remove LaTeX math delimiters ($ and $$)
  text = text.replace(/\$\$?/g, ' ');

  // 7. Remove remaining LaTeX backslash commands
  text = text.replace(/\\[a-zA-Z]+/g, ' ');

  // 8. Convert coordinates: e.g. "18.38° N, 77.58° E" or "13.9° S, 59.2° W"
  text = text.replace(/(-?\d+(?:\.\d+)?)\s*°\s*([NSns])\s*[,/ ]+\s*(-?\d+(?:\.\d+)?)\s*°\s*([EWew])/g, (_match, lat, latDir, lon, lonDir) => {
    const latWord = latDir.toUpperCase() === 'S' ? 'South' : 'North';
    const lonWord = lonDir.toUpperCase() === 'W' ? 'West' : 'East';
    return `${lat} degrees ${latWord}, ${lon} degrees ${lonWord}`;
  });

  // Convert standalone degree coordinates: "18.38° N" or "77.58° E"
  text = text.replace(/(\d+(?:\.\d+)?)\s*°\s*([NSnsEWew])/g, (_match, num, dir) => {
    const dirMap: Record<string, string> = {
      N: 'North', n: 'North',
      S: 'South', s: 'South',
      E: 'East', e: 'East',
      W: 'West', w: 'West',
    };
    return `${num} degrees ${dirMap[dir] || dir}`;
  });

  // 9. Convert scientific units into natural speech (preventing "slash" pronunciation)
  text = text.replace(/\bkm\/s\b/gi, ' kilometers per second');
  text = text.replace(/\bm\/s\b/gi, ' meters per second');
  text = text.replace(/\bkm\/h\b/gi, ' kilometers per hour');
  text = text.replace(/\bm\/px\b/gi, ' meters per pixel');
  text = text.replace(/\bd\/s\b/gi, ' days per second');
  text = text.replace(/\bg\/cm³\b/gi, ' grams per cubic centimeter');
  text = text.replace(/\bkg\/m³\b/gi, ' kilograms per cubic meter');
  text = text.replace(/\bAU\b/g, ' astronomical units');
  text = text.replace(/\bkm²\b/gi, ' square kilometers');
  text = text.replace(/\bkm\b/gi, ' kilometers');
  text = text.replace(/\bcm\b/gi, ' centimeters');
  text = text.replace(/\bmm\b/gi, ' millimeters');
  text = text.replace(/\bGa\b/g, ' billion years');
  text = text.replace(/\bMa\b/g, ' million years');
  text = text.replace(/\bwt%\b/gi, ' percent by weight');

  // 10. Clean markdown structural formatting
  text = text.replace(/^#{1,6}\s+/gm, ''); // Headers
  text = text.replace(/^[-*•]\s+/gm, '');   // Bullet points
  text = text.replace(/[*_~`]/g, '');       // Bold/italic/strikethrough markers
  text = text.replace(/[|>]/g, ' ');        // Table pipes and blockquotes
  text = text.replace(/\{[^}]*\}/g, ' ');    // Stray braces

  // 11. Normalize forward and backward slashes that aren't parts of words
  text = text.replace(/\s*[/\\_]\s*/g, ' ');

  // 12. Remove repeated punctuation (e.g. "...", "???", "!!!")
  text = text.replace(/\.{2,}/g, '.');
  text = text.replace(/\?{2,}/g, '?');
  text = text.replace(/!{2,}/g, '!');

  // 13. Remove robotic AI fillers if they appear at the start
  text = text.replace(/^(hello|hi|welcome)?[,\s]*(i am|as your|this is) (mira|copilot)[^.]*\.\s*/i, '');

  // 14. Collapse multiple spaces and trim
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

const FEMALE_VOICE_KEYWORDS = [
  'female', 'woman', 'zira', 'jenny', 'sonia', 'neerja', 'heera', 'swara',
  'sangeeta', 'veena', 'ananya', 'priya', 'samantha', 'victoria', 'karen',
  'moira', 'fiona', 'tessa', 'serena', 'ava', 'allison', 'susan', 'catherine',
  'hazel', 'stephanie', 'aria', 'natasha', 'aditi', 'kavya'
];

const MALE_VOICE_KEYWORDS = [
  'male', 'david', 'mark', 'george', 'guy', 'ravi', 'prabhat', 'daniel', 'oliver', 'rishi'
];

function isLikelyFemale(name: string): boolean {
  const lower = name.toLowerCase();
  if (MALE_VOICE_KEYWORDS.some((m) => lower.includes(m))) return false;
  return FEMALE_VOICE_KEYWORDS.some((f) => lower.includes(f));
}

/**
 * Priority selection of natural, pleasant female voice across all browsers:
 * 1. Indian English (en-IN) female voice
 * 2. Any Indian English voice
 * 3. Natural / Neural / Google female English voice
 * 4. Any English female voice
 * 5. Best available English system voice
 */
export function selectNaturalFemaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  // 1. Indian English (en-IN) female voice (e.g., Microsoft Heera, Neerja, Google en-IN)
  const inFemale = voices.find(
    (v) => (v.lang === 'en-IN' || v.lang === 'en_IN') && isLikelyFemale(v.name)
  );
  if (inFemale) return inFemale;

  // 2. Any Indian English voice
  const inGeneral = voices.find((v) => v.lang === 'en-IN' || v.lang === 'en_IN');
  if (inGeneral) return inGeneral;

  // 3. High quality / Natural / Neural female English voice (e.g. Edge Natural Jenny/Sonia/Aria, Google US English Female)
  const naturalFemale = voices.find(
    (v) =>
      v.lang.startsWith('en') &&
      (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Google') || v.name.includes('Online')) &&
      isLikelyFemale(v.name)
  );
  if (naturalFemale) return naturalFemale;

  // 4. Any English female voice
  const enFemale = voices.find((v) => v.lang.startsWith('en') && isLikelyFemale(v.name));
  if (enFemale) return enFemale;

  // 5. Any English voice that isn't explicitly male
  const enNonMale = voices.find((v) => v.lang.startsWith('en') && !MALE_VOICE_KEYWORDS.some((m) => v.name.toLowerCase().includes(m)));
  if (enNonMale) return enNonMale;

  // 6. Any English voice
  const anyEn = voices.find((v) => v.lang.startsWith('en'));
  if (anyEn) return anyEn;

  // 7. Fallback to default or first
  return voices.find((v) => v.default) || voices[0] || null;
}

