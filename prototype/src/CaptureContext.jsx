import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import { createRecorder, createTrackRecorder } from "./recorder.js";
import Daily from "@daily-co/daily-js";

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
  const [mode, setMode] = useState("mic"); // 'mic' | 'video' — which capture mode is (or was last) active
  const [videoState, setVideoState] = useState("idle"); // idle | creating | in-call | error
  const [roomUrl, setRoomUrl] = useState("");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [participants, setParticipants] = useState([]);

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
  const callRef = useRef(null); // the active Daily call object, video mode only
  const videoCtxRef = useRef(null); // one shared AudioContext for every participant track
  const trackRecordersRef = useRef(new Map()); // sessionId -> { stop() }

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

        // In video-meeting mode, seg.speaker is the participant's real name
        // (the audio was already isolated to just them), so it always wins
        // over whatever speaker label Gemini guessed.
        const fresh = (data.lines || []).map((l, i) => ({
          id: `${seg.index}-${i}`,
          speaker: seg.speaker || l.speaker,
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
    setMode("mic");
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

  // ---- Video meeting mode (Module 04, "Video meeting") ----
  // The Chair's browser joins a Daily.co room headlessly (no Daily UI chrome)
  // and renders its own tiles. Every participant's audio track is captured
  // and transcribed separately, tagged with their real name — no speaker
  // guessing needed. Everyone else just opens the room link; Daily serves its
  // own ready-made call page there, no app required on their end.
  function syncParticipants(call) {
    const all = call.participants();
    setParticipants(
      Object.values(all).map((p) => ({
        id: p.session_id,
        name: p.local ? "You" : p.user_name || "Guest",
        local: p.local,
        audioOn: !!p.audio,
        videoOn: !!p.video,
        videoTrack: p.tracks?.video?.state === "playable" ? p.tracks.video.track : null,
      }))
    );
  }

  async function startVideoMeeting(name) {
    if (videoState !== "idle") return;
    if (lines.length && saveState !== "saved" &&
        !window.confirm("Starting a new session will replace the current unsaved transcript. Continue?")) {
      return;
    }
    reset();
    setMode("video");
    setVideoState("creating");
    setError("");

    try {
      const res = await fetch("/api/meeting-ai?op=room", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw Object.assign(new Error(data.error || "Could not create the video room."), { detail: data.detail });
      setRoomUrl(data.url);

      let ctx;
      try {
        ctx = new AudioContext();
      } catch {
        throw new Error("This browser cannot process audio for transcription.");
      }
      videoCtxRef.current = ctx;

      const call = Daily.createCallObject();
      callRef.current = call;

      const keyFor = (participant) => (participant.local ? "local" : participant.session_id);

      const attach = (participant, track) => {
        const key = keyFor(participant);
        if (trackRecordersRef.current.has(key)) return;
        const label = participant.local ? name || "Chair" : participant.user_name || "Guest";
        const rec = createTrackRecorder({
          track,
          sharedCtx: ctx,
          participantLabel: label,
          onSegment: enqueue,
          onLevel: participant.local ? setLevel : undefined,
          onError: (e) => setError(e.message || "Recording error."),
        });
        trackRecordersRef.current.set(key, rec);
      };
      const detach = (participant) => {
        const key = keyFor(participant);
        trackRecordersRef.current.get(key)?.stop();
        trackRecordersRef.current.delete(key);
      };

      call
        .on("joined-meeting", () => {
          setVideoState("in-call");
          setStatus("recording");
          timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
          syncParticipants(call);
          setMicOn(!!call.localAudio());
          setCamOn(!!call.localVideo());
        })
        .on("participant-joined", () => syncParticipants(call))
        .on("participant-updated", () => syncParticipants(call))
        .on("participant-left", (ev) => {
          detach(ev.participant);
          syncParticipants(call);
        })
        .on("track-started", (ev) => {
          if (ev.type === "audio") attach(ev.participant, ev.track);
          syncParticipants(call);
        })
        .on("track-stopped", (ev) => {
          if (ev.type === "audio") detach(ev.participant);
        })
        .on("error", (ev) => setError(ev.errorMsg || "Video call error."));

      await call.join({ url: data.url, userName: name || "Chair" });
    } catch (err) {
      setVideoState("error");
      const detail = err.detail ? ` (${String(err.detail).slice(0, 180)})` : "";
      setError((err.message || "Could not start the video meeting.") + detail);
    }
  }

  function toggleMic() {
    const call = callRef.current;
    if (!call) return;
    const next = !micOn;
    call.setLocalAudio(next);
    setMicOn(next);
  }

  function toggleCam() {
    const call = callRef.current;
    if (!call) return;
    const next = !camOn;
    call.setLocalVideo(next);
    setCamOn(next);
  }

  async function leaveVideoMeeting() {
    clearInterval(timerRef.current);
    trackRecordersRef.current.forEach((r) => r.stop());
    trackRecordersRef.current.clear();
    try {
      await callRef.current?.leave();
    } catch {
      /* already gone */
    }
    callRef.current?.destroy();
    callRef.current = null;
    try {
      await videoCtxRef.current?.close();
    } catch {
      /* already closed */
    }
    videoCtxRef.current = null;
    setParticipants([]);
    setRoomUrl("");
    setVideoState("idle");
    setStatus("idle");
    setLevel(0);
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
    mode, videoState, roomUrl, micOn, camOn, participants,
    startVideoMeeting, leaveVideoMeeting, toggleMic, toggleCam,
    start, stop, reset, retryFailed, renameSpeaker, saveToMeeting,
    dismissError: () => setError(""),
  };

  return <CaptureCtx.Provider value={value}>{children}</CaptureCtx.Provider>;
}
