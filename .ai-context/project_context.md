# Project Context — Employee Internal Transfer

## Project Name
Employee Internal Transfer

## Project Type
Full Stack

## Architecture Style
Modular Monolith (Microservice Ready)

## Setup Date
2026-09-21

## Technology Stack

### Frontend
- Framework: React (Vite)
- Styling: Tailwind CSS + ShadCN UI
- Language: JavaScript (ES6+ Modules)

### Backend
- Runtime: Node.js
- Framework: Express.js
- Language: JavaScript (ES6+ Modules — `import`/`export` syntax throughout)
- Module System: ES6 Modular (`"type": "module"` in package.json)

### Database
- Engine: PostgreSQL
- ORM / Data Access: Sequelize

### Authentication & Security
- Strategy: JWT (JSON Web Tokens) + Session Token Storage in HTTP-only Cookies
- Tokens stored in cookies (not localStorage)
- CSRF protection required for cookie-based auth flows

### Deployment Target
- Localhost only (development environment)
- No cloud or container deployment configured at this stage

## Reviewer Roster

### Gate 0 Reviewer(s) — BRD Review
| Name | Email / User ID | Role |
|---|---|---|
| Supratim Jetty | supratim.jetty@intglobal.com | Project Manager / BRD Reviewer |

### Gate 1 Reviewer(s) — Spec Peer Review
| Name | Email / User ID | Role |
|---|---|---|
| Supratim Jetty | supratim.jetty@intglobal.com | Project Manager / Spec Peer Reviewer |

### Gate 2 Reviewer(s) — Code Review
| Name | Email / User ID | Role |
|---|---|---|
| Soumyadeep Adhikary | soumyadeep@intglobal.com | Technical Lead / Code Reviewer |

## Governance
- INT AI-First SDD Lifecycle enforced
- All feature specs require Gate 1 approval before development
- All code requires Gate 2 approval before release
- BRD must be ingested and Gate 0 approved before spec generation
- Skill resolution: local `.agents/skills/` first, global fallback second
- PR Gate Workflow: `.agent/workflows/int-pr-gate-workflow.md`

## Repository Structure Convention
- Control Plane: `.agent/`
- Knowledge Base: `.ai-context/`
- Local Skills: `.agents/skills/`
- Frontend Source: `src/frontend/`
- Backend Source: `src/backend/`
- Tests: `tests/frontend/` and `tests/backend/`
- Client BRD Documents: `docs/`
