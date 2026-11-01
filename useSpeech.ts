"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";

type ResultList = ArrayLike<ArrayLike<{ transcript: string }>>;
type Rec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: ResultList }) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type Ctor = new () => Rec;

function getCtor(): Ctor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: Ctor; webkitSpeechRecognition?: Ctor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Dictado por voz con la Web Speech API (Chrome, Edge, Safari). */
export function useSpeech(onText: (text: string) => void) {
  const supported = useSyncExternalStore(
    () => () => {},
    () => getCtor() !== null,
    () => false,
  );
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<Rec | null>(null);

  const start = useCallback(() => {
    const C = getCtor();
    if (!C) return false;
    setError(null);
    const rec = new C();
    rec.lang = "es-ES";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript + " ";
      onText(t.trim());
    };
    rec.onerror = (e) => {
      setError(e.error === "not-allowed" ? "No tengo permiso para usar el micrófono." : "No he podido oírte.");
      setListening(false);
    };
    rec.onend = () => {
      recRef.current = null;
      setListening(false);
    };
    try {
      rec.start();
      recRef.current = rec;
      setListening(true);
      return true;
    } catch {
      return false;
    }
  }, [onText]);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  return { supported, listening, error, start, stop };
}
