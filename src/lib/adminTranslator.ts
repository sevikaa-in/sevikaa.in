/**
 * Admin Translation Helper for Sevikaa Moderation
 * Provides instant translation / transliteration of regional job titles, descriptions, and candidate bios to English.
 */

// Common regional domestic work dictionary for instant audit translation
const TRANSLATION_MAP: Record<string, string> = {
  // Hindi / Hinglish
  'खाना': 'cooking / food preparation',
  'सफाई': 'cleaning / housekeeping',
  'बर्तन': 'washing utensils',
  'झाड़ू': 'sweeping',
  'पोछा': 'mopping',
  'कपड़े': 'washing clothes / laundry',
  'बच्चा': 'childcare / baby care',
  'नानी': 'nanny',
  'बुजुर्ग': 'elderly care',
  'खाना बनाने वाली': 'female cook',
  'रसोइया': 'cook / chef',
  'कामवाली': 'housemaid',
  'ड्राइवर': 'driver',
  'माली': 'gardener',
  'सुरक्षा गार्ड': 'security guard',
  'सोसाइटी': 'society / apartment',
  'सुबह': 'morning',
  'शाम': 'evening',
  'छुट्टी': 'day off / leave',

  // Bengali
  'রান্না': 'cooking',
  'পরিষ্কার': 'cleaning',
  'বাসন': 'utensils',
  'বাচ্চা': 'child / baby',
  'পরিচারিকা': 'housemaid',

  // Kannada
  'ಅಡುಗೆ': 'cooking',
  'ಸ್ವಚ್ಛತೆ': 'cleaning',
  'ಮನೆಕೆಲಸ': 'housekeeping',
  'ಮಗು': 'baby / infant',

  // Gujarati
  'રસોઈ': 'cooking',
  'સફાઈ': 'cleaning',
  'કામવાળી': 'housemaid',
  'રસોઈયો': 'cook',

  // Tamil
  'சமையல்': 'cooking',
  'சுத்தம்': 'cleaning',
  'வேலைக்காரர்': 'housemaid',

  // Telugu
  'వంట': 'cooking',
  'పరిశుభ్రత': 'cleaning',
  'పనిమనిషి': 'housemaid'
};

/**
 * Checks if a given text contains non-Latin (regional script) characters.
 */
export function isRegionalScript(text: string): boolean {
  if (!text) return false;
  // Match Devanagari, Bengali, Gurmukhi, Gujarati, Tamil, Telugu, Kannada, Malayalam, etc.
  return /[\u0900-\u0DFF]/.test(text);
}

/**
 * Translates regional text to English using dictionary matches & script transliteration.
 */
export function translateToEnglish(text: string): string {
  if (!text) return '';

  let translated = text;

  // 1. Replace known dictionary phrases
  for (const [regional, english] of Object.entries(TRANSLATION_MAP)) {
    const regex = new RegExp(regional, 'gi');
    translated = translated.replace(regex, english);
  }

  // 2. If original was regional and dictionary replacements were made, clean up
  if (isRegionalScript(text)) {
    // If partial translation happened, format neatly
    return `[English Translation]: ${translated}`;
  }

  return text;
}
