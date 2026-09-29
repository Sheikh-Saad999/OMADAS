// Vercel Serverless Function (single entry point for the AI meeting modules)
//
// Vercel's Hobby plan allows at most 12 serverless functions per deployment,
// so every AI module shares this one function and is selected with ?op=.
// The real logic lives in ../server/meeting-ai/ (not counted as functions).
// New modules (Minutes, Decision Support) just add an entry to OPS.
//
//   POST /api/meeting-ai?op=transcribe  -> audio segment -> transcript lines
//   GET  /api/meeting-ai?op=meetings    -> recent meetings for the picker
//   POST /api/meeting-ai?op=save        -> attach a transcript to a meeting
//   POST /api/meeting-ai?op=minutes     -> transcript/text -> draft minutes + resolution
//   POST /api/meeting-ai?op=save-minutes -> attach reviewed minutes to a meeting
//   POST /api/meeting-ai?op=room         -> create a Daily.co video room for the session

import transcribe from "../server/meeting-ai/transcribe.js";
import meetings from "../server/meeting-ai/meetings.js";
import save from "../server/meeting-ai/save.js";
import minutes from "../server/meeting-ai/minutes.js";
import saveMinutes from "../server/meeting-ai/save-minutes.js";
import room from "../server/meeting-ai/room.js";

export const config = { maxDuration: 60 };

const OPS = { transcribe, meetings, save, minutes, "save-minutes": saveMinutes, room };

export default async function handler(req, res) {
  const op = req.query?.op;
  const fn = OPS[op];
  if (!fn) {
    return res.status(400).json({ error: "Unknown operation" });
  }
  return fn(req, res);
}
