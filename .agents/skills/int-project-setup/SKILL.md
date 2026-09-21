---
name: int-project-setup
description: Initialize a new software project using the exact INT AI-First standard Control Plane, project-specific AI context, technology-aware execution structure, and foundational repository baseline.
---

# INT AI-First Project Setup

## Purpose

Initialize a new software project according to the INT AI-First development architecture.

This skill is responsible for project initialization and baseline setup only. Do not implement business functionality or create business modules during initial setup unless explicitly requested.

The INT Control Plane is an organizational standard and MUST remain unchanged.

---

# MANDATORY STEP 1 — Technology & Architecture Discovery Gate

Before generating execution layer folders (`src/`, `tests/`) or starting implementation, the agent MUST confirm all foundational technology and architecture parameters:

1. **Project Name & Type**: Full Stack, Frontend Only, Backend Only, or Mobile.
2. **Architecture Style (MANDATORY FOR ALL PROJECT TYPES)**
3. **Frontend Technology & Styling** (if Frontend or Full Stack)
4. **Backend Technology & Framework** (if Backend or Full Stack)
5. **Database & Data Access / ORM Layer** (if Backend or Full Stack)
6. **Authentication & Security Strategy**
7. **Deployment Target**
8. **Gate 1 Reviewer(s)**
9. **Gate 2 Reviewer(s)**

---

# CRITICAL RULE — INT CONTROL PLANE (DYNAMIC COPY & SYNC)

Dynamically copy the entire contents of:
`skills/int-project-setup/resources/INT-Control-Plane/.agent/`

Into the project root:
`.agent/`

Rules:
- DO NOT rely on hardcoded file lists.
- DO NOT recreate, summarize, rewrite, modify, or rename these files.
- DO NOT add additional files inside the INT Control Plane unless explicitly requested.
- Do NOT create `.agent/README.md` unless explicitly requested.

---

# MANDATORY PROJECT VENDOR-AGNOSTIC GOVERNANCE & LOCAL SKILLS

1. **Auto-Generate `AGENTS.md` in Workspace Root**
2. **Auto-Copy Project-Level Skills into `.agents/skills/`**:
   - `.agents/skills/int-project-setup/SKILL.md`
   - `.agents/skills/int-sdd-lifecycle/SKILL.md`
   - `.agents/skills/int-brd-ingestion/SKILL.md`
   - `.agents/skills/int-incident-management/SKILL.md`
   - `.agents/skills/int-hotfix-management/SKILL.md`
   - `.agents/skills/int-release-management/SKILL.md`
   - `.agents/skills/int-session-continuation/SKILL.md`
3. **Skill Resolution Hierarchy**:
   - Priority 1: `.agents/skills/<skill_name>/SKILL.md` (local repository)
   - Priority 2: `~/.gemini/config/skills/<skill_name>/SKILL.md` (global fallback)

---

# Project Knowledge Base

Create `.ai-context/` with all mandatory subdirectories, 12 templates, and 7 base context files.

---

# Execution Layer Setup

## Full Stack Project
```text
src/
├── frontend/
│   ├── app/
│   ├── modules/
│   └── shared/
└── backend/
    ├── app/
    ├── config/
    ├── modules/
    └── shared/
tests/
├── frontend/
│   ├── modules/
│   └── shared/
└── backend/
    ├── config/
    ├── modules/
    └── shared/
docs/
```

---

# Existing Project Protection

1. Inspect the workspace before creating files.
2. Never overwrite existing files without explicit approval.
3. Preserve existing project code and configurations.
4. Report conflicts before modifying existing files.
