"use client";

import { useCallback, useEffect, useState } from "react";
import type { LangCode } from "./languages";

// Tagalog voices are usually published under Filipino.
const VOICE_PREFIXES: Record<LangCode, string[]> = {
  en: ["en"],
  ar: ["ar"],
  ur: ["ur"],
  hi: ["hi"],
  bn: ["bn"],
  tl: ["fil", "tl"],
  fr: ["fr"],
  es: ["es"],
};

// Reads text aloud with the device's own voices, so nothing leaves the
// browser. `supported` is false when the device has no voice for the
// language, and the UI hides the buttons.
export function useSpeech(code: LangCode) {
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof speechSynthesis === "undefined") return;
    const pick = () => {
      const voices = speechSynthesis.getVoices();
      const prefixes = VOICE_PREFIXES[code];
      const matches = voices.filter((v) => prefixes.some((p) => v.lang.toLowerCase().startsWith(p)));
      setVoice(matches.find((v) => v.localService) ?? matches[0] ?? null);
    };
    pick();
    speechSynthesis.addEventListener("voiceschanged", pick);
    return () => {
      speechSynthesis.removeEventListener("voiceschanged", pick);
      speechSynthesis.cancel();
      setSpeakingId(null);
    };
  }, [code]);

  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setSpeakingId(null);
  }, []);

  const speak = useCallback(
    (id: string, text: string) => {
      if (!voice) return;
      speechSynthesis.cancel();
      // Chrome stops long utterances after about 15 seconds, so speak one
      // sentence at a time.
      const sentences = text.split(/(?<=[.!?।۔؟])\s+/).filter(Boolean);
      sentences.forEach((sentence, i) => {
        const u = new SpeechSynthesisUtterance(sentence);
        u.voice = voice;
        u.lang = voice.lang;
        u.rate = 0.95;
        if (i === sentences.length - 1) {
          u.onend = () => setSpeakingId((cur) => (cur === id ? null : cur));
        }
        speechSynthesis.speak(u);
      });
      setSpeakingId(id);
    },
    [voice],
  );

  return { supported: voice !== null, speakingId, speak, stop };
}
