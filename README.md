# OMADMS — Office Minutes, Agenda & Documentation Management System

AI-powered, cloud-based platform that digitizes the full university meeting lifecycle — scheduling, agenda, approvals, live recording, transcription, minutes/resolutions, follow-ups, and historical search — across every faculty and department.

**Final Year Project** | Supervisor: [Dean's name] | Team: [Member 1, Member 2, Member 3, Member 4]

---

## 🔗 Live Prototype
`/prototype` — interactive click-through UI/UX prototype covering all 10 modules + system architecture.

## 📌 Problem
University meetings (Board of Studies, HOD, faculty boards) rely on manual agendas, hand-typed minutes, informal approval routing, and no reliable way to trace a historical decision years later.

## ✅ Objectives
- Digitize scheduling → agenda → approval → recording → minutes → resolution → follow-up
- Model the real university hierarchy (Faculty → Department → Program → Roles)
- Automate approval routing (Department → Dean → Vice Chancellor) with logged comments
- Use AI for transcription, translation, minute generation, and historical Q&A
- Deliver as a multi-tenant cloud SaaS product

## 🧩 Modules
| # | Module | Description |
|---|--------|-------------|
| 01 | User & Hierarchy Management | Roles + org structure + permissions |
| 02 | Meeting Scheduling | Propose meetings, invite members, notify |
| 03 | Agenda Builder | Draft agenda items, pre-meeting comments |
| 04 | Approval & Routing Workflow | Dept → Dean → VC, comments logged |
| 05 | Live Meeting Capture | Audio/video recording, face-to-face + online |
| 06 | AI Transcription & Translation | Speech-to-text, Roman Urdu/English normalization |
| 07 | Minutes & Resolution Generator | AI-drafted structured minutes and resolutions |
| 08 | Follow-up & Action Tracker | Carries open items into the next meeting |
| 09 | Searchable Historical Archive | Query any past decision instantly |
| 10 | AI Decision Support | Pattern detection, conflict flags, insights |

## 🏗️ Architecture
```
Client (Next.js) → API Gateway (Flask, Auth/RBAC) → Core Services
   → AI Engine (Speech-to-Text, Translation, LLM) → PostgreSQL + Cloud Storage
   → Cloud Infra (AWS/Azure/GCP, multi-tenant)
```
Full diagram: see `/docs/architecture.png` or the "System Architecture" tab in the prototype.

## 🧰 Tech Stack
- **Frontend:** Next.js / React, Tailwind CSS
- **Backend:** Flask (Python) REST API, JWT auth
- **Database:** PostgreSQL + cloud object storage
- **AI/APIs:** Speech-to-Text API, Translation API, **Gemini API** (summarization, resolution drafting, archive Q&A)
- **Infra:** Docker, GitHub Actions CI/CD, AWS/Azure/GCP

## 📂 Repository Structure
```
/frontend        → Next.js app
/backend         → Flask API
/ai-services      → transcription, translation, LLM prompt logic
/docs            → proposal, architecture diagrams, meeting notes
/prototype       → clickable UI/UX prototype (this deliverable)
CONTRIBUTORS.md   → who worked on what
```

## 👥 Team & Contributions
See [`CONTRIBUTORS.md`](./CONTRIBUTORS.md) for a per-member breakdown of modules, code, and commits.

## 🚀 Setup
```bash
git clone https://github.com/<org>/omadms.git
cd omadms/frontend && npm install && npm run dev
cd omadms/backend && pip install -r requirements.txt && flask run
```

## 📄 License
Academic / Final Year Project — [University name], 2026.
