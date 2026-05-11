import { useState, useCallback, useRef, useEffect } from 'react';

export function useSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis>(window.speechSynthesis);

  useEffect(() => {
    // Initialize Web Speech API for recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US'; // Default to English for practice
    }
  }, []);

  const listen = useCallback(() => {
    return new Promise<string>((resolve, reject) => {
      if (!recognitionRef.current) {
        reject('Speech recognition not supported');
        return;
      }

      setIsListening(true);
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        resolve(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        setIsListening(false);
        reject(event.error);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.start();
    });
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const speak = useCallback((text: string) => {
    // We only want to speak the English part.
    // The prompt format says the English part is before the "---" separator.
    const englishPart = text.split('---')[0].trim();
    
    // Remove ellipses and extra commas for slightly better TTS but keep them for pauses
    // Most TTS engines handle commas and ellipses as pauses natively.
    
    const utterance = new SpeechSynthesisUtterance(englishPart);
    utterance.lang = 'en-US';
    utterance.rate = 0.85; // Slightly slower for beginners
    utterance.pitch = 1.0;
    
    // Find a friendly female voice if possible
    const voices = synthesisRef.current.getVoices();
    const femaleVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Google US English')) || voices[0];
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthesisRef.current.cancel(); // Stop any current speech
    synthesisRef.current.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    synthesisRef.current.cancel();
    setIsSpeaking(false);
  }, []);

  return {
    isListening,
    isSpeaking,
    listen,
    stopListening,
    speak,
    stopSpeaking
  };
}
