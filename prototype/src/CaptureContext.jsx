import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import { createRecorder } from "./recorder.js";

// Holds the live-session state above the individual screens, so a recording
// keeps running (and the transcript keeps growing) while the user switches
// between "Live Meeting Capture" and "AI Transcription".

const CaptureCtx = createContext(null);
export const useCapture = () => useContext(CaptureCtx);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseClock(str) {
  const parts = String(str || "0:00").split(":").map((p) => parseInt(p, 10) || 0);
  return parts.reduce((total, p) => total * 60 + p, 0);
}

export function CaptureProvider({ children }) {
  const [status, setStatus] = useState("idle"); // idle | recording
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);
  const [lines, setLines] = useState([]);
  const [pending, setPending] = useState(0); // segments currently being transcribed
  const [failed, setFailed] = useState(0); // segments waiting for a retry
  const [error, setError] = useState("");
  const [meetingId, setMeetingId] = useState("");
  const [speakerNames, setSpeakerNames] = useState({});
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error
  const [meetings, setMeetings] = useState([]);
  const [meetingsState, setMeetingsState] = useState("loading"); // loading | ready | error
  const [minutes, setMinutes] = useState(null); // the editable minutes draft (Module 06)

  useEffect(() => {
    let alive = true;
    fetch("/api/meeting-ai?op=meetings")
      .then(async (r) => ({ ok: r.ok, data: await r.json().catch(() => ({})) }))
      .then(({ ok, data }) => {
        if (!alive) return;
        if (!ok) throw new Error();
        setMeetings(data.meetings || []);
        setMeetingsState("ready");
      })
      .catch(() => alive && setMeetingsState("error"));
    return () => { alive = false; };
  }, []);

  const linesRef = useRef([]);
  const queueRef = useRef(Promise.resolve());
  const failedRef = useRef([]);
  const recorderRef = useRef(null);
  const timerRef = useRef(null);

  // Segments are processed one at a time, in order, so speaker labels stay consistent.
  async function transcribeSegment(seg) {
    const previousLines = linesRef.current
      .slice(-4)
      .map(({ speaker, english }) => ({ speaker, english }));
    let lastErr;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch("/api/meeting-ai?op=transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audioBase64: seg.base64, mimeType: seg.mimeType, previousLines }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 429) {
          lastErr = new Error(data.error || "The transcription service is busy.");
          await sleep(15000);
          continue;
        }
        if (!res.ok) throw Object.assign(new Error(data.error || "Transcription failed."), { detail: data.detail });

        const fresh = (data.lines || []).map((l, i) => ({
          id: `${seg.index}-${i}`,
          speaker: l.speaker,
          start: seg.offsetSeconds + parseClock(l.start),
          original: l.original,
          english: l.english,
        }));
        linesRef.current = [...linesRef.current, ...fresh].sort((a, b) => a.start - b.start);
        setLines(linesRef.current);
        setSaveState((s) => (s === "saved" ? "idle" : s));
        return;
      } catch (err) {
        lastErr = err;
        if (err instanceof TypeError) {
          // network hiccup: wait briefly and retry
          await sleep(3000);
          continue;
        }
        throw err;
      }
    }
    throw lastErr;
  }

  function enqueue(seg) {
    setPending((p) => p + 1);
    queueRef.current = queueRef.current.then(async () => {
      try {
        await transcribeSegment(seg);
      } catch (err) {
        failedRef.current.push(seg);
        setFailed(failedRef.current.length);
        const detail = err.detail ? ` (${String(err.detail).slice(0, 180)})` : "";
        setError((err.message || "A segment could not be transcribed.") + detail);
      } finally {
        setPending((p) => p - 1);
      }
    });
  }

  function reset() {
    linesRef.current = [];
    failedRef.current = [];
    setLines([]);
    setFailed(0);
    setError("");
    setSpeakerNames({});
    setSaveState("idle");
    setElapsed(0);
  }

  async function start() {
    if (status !== "idle") return;
    reset();
    if (!recorderRef.current) {
      recorderRef.current = createRecorder({
        onSegment: enqueue,
        onLevel: setLevel,
        onError: (e) => setError(e.message || "Recording error."),
      });
    }
    try {
      await recorderRef.current.start();
    } catch (err) {
      setError(err.message);
      return;
    }
    setStatus("recording");
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }

  function stop() {
    if (status !== "recording") return;
    clearInterval(timerRef.current);
    recorderRef.current?.stop(); // flushes the final segment into the queue
    setStatus("idle");
  }

  function retryFailed() {
    const segs = failedRef.current;
    failedRef.current = [];
    setFailed(0);
    setError("");
    segs.forEach(enqueue);
  }

  function renameSpeaker(label, name) {
    setSpeakerNames((m) => ({ ...m, [label]: name.trim() }));
  }

  const nameOf = (label) => speakerNames[label] || label;

  async function saveToMeeting() {
    if (!meetingId || !linesRef.current.length) return;
    setSaveState("saving");
    setError("");
    try {
      const res = await fetch("/api/meeting-ai?op=save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: meetingId,
          lines: linesRef.current.map((l) => ({ ...l, speaker: nameOf(l.speaker) })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save the transcript.");
      setSaveState("saved");
    } catch (err) {
      setSaveState("error");
      setError(err.message);
    }
  }

  // Nothing is stored locally, so warn before the tab closes with unsaved work.
  useEffect(() => {
    const unsaved = status === "recording" || pending > 0 || (lines.length > 0 && saveState !== "saved");
    if (!unsaved) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [status, pending, lines.length, saveState]);

  const value = {
    status, elapsed, level, lines, pending, failed, error,
    meetingId, setMeetingId, speakerNames, nameOf, saveState,
    meetings, meetingsState, minutes, setMinutes,
    start, stop, reset, retryFailed, renameSpeaker, saveToMeeting,
    dismissError: () => setError(""),
  };

  return <CaptureCtx.Provider value={value}>{children}</CaptureCtx.Provider>;
}
