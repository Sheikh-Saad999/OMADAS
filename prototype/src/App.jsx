import React, { useState } from "react";
import {
  LayoutDashboard, Users, CalendarClock, ListTree, GitBranch, Video, Mic,
  FileSignature, ClipboardCheck, Archive, Sparkles, Network, Cpu, Search,
  CheckCircle2, Clock3, ChevronRight, Circle, PlayCircle, Send, MessageSquare,
  ShieldCheck, Building2, Landmark, Paperclip, Ban, Volume2, Workflow, DollarSign,
  Mail, ListChecks
} from "lucide-react";

const NAVY = "#81181C";
const SLATE = "#6B4A42";
const GOLD = "#FAB717";
const BG = "#FBF7F2";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "orgstructure", label: "University Hierarchy", icon: Landmark },
  { id: "hierarchy", label: "01 · User & Hierarchy", icon: Users },
  { id: "scheduling", label: "02 · Meeting Scheduling", icon: CalendarClock },
  { id: "agenda", label: "03 · Agenda Builder", icon: ListTree },
  { id: "approval", label: "04 · Approval Routing", icon: GitBranch },
  { id: "capture", label: "05 · Live Meeting Capture", icon: Video },
  { id: "transcription", label: "06 · AI Transcription", icon: Mic },
  { id: "minutes", label: "07 · Minutes & Resolution", icon: FileSignature },
  { id: "followup", label: "08 · Follow-up Tracker", icon: ClipboardCheck },
  { id: "archive", label: "09 · Historical Archive", icon: Archive },
  { id: "insights", label: "10 · AI Decision Support", icon: Sparkles },
  { id: "processflow", label: "Meeting Process Flow", icon: Workflow },
  { id: "architecture", label: "System Architecture", icon: Network },
  { id: "stack", label: "Tech Stack & APIs", icon: Cpu },
  { id: "business", label: "Business Model", icon: DollarSign },
];

function Chip({ children, tone = "slate" }) {
  const tones = {
    slate: { bg: "#F3E4D6", fg: SLATE },
    gold: { bg: "#F6EFDC", fg: "#8A6D1F" },
    green: { bg: "#E4F2EA", fg: "#2E7D5B" },
    red: { bg: "#FBE9E7", fg: "#B23A2E" },
  };
  const t = tones[tone];
  return (
    <span
      className="px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: t.bg, color: t.fg }}
    >
      {children}
    </span>
  );
}

function Card({ title, eyebrow, children, className = "" }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-5 ${className}`}>
      {eyebrow && (
        <div className="text-[11px] tracking-widest uppercase font-semibold mb-1" style={{ color: SLATE }}>
          {eyebrow}
        </div>
      )}
      {title && <h3 className="font-serif text-lg mb-3" style={{ color: NAVY }}>{title}</h3>}
      {children}
    </div>
  );
}

function SectionHeader({ eyebrow, title, desc }) {
  return (
    <div className="mb-6">
      <div className="text-xs tracking-widest uppercase font-semibold mb-1" style={{ color: GOLD }}>{eyebrow}</div>
      <h2 className="font-serif text-2xl md:text-3xl" style={{ color: NAVY }}>{title}</h2>
      {desc && <p className="text-slate-500 mt-2 max-w-2xl text-sm leading-relaxed">{desc}</p>}
    </div>
  );
}

/* ---------- Screens ---------- */

function Dashboard() {
  const bars = [40, 65, 50, 80, 60, 95, 70];
  return (
    <>
      <SectionHeader eyebrow="Overview" title="Governance Dashboard" desc="Live snapshot of meetings, approvals and resolutions across every faculty and department." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          ["Active meetings", "6", "green"],
          ["Pending approvals", "3", "gold"],
          ["Resolutions (2026)", "27", "slate"],
          ["Departments onboarded", "12", "slate"],
        ].map(([label, val, tone]) => (
          <Card key={label}>
            <div className="text-3xl font-serif" style={{ color: NAVY }}>{val}</div>
            <div className="text-xs text-slate-500 mt-1">{label}</div>
          </Card>
        ))}
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <Card title="Meetings per month" className="md:col-span-2">
          <div className="flex items-end gap-3 h-36">
            {bars.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full rounded-t-md" style={{ height: `${h}%`, background: i === 5 ? GOLD : SLATE, opacity: i === 5 ? 1 : 0.75 }} />
                <span className="text-[10px] text-slate-400">{["Feb","Mar","Apr","May","Jun","Jul","Aug"][i]}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Recent activity">
          <ul className="space-y-3 text-sm">
            {[
              ["BOS resolved BBA internship policy", "2h ago"],
              ["Dean approved Claude subscription request", "5h ago"],
              ["HOD Humanities scheduled faculty board", "1d ago"],
            ].map(([t, when]) => (
              <li key={t} className="flex gap-2">
                <Circle size={8} className="mt-1.5 shrink-0" style={{ color: GOLD }} fill={GOLD} />
                <div>
                  <div className="text-slate-700">{t}</div>
                  <div className="text-[11px] text-slate-400">{when}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}

function Hierarchy() {
  const roles = [
    ["Vice Chancellor", "Final approval authority", true, true, true],
    ["Dean", "Faculty-level review & comments", true, true, false],
    ["HOD", "Schedules meetings, sets agenda", true, false, false],
    ["Faculty / BOS member", "Attends, comments, votes", false, false, false],
  ];
  return (
    <>
      <SectionHeader eyebrow="Module 01" title="User & Hierarchy Management" desc="Mirrors the university's real structure so permissions and routing follow the actual chain of command." />
      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Organizational tree">
          <div className="space-y-2 text-sm">
            <div className="rounded-lg px-3 py-2 font-medium text-white" style={{ background: NAVY }}>University</div>
            <div className="ml-4 rounded-lg px-3 py-2 border" style={{ borderColor: SLATE, color: SLATE }}>Faculty of Management Sciences</div>
            <div className="ml-8 rounded-lg px-3 py-2 bg-slate-50 border border-slate-200">Dept. of Business Administration</div>
            <div className="ml-12 rounded-lg px-3 py-2 bg-slate-50 border border-dashed border-slate-300 text-slate-500">Program: BBA</div>
            <div className="ml-4 rounded-lg px-3 py-2 border mt-2" style={{ borderColor: SLATE, color: SLATE }}>Faculty of Humanities</div>
            <div className="ml-8 rounded-lg px-3 py-2 bg-slate-50 border border-slate-200">Dept. of English & Media</div>
          </div>
        </Card>
        <Card title="Role-based permissions">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 text-xs">
                <th className="pb-2">Role</th><th className="pb-2">Scope</th><th className="pb-2 text-center">Approve</th><th className="pb-2 text-center">Route</th><th className="pb-2 text-center">Final</th>
              </tr>
            </thead>
            <tbody>
              {roles.map(([r, s, a, ro, f]) => (
                <tr key={r} className="border-t border-slate-100">
                  <td className="py-2 font-medium" style={{ color: NAVY }}>{r}</td>
                  <td className="py-2 text-slate-500">{s}</td>
                  <td className="py-2 text-center">{a ? <CheckCircle2 size={16} className="inline text-emerald-600" /> : "—"}</td>
                  <td className="py-2 text-center">{ro ? <CheckCircle2 size={16} className="inline text-emerald-600" /> : "—"}</td>
                  <td className="py-2 text-center">{f ? <CheckCircle2 size={16} className="inline text-emerald-600" /> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}

function Scheduling() {
  const [form, setForm] = useState({
    name: "Board of Studies — BBA Program",
    type: "Board of Studies",
    date: "",
    mode: "Online",
    chair: "",
  });
  const [status, setStatus] = useState("idle"); // idle | saving | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const [meetings, setMeetings] = useState([
    ["Board of Studies — BBA", "28 Jul, 11:00 AM", "Online"],
    ["Faculty Board — Humanities", "02 Aug, 2:00 PM", "Face-to-face"],
    ["HOD Sync — Mgmt Sciences", "05 Aug, 10:00 AM", "Online"],
  ]);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submitMeeting = async () => {
    if (!form.name.trim() || !form.date.trim()) {
      setStatus("error");
      setErrorMsg("Meeting name and date & time are required.");
      return;
    }
    setStatus("saving");
    setErrorMsg("");
    try {
      const res = await fetch("/api/create-meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          date: form.date,
          venueMode: form.mode,
          chair: form.chair,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Failed to create meeting");
      setMeetings([[form.name, form.date, form.mode], ...meetings]);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  };

  return (
    <>
      <SectionHeader eyebrow="Module 02" title="Meeting Scheduling" desc="Any authorized convener proposes a meeting; invitees are notified automatically by email the moment it's created." />
      <div className="grid md:grid-cols-2 gap-4">
        <Card title="New meeting">
          <div className="space-y-3 text-sm">
            <div>
              <label className="text-xs text-slate-400">Meeting type</label>
              <input
                className="mt-1 w-full border rounded-lg px-3 py-2 border-slate-200 outline-none"
                value={form.name}
                onChange={update("name")}
                placeholder="e.g. Board of Studies — BBA Program"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400">Date & time</label>
                <input
                  className="mt-1 w-full border rounded-lg px-3 py-2 border-slate-200 outline-none"
                  value={form.date}
                  onChange={update("date")}
                  placeholder="28 Jul 2026 · 11:00 AM"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Mode</label>
                <div className="mt-1 flex gap-2">
                  {["Face-to-face", "Online"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setForm({ ...form, mode: m })}
                      className="text-left"
                    >
                      <Chip tone={form.mode === m ? "green" : "slate"}>{m}</Chip>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400">Chair</label>
              <input
                className="mt-1 w-full border rounded-lg px-3 py-2 border-slate-200 outline-none"
                value={form.chair}
                onChange={update("chair")}
                placeholder="e.g. Dean, Mgmt Sciences"
              />
            </div>
            <button
              onClick={submitMeeting}
              disabled={status === "saving"}
              className="mt-2 w-full rounded-lg text-white text-sm py-2.5 font-medium flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: NAVY }}
            >
              <Send size={14} />
              {status === "saving" ? "Saving to Notion…" : "Create meeting"}
            </button>
            {status === "success" && (
              <div className="mt-3 rounded-lg border p-3 text-xs" style={{ borderColor: "#EFD9BE", background: "#FBF3E9", color: SLATE }}>
                Meeting created in Notion successfully.
              </div>
            )}
            {status === "error" && (
              <div className="mt-3 rounded-lg border p-3 text-xs" style={{ borderColor: "#F3C9C2", background: "#FBE9E7", color: "#B23A2E" }}>
                {errorMsg}
              </div>
            )}
          </div>
        </Card>
        <Card title="Upcoming meetings">
          <ul className="divide-y divide-slate-100 text-sm">
            {meetings.map(([t, d, m]) => (
              <li key={t + d} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium" style={{ color: NAVY }}>{t}</div>
                  <div className="text-xs text-slate-400">{d}</div>
                </div>
                <Chip tone={m === "Online" ? "green" : "slate"}>{m}</Chip>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}

function AgendaBuilder() {
  const initialItems = [
    { item: "Review of BBA internship policy — mandatory vs. optional", by: "Azam Khan", comment: "Industry partners support a mandatory model.", file: "internship_survey.pdf", status: "approved" },
    { item: "Update on Fall 2026 admissions criteria", by: "Dr. Sana", comment: "Need updated cut-off marks before vote.", file: "admissions_2026.xlsx", status: "approved" },
    { item: "Approval of new elective: Digital Marketing Analytics", by: "HOD, BBA", comment: null, file: "course_outline.docx", status: "approved" },
    { item: "Request to shift Thursday lab slot to Friday", by: "Junaid Ali", comment: "Overlaps with another course.", file: "timetable_clip.mp3", status: "rejected" },
  ];
  const [items, setItems] = useState(initialItems);
  const [form, setForm] = useState({ item: "", by: "", meeting: "BOS - BBA Program", comment: "" });
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submitItem = async () => {
    if (!form.item.trim() || !form.by.trim()) {
      setStatus("error");
      setErrorMsg("Item title and your name are required.");
      return;
    }
    setStatus("saving");
    setErrorMsg("");
    try {
      const res = await fetch("/api/create-agenda-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item: form.item,
          submittedBy: form.by,
          meeting: form.meeting,
          comment: form.comment,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Failed to submit agenda item");
      setItems([{ item: form.item, by: form.by, comment: form.comment || null, file: "", status: "approved" }, ...items]);
      setForm({ item: "", by: "", meeting: form.meeting, comment: "" });
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  };

  const statusTone = s => s === "approved" ? "green" : "red";
  return (
    <>
      <SectionHeader eyebrow="Module 03" title="Agenda Builder" desc="Members submit items with attachments into a shared pool; the chair reviews and filters before the agenda is finalized." />
      <Card title="Submit a new agenda item" className="mb-4">
        <div className="space-y-3 text-sm">
          <div>
            <label className="text-xs text-slate-400">Item title</label>
            <input
              className="mt-1 w-full border rounded-lg px-3 py-2 border-slate-200 outline-none"
              value={form.item}
              onChange={update("item")}
              placeholder="e.g. Approval of new elective course"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400">Your name</label>
              <input
                className="mt-1 w-full border rounded-lg px-3 py-2 border-slate-200 outline-none"
                value={form.by}
                onChange={update("by")}
                placeholder="e.g. Azam Khan"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Meeting</label>
              <input
                className="mt-1 w-full border rounded-lg px-3 py-2 border-slate-200 outline-none"
                value={form.meeting}
                onChange={update("meeting")}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400">Comment (optional)</label>
            <input
              className="mt-1 w-full border rounded-lg px-3 py-2 border-slate-200 outline-none"
              value={form.comment}
              onChange={update("comment")}
            />
          </div>
          <button
            onClick={submitItem}
            disabled={status === "saving"}
            className="mt-1 w-full rounded-lg text-white text-sm py-2.5 font-medium flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: NAVY }}
          >
            <Send size={14} />
            {status === "saving" ? "Saving to Notion…" : "Submit agenda item"}
          </button>
          {status === "success" && (
            <div className="mt-1 rounded-lg border p-3 text-xs" style={{ borderColor: "#EFD9BE", background: "#FBF3E9", color: SLATE }}>
              Agenda item submitted to Notion successfully.
            </div>
          )}
          {status === "error" && (
            <div className="mt-1 rounded-lg border p-3 text-xs" style={{ borderColor: "#F3C9C2", background: "#FBE9E7", color: "#B23A2E" }}>
              {errorMsg}
            </div>
          )}
        </div>
      </Card>
      <Card title="Submitted items — pending chair review">
        <ol className="space-y-4 text-sm">
          {items.map((it, i) => (
            <li key={it.item} className="flex gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0" style={{ background: SLATE }}>{i + 1}</div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-slate-700">{it.item}</div>
                  <Chip tone={statusTone(it.status)}>{it.status === "approved" ? "Approved by chair" : "Removed by chair"}</Chip>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">Submitted by {it.by}</div>
                {it.comment && (
                  <div className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                    <MessageSquare size={13} className="mt-0.5 shrink-0" /> {it.comment}
                  </div>
                )}
                <div className="mt-1.5 flex items-center gap-1.5 text-xs" style={{ color: SLATE }}>
                  <Paperclip size={12} /> {it.file}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Card>
      <div className="mt-4 flex items-start gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-200">
        <Ban size={14} className="mt-0.5 shrink-0" style={{ color: GOLD }} />
        The chair has final authority to approve, edit, merge, or remove any submitted item — only approved items reach the finalized agenda that gets distributed with the date, time, and venue.
      </div>
    </>
  );
}

function OrgStructure() {
  const bof = [
    ["Board of Faculty — Engineering & Applied Sciences", ["Civil", "Electrical", "Mechanical"]],
    ["Board of Faculty — Management Sciences", ["Business Administration", "Business Analytics & Programming"]],
    ["Board of Faculty — Computing & Information Technology", ["CS", "IT", "SE", "CS (DCK Campus)"]],
    ["Board of Faculty — Humanities & Social Sciences", ["English & Media Studies", "Psychology", "Social Sciences"]],
  ];
  return (
    <>
      <SectionHeader eyebrow="Configurable per institution" title="University Organizational Structure" desc="Academic Council → Board of Faculty → Department → Program. This tree is configured once per client institution — not hard-coded." />
      <Card>
        <div className="rounded-lg px-4 py-2.5 font-medium text-white text-sm mb-3" style={{ background: NAVY }}>Academic Council</div>
        <div className="space-y-3">
          {bof.map(([name, depts]) => (
            <div key={name} className="ml-4 rounded-lg border p-3" style={{ borderColor: SLATE }}>
              <div className="text-sm font-medium mb-2" style={{ color: SLATE }}>{name}</div>
              <div className="ml-4 flex flex-wrap gap-2">
                {depts.map(d => <Chip key={d}>{d}</Chip>)}
              </div>
            </div>
          ))}
        </div>
      </Card>
      <div className="mt-4 flex items-start gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-200">
        <Landmark size={14} className="mt-0.5 shrink-0" style={{ color: SLATE }} />
        A system administrator can add/remove Boards of Faculty, Departments, and Programs from this screen — this is what makes MeetIntel reusable across different universities without touching code.
      </div>
    </>
  );
}

function ProcessFlow() {
  const steps = [
    ["Call for meeting", "Convener/Chair", "Initiates meeting, selects committee & invitees."],
    ["Agenda item submission", "Invited members", "Each member submits items + attachments into a shared pool."],
    ["Agenda review & filtering", "Chair", "Chair approves, edits, or removes items — final say on the agenda."],
    ["Finalization & distribution", "System", "Final agenda + date/time/venue auto-pushed to all participants."],
    ["Assembly & attendance", "All participants", "Members gather at venue or join online; attendance logged automatically."],
    ["Meeting initiation", "Chair", "Chair opens session; recording starts for in-room + remote attendees."],
    ["Agenda item defense", "Item owner", "Owner presents/defends item; can say \"read line number 3\" to the AI."],
    ["Speaker recognition", "AI engine", "Detects who is speaking, like Zoom's active-speaker view."],
    ["Live transcription & translation", "AI engine", "Speech-to-text in real time, mixed languages normalized into one transcript."],
    ["Decision + AI-assisted support", "Chair + AI", "Chair records the decision; AI flags related past resolutions & insights."],
    ["Minutes of Meeting generated", "AI engine", "Attendance, discussion, decisions compiled into a structured MoM."],
    ["Archive & follow-up", "System", "MoM archived permanently; open items auto-carried to next meeting."],
  ];
  return (
    <>
      <SectionHeader eyebrow="System design" title="Meeting Lifecycle — Process Flow" desc="Exactly how one meeting moves through MeetIntel, end to end." />
      <div className="space-y-2">
        {steps.map(([title, actor, desc], i) => (
          <div key={title} className="flex gap-3 items-start bg-white rounded-lg border border-slate-200 p-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0" style={{ background: i === 6 || i === 7 ? GOLD : SLATE }}>{i + 1}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm" style={{ color: NAVY }}>{title}</span>
                <Chip tone="slate">{actor}</Chip>
              </div>
              <div className="text-xs text-slate-500 mt-1">{desc}</div>
            </div>
            {(i === 6) && <Volume2 size={16} className="shrink-0 mt-1" style={{ color: GOLD }} />}
          </div>
        ))}
      </div>
    </>
  );
}

function BusinessModel() {
  const rows = [
    ["Value Proposition", "Replaces fragmented, manual meeting/approval documentation with one AI-powered system of record."],
    ["Customer Segments", "Universities & higher-ed bodies (Academic Council, BOF, HOD/BOS committees); extendable to corporate boards."],
    ["Revenue Streams", "Tiered annual SaaS subscription — illustrative start: $7,000/year per institution, scaled by depts, storage, AI usage."],
    ["Channels", "Direct sales to university administrations, higher-ed tech expos, academic partner referrals."],
    ["Key Resources", "n8n workflows, AI transcription/translation & LLM APIs, Notion knowledge base, cloud infrastructure."],
    ["Cost Structure", "Cloud hosting/storage, third-party AI/API usage, n8n Cloud or self-hosting, support & onboarding."],
    ["Competitive Edge", "Purpose-built for academic governance hierarchies — AI-native, not transcription bolted on afterward."],
  ];
  return (
    <>
      <SectionHeader eyebrow="Module 11" title="Business Model" desc="How MeetIntel is positioned and monetized as a SaaS product." />
      <div className="grid md:grid-cols-2 gap-4">
        {rows.map(([t, d]) => (
          <Card key={t} title={t}><p className="text-xs text-slate-500 leading-relaxed">{d}</p></Card>
        ))}
      </div>
    </>
  );
}

function Approval() {
  const [tracking, setTracking] = useState(false);
  const steps = [
    ["Department", "Requested by Saad — Technology & Ops", "done"],
    ["Dean", "\"Approved, forward to VC for budget sign-off.\"", "done"],
    ["Vice Chancellor", "Pending final sign-off", "pending"],
  ];
  const timeline = [
    ["Request submitted", "Saad, Technology & Ops", "24 Jul 2026 · 10:12 AM", "done"],
    ["Reviewed by Department", "Auto-forwarded, no blockers", "24 Jul 2026 · 11:40 AM", "done"],
    ["Approved by Dean", "Comment added, forwarded to VC", "25 Jul 2026 · 3:05 PM", "done"],
    ["Awaiting Vice Chancellor sign-off", "In queue — 2 requests ahead", "Since 25 Jul 2026 · 3:06 PM", "pending"],
  ];
  return (
    <>
      <SectionHeader eyebrow="Module 04" title="Approval & Routing Workflow" desc="Example: request for a Claude paid subscription, routed Department → Dean → VC — with live tracking at every stage." />
      <Card>
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {steps.map(([role, note, status], i) => (
            <React.Fragment key={role}>
              <div className="flex-1 rounded-lg border p-4" style={{ borderColor: status === "pending" ? "#E7D9AE" : "#EFD9BE", background: status === "pending" ? "#FBF6E8" : "#FBF3E9" }}>
                <div className="flex items-center gap-2 mb-1">
                  {status === "done" ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Clock3 size={16} style={{ color: GOLD }} />}
                  <span className="font-medium text-sm" style={{ color: NAVY }}>{role}</span>
                </div>
                <p className="text-xs text-slate-500">{note}</p>
              </div>
              {i < steps.length - 1 && <ChevronRight className="hidden md:block text-slate-300 shrink-0" />}
            </React.Fragment>
          ))}
        </div>
        <button
          onClick={() => setTracking(!tracking)}
          className="mt-4 text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5"
          style={{ background: "#F3E4D6", color: SLATE }}
        >
          <ListChecks size={13} /> {tracking ? "Hide tracking log" : "Track this request"}
        </button>
        {tracking && (
          <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
            {timeline.map(([title, note, time, status], i) => (
              <div key={title} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: status === "done" ? "#2E7D5B" : GOLD }} />
                  {i < timeline.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1" />}
                </div>
                <div className="pb-3">
                  <div className="text-sm font-medium" style={{ color: NAVY }}>{title}</div>
                  <div className="text-xs text-slate-500">{note}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{time}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

function Capture() {
  const attendance = [
    ["Dean, Mgmt Sciences", "Face-to-face", "11:02 AM", true],
    ["HOD, BBA", "Face-to-face", "11:00 AM", true],
    ["Azam Khan", "Face-to-face", "11:04 AM", true],
    ["Dr. Sana", "Online", "11:01 AM", true],
    ["Junaid Ali", "Online", "—", false],
  ];
  return (
    <>
      <SectionHeader eyebrow="Module 05" title="Live Meeting Capture & Attendance" desc="Chair initiates the session; the system records audio/video and logs attendance automatically for face-to-face and online participants." />
      <Card className="mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {["Dean, Mgmt Sciences", "HOD, BBA", "Azam Khan", "Dr. Sana (Online)"].map(name => (
            <div key={name} className="aspect-video rounded-lg flex items-center justify-center text-white text-xs font-medium" style={{ background: NAVY }}>
              {name}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <PlayCircle style={{ color: "#C0392B" }} />
          <div className="flex-1 h-8 rounded-full bg-slate-100 flex items-center px-3 gap-0.5 overflow-hidden">
            {Array.from({ length: 40 }).map((_, i) => (
              <div key={i} className="w-1 rounded-full" style={{ height: `${8 + (i * 37) % 20}px`, background: SLATE, opacity: 0.6 }} />
            ))}
          </div>
          <Chip tone="red">● Recording 32:14</Chip>
        </div>
      </Card>
      <Card title="Attendance — auto-logged on check-in">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 text-xs">
              <th className="pb-2">Member</th><th className="pb-2">Mode</th><th className="pb-2">Checked in</th><th className="pb-2 text-center">Present</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map(([name, mode, time, present]) => (
              <tr key={name} className="border-t border-slate-100">
                <td className="py-2 font-medium" style={{ color: NAVY }}>{name}</td>
                <td className="py-2"><Chip tone={mode === "Online" ? "green" : "slate"}>{mode}</Chip></td>
                <td className="py-2 text-slate-500">{time}</td>
                <td className="py-2 text-center">
                  {present ? <CheckCircle2 size={16} className="inline text-emerald-600" /> : <span className="text-xs text-slate-400">Not yet</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

function Transcription() {
  const [translated, setTranslated] = useState(true);
  const [voiceCmd, setVoiceCmd] = useState(false);
  const lines = [
    ["Azam Khan", translated ? "I think the internship should be made mandatory for BBA students." : "Mera khayal hai internship ko BBA students k liye mandatory kr dena chahiye.", true],
    ["Dr. Sana", translated ? "Agreed, but we need at least one semester's notice for students." : "Agreed, lekin students ko kam az kam ek semester ka notice dena hoga.", false],
    ["HOD, BBA", translated ? "Let's finalize this as a resolution for the Fall 2026 intake." : "Chalo isay Fall 2026 intake k liye resolution bana kr finalize kr detay hain.", false],
  ];
  return (
    <>
      <SectionHeader eyebrow="Module 06" title="AI Transcription, Speaker ID & Voice Commands" desc="Speech-to-text converts the recording live, identifies who is speaking (like Zoom's active-speaker view), and responds to in-meeting voice commands." />
      <Card>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "#2E7D5B" }}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live speaker: Azam Khan
          </div>
          <button onClick={() => setTranslated(!translated)} className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: "#F3E4D6", color: SLATE }}>
            {translated ? "Show original (Roman Urdu)" : "Show translated (English)"}
          </button>
        </div>
        <div className="space-y-4 mb-4">
          {lines.map(([speaker, text, speaking], i) => (
            <div key={i} className="flex gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold text-white shrink-0"
                style={{ background: SLATE, boxShadow: speaking ? "0 0 0 3px #2E7D5B55" : "none" }}
              >
                {speaker.split(" ").map(w => w[0]).join("").slice(0,2)}
              </div>
              <div className={voiceCmd && i === 1 ? "rounded-lg bg-amber-50 border border-dashed px-2 py-1 -ml-2" : ""} style={voiceCmd && i === 1 ? { borderColor: GOLD } : {}}>
                <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                  {speaker} {speaking && <Chip tone="green">speaking now</Chip>}
                  {voiceCmd && i === 1 && <span className="text-[10px] font-semibold" style={{ color: "#8A6D1F" }}>← line 2 (read aloud)</span>}
                </div>
                <div className="text-sm text-slate-700">{text}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-100 pt-3">
          <button
            onClick={() => setVoiceCmd(!voiceCmd)}
            className="w-full flex items-center justify-center gap-2 text-sm font-medium rounded-lg py-2.5"
            style={{ background: voiceCmd ? "#F6EFDC" : "#F6EDE3", color: voiceCmd ? "#8A6D1F" : SLATE }}
          >
            <Mic size={15} /> {voiceCmd ? '"Read line number 2" — AI is reading it back now' : 'Try voice command: "Read line number 2"'}
          </button>
        </div>
      </Card>
    </>
  );
}

function Minutes() {
  return (
    <>
      <SectionHeader eyebrow="Module 07" title="Minutes & Resolution Generator" desc="AI drafts the structured minutes and final resolution from the transcript for Dean/HOD sign-off." />
      <Card>
        <div className="text-xs text-slate-400 mb-2">Board of Studies — BBA Program · 28 Jul 2026</div>
        <div className="text-sm text-slate-700 space-y-2 mb-5">
          <p><strong>Discussed:</strong> Whether internship should be mandatory for BBA students, notice period for implementation.</p>
          <p><strong>Decision:</strong> Motion passed 5–1 in favor of mandatory internship, effective Fall 2026 intake.</p>
        </div>
        <div className="rounded-xl border-2 border-dashed p-4 flex items-center gap-4" style={{ borderColor: GOLD }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-white shrink-0" style={{ background: GOLD }}>
            <FileSignature size={22} />
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest font-semibold" style={{ color: "#8A6D1F" }}>Resolution No. 2026-BOS-014</div>
            <div className="font-serif text-lg" style={{ color: NAVY }}>RESOLVED: Internship is made mandatory for all BBA students, effective Fall 2026.</div>
          </div>
        </div>
      </Card>
    </>
  );
}

function FollowUp() {
  const items = [
    ["Draft updated BBA program handbook clause", "HOD, BBA", "05 Aug 2026", "In progress"],
    ["Notify current Fall 2025 cohort of grace period", "Registrar's Office", "10 Aug 2026", "Pending"],
    ["Circulate resolution to industry partners", "Azam Khan", "01 Aug 2026", "Done"],
  ];
  const toneFor = s => s === "Done" ? "green" : s === "In progress" ? "gold" : "slate";
  return (
    <>
      <SectionHeader eyebrow="Module 08" title="Follow-up & Action Tracker" desc="Open items from a resolution automatically resurface at the next related meeting." />
      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 text-xs">
              <th className="pb-2">Action item</th><th className="pb-2">Owner</th><th className="pb-2">Due</th><th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map(([t, o, d, s]) => (
              <tr key={t} className="border-t border-slate-100">
                <td className="py-3 pr-4" style={{ color: NAVY }}>{t}</td>
                <td className="py-3 text-slate-500">{o}</td>
                <td className="py-3 text-slate-500">{d}</td>
                <td className="py-3"><Chip tone={toneFor(s)}>{s}</Chip></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

function ArchiveView() {
  const [q, setQ] = useState("when was BBA internship made mandatory");
  return (
    <>
      <SectionHeader eyebrow="Module 09" title="Searchable Historical Archive" desc="Ask a plain question years later — the exact meeting, date, and resolution comes back instantly." />
      <Card>
        <div className="flex items-center gap-2 border rounded-full px-4 py-2.5 border-slate-200 mb-5">
          <Search size={16} className="text-slate-400" />
          <input value={q} onChange={e => setQ(e.target.value)} className="flex-1 text-sm outline-none" />
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <Building2 size={13} /> BOS — BBA Program · 28 Jul 2026 · Resolution 2026-BOS-014
          </div>
          <p className="text-sm text-slate-700">Matched: <em>"RESOLVED: Internship is made mandatory for all BBA students, effective Fall 2026."</em></p>
          <button className="mt-3 text-xs font-medium" style={{ color: SLATE }}>Open full transcript & minutes →</button>
        </div>
      </Card>
    </>
  );
}

function Insights() {
  return (
    <>
      <SectionHeader eyebrow="Module 10" title="AI Decision Support" desc="A second AI layer reads across meetings to flag patterns before senior management approves." />
      <div className="grid md:grid-cols-3 gap-4">
        {[
          ["No conflict detected", "This resolution does not contradict any prior BOS decision on record.", "green", ShieldCheck],
          ["Recurring theme", "Industry-readiness has come up in 4 of the last 6 BOS meetings.", "gold", Sparkles],
          ["Suggested next step", "Circulate resolution to industry advisory board within 10 days.", "slate", ClipboardCheck],
        ].map(([t, d, tone, Icon]) => (
          <Card key={t}>
            <Icon size={18} style={{ color: tone === "green" ? "#2E7D5B" : tone === "gold" ? GOLD : SLATE }} className="mb-2" />
            <div className="font-medium text-sm mb-1" style={{ color: NAVY }}>{t}</div>
            <div className="text-xs text-slate-500 leading-relaxed">{d}</div>
          </Card>
        ))}
      </div>
    </>
  );
}

function Architecture() {
  const layers = [
    ["Client Layer", "Web dashboard (Next.js) + mobile-responsive views", "#F3E4D6"],
    ["API / Gateway", "REST API (Flask) · Auth · Role-based access control", "#F5E6D3"],
    ["Core Services", "Meetings · Agenda · Approval Routing · Follow-up Tracker", "#EFD9BE"],
    ["AI Engine", "Speech-to-Text · Translation · LLM Summarization (Gemini API)", "#F6EFDC"],
    ["Data Layer", "PostgreSQL (records) · Cloud Object Storage (audio/video)", "#F3E4D6"],
    ["Infrastructure", "Cloud hosting (AWS/Azure/GCP) · Multi-tenant per institution", "#F5EEE5"],
  ];
  return (
    <>
      <SectionHeader eyebrow="System design" title="Architecture" desc="Layered architecture — each layer only talks to the one directly above and below it." />
      <div className="max-w-xl mx-auto space-y-2">
        {layers.map(([name, desc, bg], i) => (
          <React.Fragment key={name}>
            <div className="rounded-lg p-4 border border-slate-200" style={{ background: bg }}>
              <div className="font-serif text-base" style={{ color: NAVY }}>{name}</div>
              <div className="text-xs text-slate-600 mt-1">{desc}</div>
            </div>
            {i < layers.length - 1 && <div className="text-center text-slate-300">↓</div>}
          </React.Fragment>
        ))}
      </div>
      <div className="max-w-xl mx-auto mt-6 grid grid-cols-3 gap-3 text-center text-xs">
        {["Video conferencing API", "Notification service (email/SMS)", "GitHub CI/CD"].map(x => (
          <div key={x} className="rounded-lg border border-dashed border-slate-300 p-3 text-slate-500">{x}</div>
        ))}
      </div>
    </>
  );
}

function Stack() {
  const groups = [
    ["Frontend", ["Next.js / React", "Tailwind CSS", "Responsive, mobile-first UI"]],
    ["Backend", ["Flask (Python) REST API", "JWT-based auth", "Role-based access middleware"]],
    ["Database & Storage", ["PostgreSQL", "Cloud object storage for audio/video files"]],
    ["AI Models / APIs", ["Speech-to-Text API (meeting transcription)", "Translation API (Roman Urdu/Urdu ↔ English)", "Gemini API — LLM for minutes summarization, resolution drafting & Q&A over the archive"]],
    ["Infra & DevOps", ["Cloud hosting — AWS / Azure / GCP", "Docker for containerized services", "GitHub Actions for CI/CD"]],
  ];
  return (
    <>
      <SectionHeader eyebrow="Reference" title="Tech Stack & AI Models" desc="What's actually powering each layer of the prototype." />
      <div className="grid md:grid-cols-2 gap-4">
        {groups.map(([title, items]) => (
          <Card key={title} title={title}>
            <ul className="space-y-1.5 text-sm text-slate-600">
              {items.map(i => <li key={i} className="flex gap-2"><Circle size={6} className="mt-2 shrink-0" style={{ color: SLATE }} fill={SLATE} />{i}</li>)}
            </ul>
          </Card>
        ))}
      </div>
    </>
  );
}

const SCREENS = {
  dashboard: Dashboard, orgstructure: OrgStructure, hierarchy: Hierarchy, scheduling: Scheduling, agenda: AgendaBuilder,
  approval: Approval, capture: Capture, transcription: Transcription, minutes: Minutes,
  followup: FollowUp, archive: ArchiveView, insights: Insights, processflow: ProcessFlow,
  architecture: Architecture, stack: Stack, business: BusinessModel,
};

export default function App() {
  const [active, setActive] = useState("dashboard");
  const Screen = SCREENS[active];
  return (
    <div className="min-h-screen flex font-sans" style={{ background: BG }}>
      <aside className="w-64 shrink-0 hidden md:flex md:flex-col" style={{ background: NAVY }}>
        <div className="px-5 py-6 border-b border-white/10">
          <div className="text-white font-serif text-lg leading-tight">MeetIntel</div>
          <div className="text-[11px] text-white/50 mt-0.5">Office Minutes, Agenda &<br/>Documentation Mgmt System</div>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className="w-full flex items-center gap-2.5 px-5 py-2.5 text-sm text-left transition-colors"
              style={{
                color: active === id ? "#fff" : "rgba(255,255,255,0.6)",
                background: active === id ? "rgba(255,255,255,0.08)" : "transparent",
                borderLeft: active === id ? `3px solid ${GOLD}` : "3px solid transparent",
              }}
            >
              <Icon size={15} />{label}
            </button>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-white/10 text-[11px] text-white/40">Prototype build · FYP 2026</div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 overflow-x-auto flex gap-2">
          {NAV.map(({ id, label }) => (
            <button key={id} onClick={() => setActive(id)}
              className="text-xs px-3 py-1.5 rounded-full whitespace-nowrap"
              style={{ background: active === id ? NAVY : "#F6EDE3", color: active === id ? "#fff" : "#555" }}>
              {label.replace(/^\d+\s·\s/, "")}
            </button>
          ))}
        </header>
        <div className="flex-1 overflow-y-auto p-5 md:p-10">
          <div className="max-w-5xl">
            <Screen />
          </div>
        </div>
      </main>
    </div>
  );
}
