const LANGUAGE_NAMES: Record<string, string> = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'ur': 'Urdu',
  'bn': 'Bengali',
  'tr': 'Turkish',
  // Add more as needed
};

interface LanguageDisplayProps {
  languageCode?: string;
}

export function LanguageDisplay({ languageCode }: LanguageDisplayProps) {
  if (!languageCode) return <span className="text-gray-400">Unknown</span>;
  
  const languageName = LANGUAGE_NAMES[languageCode] || languageCode.toUpperCase();
  
  return (
    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
      {languageName}
    </span>
  );
} 