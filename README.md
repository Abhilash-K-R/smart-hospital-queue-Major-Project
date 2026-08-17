# Smart Hospital Queue Prediction and Patient Arrival Time Optimization System

AI-based system that predicts hospital wait times, sends "leave now" alerts based on live travel time, and manages emergency patients in the queue — built as a final-year major project (VTU, Phase 2) at SIET, Tumakuru.

**Guide:** Dr. Rajeswari R, Dept. of CSE
**Team:** Abhilash KR, Anjanadri TN, Laxuman, Naveen L

---

## What this project does

1. **Wait-time prediction** — Random Forest ML model predicts how long a patient will wait, based on queue position, doctor's average consultation time, and current disruptions.
2. **Leave-now notification** — combines Google Maps travel time with predicted wait time to tell patients exactly when to leave home.
3. **Emergency priority queue** — staff can manually insert emergency patients; wait times for everyone else auto-recalculate.

---

## Tech stack

| Layer      | Tech                                   |
|------------|-----------------------------------------|
| Frontend   | React + Tailwind CSS                    |
| Backend    | Python + FastAPI                        |
| Database   | PostgreSQL (Supabase/Neon) via SQLAlchemy|
| ML         | Python, scikit-learn (Random Forest)    |
| Maps       | Google Maps Distance Matrix API         |
| Hosting    | Render / Vercel / Railway (free tier)   |

---

## Team roles

| Role                    | Owner   | Branch name        | Folder              |
|--------------------------|---------|----------------------|----------------------|
| Database + backend APIs  | [Anjanadri]  | `backend-dev`        | `backend/`           |
| ML model + dataset       | [Abhilash]  | `ml-model`            | `ml-model/`           |
| Patient app frontend     | [Laxuman]  | `patient-app`         | `patient-app/`         |
| Staff dashboard + Maps   | [Naveen]  | `staff-dashboard`     | `staff-dashboard/`     |

Each person works **only inside their own folder**, on **only their own branch**. This means nobody can accidentally overwrite someone else's work.

---

## Git guide for beginners — read this fully before touching anything

If you've never used git before, don't worry — just follow these steps exactly, in order, every time. You don't need to understand everything deeply yet; just get the habit right.

### One-time setup (do this once, on your laptop)

**1. Install Git**
Download from [git-scm.com](https://git-scm.com/downloads) if you don't already have it.

**2. Get access**
Make sure Abhilash has added your GitHub username as a collaborator on the repo. You'll get an email invite — accept it.

**3. Copy the project to your laptop (this is called "cloning")**
Open a terminal (Command Prompt / Git Bash / VS Code terminal) and run:
```bash
git clone https://github.com/Abhilash-K-R/smart-hospital-queue-Major-Project.git
cd smart-hospital-queue-Major-Project
```
This downloads the whole project folder. You only do this **once**, ever.

**4. Switch to your own branch**
A "branch" is your own private lane to work in, so you never touch anyone else's code by accident.
```bash
git checkout -b backend-dev
```
(Use your own branch name from the table above — e.g. `ml-model`, `patient-app`, `staff-dashboard`)

Push it to GitHub so it's saved there too:
```bash
git push -u origin backend-dev
```

You're now set up. You won't need to repeat steps 3–4 again.

---

### Every time you sit down to work

**Step 1 — Make sure you're on your own branch**
```bash
git branch
```
This shows all branches with a `*` next to the one you're currently on. If it's not your branch:
```bash
git checkout your-branch-name
```

**Step 2 — Get the latest updates from the team**
```bash
git pull origin main
```
This pulls in anything your teammates have already finished and merged, so you're not working on outdated code.

**Step 3 — Do your work**
Write code, save files, test locally — all inside your own folder (e.g. `backend/` if you're the backend owner).

**Step 4 — Save your work to git ("commit")**
Once you've made progress (don't wait until everything is perfect — commit often, even small steps):
```bash
git add .
git commit -m "short message describing what you did"
```
Example: `git commit -m "Add patient registration API"`

**Step 5 — Push it to GitHub**
```bash
git push
```
Now your work is safely backed up on GitHub, on your branch.

---

### When a feature is fully done — merging into `main`

`main` is the "official" version of the project — it should only ever have working, tested code. You never push directly to it. Instead:

1. Go to the repo on GitHub.com
2. You'll see a banner suggesting "Compare & pull request" for your recently pushed branch — click it
   (Or manually: go to **Pull requests** tab → **New pull request** → base: `main`, compare: `your-branch-name`)
3. Write a short title/description of what you built
4. Click **Create pull request**
5. Message the team: "PR ready for review" — one teammate opens it, skims the changed files, clicks **Merge pull request** if it looks fine

This is called a **PR (Pull Request)** — it's just a formal "hey, I want to add my code to the main project, can someone glance at it first." It takes 2 minutes and prevents broken code from landing in `main`.

---

### If something feels wrong or you're stuck

- `git status` — tells you what's changed, what's staged, what branch you're on. Run this anytime you're confused.
- Don't panic and delete things. Screenshot the error and ask in the team group or ask Claude directly.
- It's completely normal to mess up branches as a beginner — git rarely deletes your actual work permanently.

---

## Folder structure

```
smart-hospital-queue-Major-Project/
├── backend/          ← backend owner works here
├── ml-model/         ← ML owner works here
├── patient-app/       ← patient frontend owner works here
├── staff-dashboard/   ← staff dashboard owner works here
└── README.md
```

---

## Sprint plan (2-week cycles)

- **Sprint 1 (Weeks 1–2):** Setup, database schema, backend APIs
- **Sprint 2 (Weeks 3–4):** ML model + patient frontend
- **Sprint 3 (Weeks 5–6):** Staff dashboard + Maps integration
- **Sprint 4 (Weeks 7–8):** Deployment, testing, report, viva prep

End of each sprint = demo checkpoint. Show what's actually working, even if rough — not just what's "almost done."

---

## Ground rules

- Post a short daily/every-2-days update in the team group: what you finished, what you're doing next, what's blocking you.
- Don't sit stuck silently for days — ask the group or ask Claude immediately.
- Demo-ability over perfection. A rough but working feature beats a polished but incomplete one, right up until final submission.
- Set up Google Maps API billing/key in Week 1 — don't leave it for later.

---
## Progress log (PROGRESS.md) — required for every teammate

Each person maintains a detailed `PROGRESS.md` inside their own folder (`backend/PROGRESS.md`, `ml-model/PROGRESS.md`, `patient-app/PROGRESS.md`, `staff-dashboard/PROGRESS.md`). This is a step-by-step record of what you did, why, and how — so if something breaks later, anyone on the team (or our guide) can trace exactly what was done and by whom.

### When to update it
Every time you finish a meaningful chunk of work — a working API, a fixed bug, a completed screen — before you commit and push.

### How to generate it
After finishing your work for the session, paste this prompt to Claude (or any AI tool you're using), filling in your own summary of what you did:

I just finished working on [describe what you built/fixed today, e.g. "the ML model training script and synthetic dataset generator"].
Here's what I did, in order:
[paste your rough steps, commands you ran, problems you hit, how you fixed them]
Write this up as a detailed PROGRESS.md entry — steps taken, why each decision was made, any errors hit and how they were debugged, and what's next. Same style as a technical changelog, so a teammate with no context can understand exactly what was done.

Then:
1. Copy the AI's output into your `[your-folder]/PROGRESS.md`
2. Commit and push:
```powershell
   git add .
   git commit -m "Add progress log for [what you built]"
   git push
```

### Why this matters
- If a feature breaks weeks later, you can trace back exactly which decision caused it
- Your guide can see real engineering process, not just final code — this matters for evaluation
- Teammates don't need to ask "how does this work" — it's already written down

## Known fix needed from Phase 1

Figure 4.1 in Chapter 4 of the Phase-1 report currently shows the wrong diagram (Holland's RIASEC career-guidance hexagon). This must be replaced with the actual system architecture diagram in the Phase 2 report.
