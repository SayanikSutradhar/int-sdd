# AGENTS.md — INT AI-First Engineering Policy
# Employee Internal Transfer

> This file is the vendor-agnostic governance authority for all AI-assisted engineering on this project.
> It is independent of any specific AI tool or provider (Gemini, Claude, Cursor, Windsurf, Copilot, or other).
> Any AI agent, assistant, or automated tool working on this repository MUST load and enforce this policy.

---

## 1. Project Identity

| Field | Value |
|---|---|
| **Project Name** | Employee Internal Transfer |
| **Project Type** | Full Stack |
| **Architecture** | Modular Monolith (Microservice Ready) |
| **Frontend** | React + Vite + Tailwind CSS + ShadCN UI |
| **Backend** | Node.js + Express.js (ES6 Modules) |
| **Database** | PostgreSQL + Sequelize ORM |
| **Auth Strategy** | JWT + HTTP-only Cookie Session Storage |
| **Deployment** | Localhost (development only) |
| **Setup Date** | 2026-09-21 |

---

## 2. Skill Resolution Hierarchy (MANDATORY)

When executing any workflow, governance rule, or skill:

```
Priority 1 — LOCAL REPOSITORY FIRST
  Check: .agents/skills/<skill-name>/SKILL.md
  If present → load and execute local project skill

Priority 2 — GLOBAL FALLBACK (only if local skill is absent)
  Check: ~/.gemini/config/skills/<skill-name>/SKILL.md
  If present → load and execute global skill
  If absent → report skill not found
```

**This hierarchy is non-negotiable.** Local project skills always take precedence over global AI configurations.

---

## 3. Reviewer Roster (Gate Authorization)

All PR Gate review decisions MUST be validated against this roster using **Git email matching only**.
User name matching is NOT sufficient — email must match exactly.

### Gate 0 — BRD Review
| Reviewer | Email | Role |
|---|---|---|
| Supratim Jetty | supratim.jetty@intglobal.com | Project Manager / BRD Reviewer |

### Gate 1 — Spec Peer Review
| Reviewer | Email | Role |
|---|---|---|
| Supratim Jetty | supratim.jetty@intglobal.com | Project Manager / Spec Peer Reviewer |

### Gate 2 — Code Review
| Reviewer | Email | Role |
|---|---|---|
| Soumyadeep Adhikary | soumyadeep@intglobal.com | Technical Lead / Code Reviewer |

**Authorization Rule**: Any attempt to approve, reject, or request changes on a Gate review by a user whose Git email does NOT match this roster MUST be blocked immediately.

---

## 4. SDD Lifecycle Enforcement

### 4.1 Gate Sequence (NON-NEGOTIABLE)

```
BRD Ingestion (docs/)
      ↓
Gate 0 — BRD PR Review (Approved)
      ↓
Feature Spec Generation (.ai-context/specs/<slug>.spec.md)
      ↓
Gate 1 — Spec Peer Review (Approved)
      ↓
Implementation Plan (.ai-context/plans/<slug>.plan.md)
      ↓
Task Breakdown (.ai-context/tasks/<slug>.tasks.md)
      ↓
Test Cases (.ai-context/test_cases/<slug>.test_cases.md)
      ↓
TDD RED — Write Failing Tests (tests/)
      ↓
TDD GREEN — Write Implementation (src/)
      ↓
Test Suite Verification (All GREEN)
      ↓
Gate 2 — Code Review (Approved)
      ↓
Release Management
      ↓
Released (vX.Y.Z)
```

### 4.2 Strict Blocking Rules

- **Spec generation is BLOCKED** until BRD Gate 0 is Approved.
- **Plan/Tasks/Code generation is BLOCKED** if Gate 1 status is Rejected or Changes Requested.
- **Release is BLOCKED** if Gate 2 status is Rejected or Changes Requested.
- **Gate bypassing is PROHIBITED** under any circumstance.
- **Parallel spec execution is ALLOWED** — specs progress independently once BRD Gate 0 is approved.

### 4.3 Change Request Rule

Trigger a formal Change Request workflow (Spec revision + Gate 1 re-approval) **ONLY** when the user's prompt explicitly contains the words **"Change Request"** or **"CR"**.

All other prompts without these keywords are treated as development fixes or UI bug fixes under the active approved spec.

---

## 5. Artifact File Structure & Naming Conventions

All `.ai-context/` artifacts use flat file structure. Subdirectories within artifact folders are PROHIBITED.

| Artifact Type | Location | Naming Convention |
|---|---|---|
| Feature Spec | `.ai-context/specs/` | `<feature-slug>.spec.md` |
| Implementation Plan | `.ai-context/plans/` | `<feature-slug>.plan.md` |
| Task Breakdown | `.ai-context/tasks/` | `<feature-slug>.tasks.md` |
| Test Cases | `.ai-context/test_cases/` | `<feature-slug>.test_cases.md` |
| Gate 1 Review | `.ai-context/pr_reviews/` | `GATE1-<slug>-<YYYYMMDD-HHMMSS>.md` |
| Gate 2 Review | `.ai-context/pr_reviews/` | `GATE2-<slug>-<YYYYMMDD-HHMMSS>.md` |
| ADR | `.ai-context/decisions/` | `ADR-NNN.md` |
| Incident | `.ai-context/incidents/` | `INC-YYYY-NNN.md` |
| Hotfix Spec | `.ai-context/specs/` | `hotfix-<incident-slug>.spec.md` |
| Hotfix Record | `.ai-context/hotfixes/` | `HOTFIX-<incident-slug>.md` |
| Release | `.ai-context/releases/` | `RELEASE-vX.Y.Z.md` |
| Change Request | `.ai-context/change_requests/` | `CR-<YYYYMMDD>-<slug>.md` |

**Path convention**: All file references in repository artifacts MUST use **repository-relative paths**. Absolute local OS paths (e.g. `C:\Users\...`) are PROHIBITED in any committed file.

---

## 6. Prompt History — Append-Only Rule

`.ai-context/prompt_history.md` is a mandatory, append-only audit log.

- NEVER overwrite this file.
- ALWAYS append new entries to the bottom.
- Log format:

```markdown
### [YYYY-MM-DD HH:MM]
**User Request:** <one-sentence summary>
**Agent Action:** <brief description of files modified and actions taken>
```

---

## 7. Engineering Standards (Summary)

Full standards: `.agent/rules/int-standards.md`

- ES6+ syntax throughout — `const`/`let` only, no `var`.
- `async/await` only — no raw `.then().catch()` chains.
- `import`/`export` ES6 modules only — no `require()` in new code.
- All async operations wrapped in `try/catch`.
- No hardcoded secrets — environment variables via `process.env` only.
- No `console.log` in production paths — use project logger (Winston).
- No AI-generated code comments or AI-hinting commit messages.
- Validate and sanitize all incoming user input.
- Parameterized Sequelize queries only — no raw SQL interpolation.

---

## 8. Available Workflows

All workflows live in `.agent/workflows/`. Trigger with the corresponding slash command:

| Workflow | File | Trigger |
|---|---|---|
| Project Setup | `int-project-setup.md` | `/int-project-setup` |
| BRD Ingestion | `int-brd-ingestion.md` | `/int-brd-ingestion` |
| Project From BRD | `int-project-from-brd.md` | `/int-project-from-brd` |
| PR Gate Workflow | `int-pr-gate-workflow.md` | `/int-pr-gate-workflow` |
| Code Review | `int-code-review.md` | `/int-code-review` |
| Generate Tests | `int-generate-tests.md` | `/int-generate-tests` |
| Hotfix Management | `int-hotfix-management.md` | `/int-hotfix-management` |
| Production Incident | `int-production-incident.md` | `/int-production-incident` |
| Release Management | `int-release-management.md` | `/int-release-management` |
| Project Resume | `int-project-resume.md` | `/int-project-resume` |

---

## 9. Local Skills

Project-local skills are in `.agents/skills/`. They take precedence over global skills.

| Skill | Location |
|---|---|
| int-project-setup | `.agents/skills/int-project-setup/SKILL.md` |
| int-sdd-lifecycle | `.agents/skills/int-sdd-lifecycle/SKILL.md` |
| int-brd-ingestion | `.agents/skills/int-brd-ingestion/SKILL.md` |
| int-incident-management | `.agents/skills/int-incident-management/SKILL.md` |
| int-hotfix-management | `.agents/skills/int-hotfix-management/SKILL.md` |
| int-release-management | `.agents/skills/int-release-management/SKILL.md` |
| int-session-continuation | `.agents/skills/int-session-continuation/SKILL.md` |

---

## 10. Non-Negotiable Safety Rules

1. Never delete, overwrite, or reset `.ai-context/BRD.md`, `constitution.md`, `project_context.md`, `architecture.md`, `status.md`, or `prompt_history.md` without explicit user confirmation.
2. Never delete existing source code in `src/` or `tests/` without explicit user confirmation.
3. Never deploy to any environment other than localhost without explicit user confirmation.
4. Never commit `.env` files or secrets to the repository.
5. Never introduce a new dependency without confirming it is pinned to an exact version.
6. Never introduce a new datastore without a corresponding ADR.
7. Never skip or bypass Gate 0, Gate 1, or Gate 2 review cycles.
