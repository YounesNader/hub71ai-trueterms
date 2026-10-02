"use client";
import { getStrings, translateMessage } from "../lib/strings";
import { useEffect, useRef, useState } from "react";
import { LANGUAGE_CODES, type Language } from "../lib/languages";

export function ListenButton({ text, englishText = text, language, usingSample }: {
  text: string; englishText?: string; language: Language; usingSample: boolean;
}) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [notice, setNotice] = useState("");
  const [forceOffline, setForceOffline] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const urlRef = useRef("");
  const offline = usingSample || forceOffline;
  const matchingVoice = voices.find((voice) => voice.localService && voice.lang.toLowerCase().startsWith(LANGUAGE_CODES[language]));
  const englishVoice = voices.find((voice) => voice.localService && voice.lang.toLowerCase().startsWith("en"));
  const localVoice = matchingVoice ?? englishVoice;

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const update = () => setVoices(window.speechSynthesis.getVoices());
    update();
    window.speechSynthesis.addEventListener("voiceschanged", update);
    const timer = window.setTimeout(update, 1500);
  return () => {
      window.clearTimeout(timer);
      window.speechSynthesis.removeEventListener("voiceschanged", update);
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => () => {
    requestRef.current?.abort();
    requestRef.current = null;
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  useEffect(() => {
    if (audioUrl) audioRef.current?.play().catch(() => setNotice("Press Play in the audio controls to listen."));
  }, [audioUrl]);

  function speakLocally() {
    if (!localVoice || !("speechSynthesis" in window)) return;
    const englishFallback = !matchingVoice;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(englishFallback ? englishText : text);
    utterance.voice = localVoice;
    utterance.lang = localVoice.lang;
    utterance.rate = 0.9;
    utterance.onerror = () => setNotice("Device audio could not play. The written text is still available.");
    setNotice(englishFallback ? `No installed ${language} voice. Listening in English.` : "Listening with an installed device voice.");
    window.speechSynthesis.speak(utterance);
  }

  async function listen() {
    if (loading) return;
    if (offline) { speakLocally(); return; }
    if (audioUrl) { audioRef.current?.play().catch(() => setNotice("Press Play in the audio controls to listen.")); return; }
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setNotice("");
    const timer = window.setTimeout(() => controller.abort(), 12_000);
    try {
      const response = await fetch("/api/speak", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language }), signal: controller.signal,
      });
      if (!response.ok) throw new Error("Speech unavailable");
      const audio = await response.blob();
      if (!audio.type.startsWith("audio/") || !audio.size) throw new Error("Speech unavailable");
      if (controller.signal.aborted) return;
      urlRef.current = URL.createObjectURL(audio);
      setAudioUrl(urlRef.current);
    } catch {
      if (requestRef.current === controller) {
        setForceOffline(true);
        if (localVoice) speakLocally();
        else setNotice("No installed language or English voice. The written text is still available.");
      }
    } finally {
      window.clearTimeout(timer);
      if (requestRef.current === controller) { requestRef.current = null; setLoading(false); }
    }
  }

  const t = getStrings(language);
  return (
    <div>
      {(!offline || localVoice) && <button type="button" onClick={listen} disabled={loading} className="secondary-button">{loading ? t.preparingAudio : t.listen}</button>}
      <p className="mt-4 text-muted">{offline ? localVoice ? matchingVoice ? t.localAudio : t.englishAudio : t.noAudio : t.liveAudio}</p>
      {notice && <p role="status" className="mt-4 leading-relaxed">{translateMessage(notice, language)}</p>}
      {audioUrl && <audio ref={audioRef} src={audioUrl} controls preload="none" aria-label={t.listen} className="mt-4 min-h-[54px] w-full" onError={() => { setForceOffline(true); setNotice("Audio could not play. Use an installed voice or read the text."); }} />}
    </div>
  );
}
