// Vercel Serverless Function (single entry point for Follow-ups)
//
// Vercel's Hobby plan allows at most 12 serverless functions per deployment,
// so related endpoints share one function and are selected with ?op=.
// The real logic lives in ../server/followups/ (not counted as functions).
//
//   GET  /api/followups?op=get      -> list follow-up items
//   POST /api/followups?op=create   -> create a follow-up item
//   POST /api/followups?op=status   -> update an item's status

import getFollowups from "../server/followups/get.js";
import createFollowup from "../server/followups/create.js";
import updateFollowupStatus from "../server/followups/status.js";

const OPS = { get: getFollowups, create: createFollowup, status: updateFollowupStatus };

export default async function handler(req, res) {
  const op = req.query?.op;
  const fn = OPS[op];
  if (!fn) {
    return res.status(400).json({ error: "Unknown operation" });
  }
  return fn(req, res);
}
