import React, { useState, useRef, useEffect } from "react";
import { Room, RoomEvent } from "livekit-client";
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff } from "lucide-react";

// The screen a guest lands on when they open the Chair's invite link
// (?join=<room>). No app chrome, no login — enter a name and connect.
// This page never runs transcription; only the Chair's browser does that.

const NAVY = "#81181C";
const SLATE = "#6B4A42";

function Tile({ p }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = p.videoTrack ? new MediaStream([p.videoTrack]) : null;
  }, [p.videoTrack]);
  useEffect(() => {
    if (audioRef.current) audioRef.current.srcObject = p.audioTrack && !p.local ? new MediaStream([p.audioTrack]) : null;
  }, [p.audioTrack, p.local]);
  return (
    <div className="relative rounded-lg overflow-hidden bg-slate-800 aspect-video">
      {p.videoTrack ? (
        <video ref={videoRef} autoPlay playsInline muted={p.local} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white text-lg font-semibold" style={{ background: SLATE }}>
          {(p.name || "?").slice(0, 2).toUpperCase()}
        </div>
      )}
      {!p.local && <audio ref={audioRef} autoPlay />}
      <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1.5 bg-black/50 rounded-full px-2 py-0.5">
        <span className="text-white text-xs">{p.name}</span>
        {!p.audioOn && <MicOff size={11} className="text-red-300" />}
      </div>
    </div>
  );
}

export default function JoinMeeting({ room: roomName }) {
  const [name, setName] = useState("");
  const [state, setState] = useState("idle"); // idle | connecting | in-call | left | error
  const [error, setError] = useState("");
  const [participants, setParticipants] = useState([]);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const roomRef = useRef(null);

  const sync = (room) => {
    const local = room.localParticipant;
    const remotes = Array.from(room.remoteParticipants.values());
    const toTile = (p, isLocal) => {
      const vpub = Array.from(p.videoTrackPublications.values())[0];
      const apub = Array.from(p.audioTrackPublications.values())[0];
      return {
        id: isLocal ? "local" : p.identity,
        name: isLocal ? "You" : p.name || "Guest",
        local: isLocal,
        audioOn: isLocal ? local.isMicrophoneEnabled : !!apub && !apub.isMuted,
        videoOn: isLocal ? local.isCameraEnabled : !!vpub && !vpub.isMuted,
        videoTrack: vpub?.track?.mediaStreamTrack || null,
        audioTrack: apub?.track?.mediaStreamTrack || null,
      };
    };
    setParticipants([toTile(local, true), ...remotes.map((p) => toTile(p, false))]);
  };

  const join = async () => {
    if (!name.trim()) return;
    setState("connecting");
    setError("");
    try {
      const res = await fetch("/api/meeting-ai?op=livekit-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room: roomName, name: name.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not join the meeting.");

      const room = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.current = room;
      room
        .on(RoomEvent.TrackSubscribed, () => sync(room))
        .on(RoomEvent.TrackUnsubscribed, () => sync(room))
        .on(RoomEvent.LocalTrackPublished, () => sync(room))
        .on(RoomEvent.ParticipantConnected, () => sync(room))
        .on(RoomEvent.ParticipantDisconnected, () => sync(room))
        .on(RoomEvent.Disconnected, () => setState("left"));

      await room.connect(data.url, data.token);
      await room.localParticipant.enableCameraAndMicrophone();
      sync(room);
      setState("in-call");
    } catch (err) {
      setState("error");
      setError(err.message || "Could not join the meeting.");
    }
  };

  const toggleMic = async () => {
    const next = !micOn;
    await roomRef.current?.localParticipant.setMicrophoneEnabled(next);
    setMicOn(next);
  };
  const toggleCam = async () => {
    const next = !camOn;
    await roomRef.current?.localParticipant.setCameraEnabled(next);
    setCamOn(next);
  };
  const leave = async () => {
    await roomRef.current?.disconnect();
    roomRef.current = null;
    setState("left");
  };

  useEffect(() => () => roomRef.current?.disconnect(), []);

  if (state === "idle" || state === "connecting" || state === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-sm">
          <h1 className="text-lg font-serif font-bold mb-1" style={{ color: NAVY }}>Join meeting</h1>
          <p className="text-xs text-slate-400 mb-5">MeetIntel · OMADMS</p>
          <label className="text-xs font-medium text-slate-400 block mb-1">Your name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Dr. Sana Malik"
            className="w-full border rounded-lg px-3 py-2 border-slate-200 outline-none text-sm mb-4"
            onKeyDown={(e) => e.key === "Enter" && join()}
          />
          <button
            onClick={join}
            disabled={!name.trim() || state === "connecting"}
            className="w-full rounded-lg text-white text-sm py-2.5 font-semibold disabled:opacity-40"
            style={{ background: NAVY }}
          >
            {state === "connecting" ? "Joining…" : "Join meeting"}
          </button>
          {error && <p className="text-xs mt-3" style={{ color: "#B23A2E" }}>{error}</p>}
        </div>
      </div>
    );
  }

  if (state === "left") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <p className="text-sm text-slate-500">You have left the meeting. You can close this tab.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col p-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 flex-1">
        {participants.map((p) => <Tile key={p.id} p={p} />)}
      </div>
      <div className="flex items-center justify-center gap-3 pt-4">
        <button onClick={toggleMic} className="w-11 h-11 rounded-full flex items-center justify-center text-white" style={{ background: micOn ? SLATE : "#C0392B" }}>
          {micOn ? <Mic size={17} /> : <MicOff size={17} />}
        </button>
        <button onClick={toggleCam} className="w-11 h-11 rounded-full flex items-center justify-center text-white" style={{ background: camOn ? SLATE : "#C0392B" }}>
          {camOn ? <VideoIcon size={17} /> : <VideoOff size={17} />}
        </button>
        <button onClick={leave} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: "#C0392B" }}>
          <PhoneOff size={15} /> Leave
        </button>
      </div>
    </div>
  );
}
