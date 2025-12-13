import { useRef, useState } from 'react';

export const useTextToSpeech = () => {
  const synthRef = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null);

  const speak = (text) => {
    if (!('speechSynthesis' in window)) {
      console.log('Text-to-Speech non disponible');
      return false;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const frenchVoice = voices.find(voice => voice.lang.startsWith('fr'));
    if (frenchVoice) {
      utterance.voice = frenchVoice;
      setSelectedVoice(frenchVoice.name);
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (error) => {
      console.error('Erreur TTS:', error);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
    return true;
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  return {
    speak,
    stop,
    isSpeaking,
    selectedVoice,
    isSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,
  };
};