/**
 * Sevikaa Future-Proof Auto-Translation Engine
 * Automatically translates free-form custom text (e.g. employer job descriptions, worker bio notes)
 * into any target language using free Google Translate endpoints with local storage caching.
 */

const translationCache: Record<string, string> = {};

// Load cache from localStorage if available in browser environment
if (typeof window !== 'undefined') {
  try {
    const savedCache = localStorage.getItem('sevikaa_translation_cache');
    if (savedCache) {
      Object.assign(translationCache, JSON.parse(savedCache));
    }
  } catch (err) {
    console.warn("Could not load translation cache from localStorage:", err);
  }
}

function saveCacheToStorage() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('sevikaa_translation_cache', JSON.stringify(translationCache));
    } catch (err) {
      // Storage quota or restriction silently handled
    }
  }
}

/**
 * Translate arbitrary custom text into the target language code (e.g. 'bn', 'hi', 'ta', 'te', 'kn')
 */
export async function translateText(text: string, targetLang: string): Promise<string> {
  if (!text || !text.trim() || !targetLang || targetLang === 'en') {
    return text;
  }

  const apiLang = targetLang === 'hn' ? 'hi' : targetLang;

  const cacheKey = `${targetLang}:${text.trim()}`;
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${apiLang}&dt=t&q=${encodeURIComponent(text.trim())}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data && data[0] && Array.isArray(data[0])) {
      const translatedParts = data[0].map((part: any) => part[0]).filter(Boolean);
      const fullTranslation = translatedParts.join('');
      if (fullTranslation) {
        translationCache[cacheKey] = fullTranslation;
        saveCacheToStorage();
        return fullTranslation;
      }
    }
  } catch (error) {
    console.warn(`[Sevikaa Translator] Failed to translate to ${targetLang}:`, error);
  }

  return text;
}
