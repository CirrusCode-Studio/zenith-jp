/**
 * Audio Synthesis Service for Zenith Japanese
 * Utilizes the browser's high-fidelity Web Speech API for voice output.
 */

let voicesLoaded = false;

// Preload voices
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    voicesLoaded = true;
  });
}

export function getJapaneseVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }
  const voices = window.speechSynthesis.getVoices();
  return voices.filter(v => v.lang.startsWith('ja-JP') || v.lang.includes('Japan'));
}

export function speakJapanese(
  text: string, 
  speed: 'normal' | 'slow' = 'normal', 
  onEnd?: () => void
): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        console.warn('Web Speech synthesis is not supported in this environment.');
        return false;
    }

    try {
        // Clean text of parentheses like だれ（どなた） to make output sound natural
        let utteranceText = text;
        if (text.includes('（')) {
        utteranceText = text.split('（')[0];
        }
        if (text.includes('(')) {
        utteranceText = text.split('(')[0];
        }
        // Clean ～ or ― characters
        utteranceText = utteranceText.replace(/～/g, '').replace(/―/g, '');

        // Cancel ongoing speak requests
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(utteranceText);
        utterance.lang = 'ja-JP';
        
        // Configure speed
        utterance.rate = speed === 'slow' ? 0.55 : 0.85; // slightly slower than native for crisp pronunciation

        // Find custom voice if possible
        const jaVoices = getJapaneseVoices();
        if (jaVoices.length > 0) {
        // Prefer Google Japanese, standard Japanese, or Microsoft Ichiro
        const premiumVoice = jaVoices.find(v => 
            v.name.includes('Google') || 
            v.name.includes('Natural') || 
            v.name.includes('Neural')
        );
        utterance.voice = premiumVoice || jaVoices[0];
        }

        if (onEnd) {
        utterance.onend = () => onEnd();
        utterance.onerror = () => onEnd();
        }

        window.speechSynthesis.speak(utterance);
        return true;
    } catch (error) {
        console.error('Error in speakJapanese:', error);
        if (onEnd) onEnd();
        return false;
    }
}
