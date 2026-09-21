---
name: int-session-continuation
description: Resume context and continue engineering tasks across session restarts by reading repository persistent memory (.ai-context/status.md, specs, plans, tasks, git status).
---

# INT Session Continuation & Context Recovery

## Purpose
This skill defines the mandatory protocol for resuming work in a project repository after a session restart, context clearance, or agent handoff.

The repository, NOT the chat window, is the persistent memory of the project.

---

# Core Rule — Repository Memory Authority

- Do NOT rely on chat history, memory, or user recall as the permanent source of truth.
- Do NOT guess project state, active features, or next tasks.
- Read only the specific repository artifacts required to determine the active state.
- All file paths and references written to `.ai-context/` artifacts MUST be **repository-relative** (e.g. `.ai-context/specs/<slug>.spec.md`, `src/...`) to ensure full Git portability across developer workstations and CI/CD. Never write local OS absolute paths (`C:\Users\...`).

---

# Skill & Governance Resolution Hierarchy

When executing any engineering task or reading project governance:
1. **Priority 1 — Check Repository Local Files FIRST**: Inspect project repository root for `AGENTS.md` and `.agents/skills/<skill_name>/SKILL.md`. If present, load and follow local project skills.
2. **Priority 2 — Fallback to Global Skills SECOND**: If and ONLY if a requested skill or rule file is not present in `.agents/skills/`, fall back to reading global skills (`~/.gemini/config/skills/`).

---

# State-Driven `int-project-resume` Engine

The `/int-project-resume` workflow is the **authoritative entry point for resuming an interrupted or in-progress SDD project**.

## State Reconstruction Chain

```text
Inspect Repository Memory (.ai-context/status.md, dashboard.html, project_context.md)
        ↓
Inspect BRD & Gate 0 Review State (.ai-context/BRD.md, pr_reviews/BRD-*.md)
        ↓
Inspect All Feature Specs & Gate 1 Status (.ai-context/specs/*.spec.md, pr_reviews/GATE1-*.md)
        ↓
Present Multi-Spec Interactive Selection Table (If BRD & Gate 0 Approved)
        ↓
Inspect Selected Spec Downstream State (.plan.md, .tasks.md, .test_cases.md)
        ↓
Inspect Development & TDD State (tests/, src/, incomplete - [ ] tasks)
        ↓
Inspect Gate 2 Review State (pr_reviews/GATE2-*.md)
        ↓
Inspect Release State & Release Artifacts (.ai-context/releases/)
        ↓
Inspect Git Working Tree & PR Comments
        ↓
Validate Workflow Consistency & Present Action Options to Developer
        ↓
Wait for Developer Confirmation & Execute Selected Action
```

---

# Non-Negotiable Safety & Precedence Rules

1. **State Precedence Hierarchy**: Gate 0 Approval > Spec Approval (Gate 1) > Gate 2 Approval > Release Generation.
2. **Zero Gate Bypassing**: Never skip Gate 0, Gate 1 (Spec Approval), or Gate 2 (Code Review).
3. **No Unapproved Artifact Downstream**: Never generate plans, tasks, test cases, or implementation code for unapproved BRDs or Specs.
4. **No Unconfirmed Overwrites**: Never regenerate or overwrite approved artifacts without explicit user confirmation.
5. **No Blind Continuation**: Never assume the last executed command represents current state; always reconstruct state from repository memory.

---

# Handling Existing & Ongoing Projects (Retrofit & Auto-Sync)

When working with an existing, legacy, or ongoing project:

1. **Automatic Control Plane Upgrade (Dynamic Sync)**: The agent inspects `.agent/rules/` and `.agent/workflows/`. If any workflow or rule files are missing compared to the global INT Control Plane source, the agent automatically copies the missing files into `.agent/` without overwriting custom project code or user settings.

2. **Legacy Projects Lacking `.ai-context/`**: If an existing project lacks `.ai-context/`, the agent runs `int-project-setup` in **Non-Destructive Baseline Mode** to generate `.ai-context/` artifacts and templates without touching existing source code (`src/`, `tests/`).
