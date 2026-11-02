"use client";

import { useEffect, useRef, useState } from "react";

type Rec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

/** Dictado por voz del navegador (Chrome, Edge, Safari). Llama a onText con cada frase reconocida. */
export function useSpeech(onText: (t: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const rec = useRef<Rec | null>(null);
  const cb = useRef(onText);
  cb.current = onText;

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    setSupported(true);
    const r = new Ctor();
    r.lang = "es-ES";
    r.continuous = true;
    r.interimResults = false;
    r.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) cb.current(e.results[i][0].transcript.trim());
    };
    r.onend = () => setListening(false);
    r.onerror = (e) => {
      setListening(false);
      setError(e.error === "not-allowed" ? "Necesito permiso para usar el micrófono." : "No te he entendido bien. Prueba otra vez.");
    };
    rec.current = r;
    return () => r.stop();
  }, []);

  const toggle = () => {
    if (!rec.current) return;
    setError("");
    if (listening) {
      rec.current.stop();
      setListening(false);
    } else {
      try {
        rec.current.start();
        setListening(true);
      } catch {
        /* ya estaba escuchando */
      }
    }
  };

  return { supported, listening, error, toggle };
}
