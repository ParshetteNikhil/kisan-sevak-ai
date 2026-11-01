'use client';

/** BCP-47 tags for the app's languages (Indian English and Indian languages). */
export const SPEECH_LANG: Record<string, string> = {
  en: 'en-IN', hi: 'hi-IN', bn: 'bn-IN', ta: 'ta-IN', te: 'te-IN',
  mr: 'mr-IN', pa: 'pa-IN', gu: 'gu-IN', kn: 'kn-IN',
};

export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

export const canListen = () =>
  typeof window !== 'undefined' && Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

/** Removes markdown symbols so text reads naturally aloud. */
export function plainForSpeech(text: string) {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_#>`|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const base = lang.slice(0, 2);
  return (
    voices.find((v) => v.lang === lang) ||
    voices.find((v) => v.lang.replace('_', '-').startsWith(base)) ||
    undefined
  );
}

/** Speaks text in the given app locale. Resolves when finished or stopped. */
export function speak(text: string, locale: string, onEnd?: () => void) {
  if (!canSpeak()) return false;
  const synth = window.speechSynthesis;
  synth.cancel();
  const lang = SPEECH_LANG[locale] || 'en-IN';
  // Long answers are split so Android voices don't cut off mid-way.
  const chunks = plainForSpeech(text).match(/[^.!?।\n]+[.!?।]?/g) || [text];
  chunks.forEach((chunk, i) => {
    const u = new SpeechSynthesisUtterance(chunk.trim());
    u.lang = lang;
    const voice = pickVoice(lang);
    if (voice) u.voice = voice;
    u.rate = 0.95;
    if (i === chunks.length - 1 && onEnd) {
      u.onend = onEnd;
      u.onerror = onEnd;
    }
    synth.speak(u);
  });
  return true;
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel();
}

/** Listens once and returns what the person said, in the given app locale. */
export function listenOnce(locale: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return reject(new Error('not-supported'));
    const rec = new SR();
    rec.lang = SPEECH_LANG[locale] || 'en-IN';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    let done = false;
    rec.onresult = (e: any) => {
      done = true;
      resolve(String(e.results?.[0]?.[0]?.transcript || '').trim());
    };
    rec.onerror = (e: any) => {
      if (!done) reject(new Error(e?.error || 'error'));
    };
    rec.onend = () => {
      if (!done) resolve('');
    };
    rec.start();
  });
}
