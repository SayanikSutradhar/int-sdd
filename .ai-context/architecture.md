# Architecture — Employee Internal Transfer

## Architecture Style
Modular Monolith (Microservice Ready)

Local development runs as a single deployable monolith. Business modules have clear boundaries and minimal coupling, enabling future extraction into independent services without major refactoring.

**BRD Version:** 1.0 (Approved Gate 0 — 2026-09-21)
**Architecture Status:** BRD-Derived — Pending Gate 1 Spec Approval

---

## System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Client Browser                               │
│              React + Vite + Tailwind CSS + ShadCN UI                 │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │  auth    │  │ transfer │  │approvals │  │  audit   │            │
│  │ module   │  │-requests │  │  module  │  │  module  │            │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
│                                                                      │
│              ┌─────────────────────────────┐                        │
│              │     notifications module    │                        │
│              └─────────────────────────────┘                        │
└──────────────────────────┬───────────────────────────────────────────┘
                           │ HTTPS / REST JSON
                           │ JWT in HTTP-only Cookie
┌──────────────────────────▼───────────────────────────────────────────┐
│                    Node.js + Express Backend                         │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                      Business Modules                         │  │
│  │  ┌──────────┐  ┌──────────────────┐  ┌─────────────────────┐ │  │
│  │  │   auth   │  │ transfer-requests│  │     approvals       │ │  │
│  │  │          │  │                  │  │                     │ │  │
│  │  │ JWT/SSO  │  │ BRD-001,005,     │  │ BRD-002,003,004     │ │  │
│  │  │ RBAC     │  │ 006,010          │  │ State machine       │ │  │
│  │  └──────────┘  └──────────────────┘  └─────────────────────┘ │  │
│  │  ┌──────────────────────┐  ┌───────────────────────────────┐  │  │
│  │  │    notifications     │  │           audit               │  │  │
│  │  │                      │  │                               │  │  │
│  │  │ BRD-007,008          │  │ BRD-009 — immutable log       │  │  │
│  │  │ Email + Integrations │  │ 7-year retention              │  │  │
│  │  └──────────────────────┘  └───────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                        Shared Layer                           │  │
│  │  database/ │ logger/ │ errors/ │ utils/                       │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                      Scheduled Jobs                           │  │
│  │  effective-date-processor (daily cron — BRD-010)              │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────┬───────────────────────────────────────────┘
                           │ Sequelize ORM
┌──────────────────────────▼───────────────────────────────────────────┐
│                         PostgreSQL                                   │
│  users │ transfer_requests │ approval_steps │ audit_events           │
│  departments │ notification_logs │ integration_logs                  │
└──────────────────────────────────────────────────────────────────────┘
                           │
          ┌────────────────┼──────────────────┐
          ▼                ▼                  ▼
   ┌─────────────┐  ┌─────────────┐  ┌──────────────┐
   │  IT System  │  │   Payroll   │  │  Facilities  │
   │ (notif only)│  │ (notif only)│  │ (notif only) │
   └─────────────┘  └─────────────┘  └──────────────┘
```

---

## Business Domain Map

Derived from approved BRD v1.0. Each domain maps to one bounded module on both backend and frontend.

| Domain | Module Slug | BRD Requirements | Actors | Future Service Boundary |
|---|---|---|---|---|
| Authentication & Identity | `auth` | NFR-001, all actors | All | Auth Service |
| Transfer Request Management | `transfer-requests` | BRD-001, BRD-005, BRD-006, BRD-010 | Employee, System | Transfer Service |
| Approval Workflow | `approvals` | BRD-002, BRD-003, BRD-004 | Manager (Current), HR Admin, Manager (Target) | Workflow Service |
| Notifications | `notifications` | BRD-007, BRD-008 | System, Integration Systems | Notification Service |
| Audit & Compliance | `audit` | BRD-009 | HR Admin, System Admin | Audit Service |

### Domain Dependency Order
```
auth
  └── transfer-requests
        ├── approvals
        │     └── notifications
        │           └── audit
        └── audit
```

**Rule**: Cross-module communication is via explicit service function calls only. No direct model imports across module boundaries. No circular dependencies.

---

## Module Specifications

### Module 1 — `auth`
**Responsibility**: JWT issuance, HTTP-only cookie management, SSO integration point, RBAC enforcement, session validation.

**BRD Traceability**: NFR-001, BR-002 (role-gated actions), all actor access requirements.

**Actors Served**: All (Employee, Manager, HR Admin, System Admin)

**Key Responsibilities**:
- Login / logout endpoints
- JWT signing with `process.env.JWT_SECRET` (HS256, 15-min access / 7-day refresh)
- HTTP-only, Secure, SameSite=Strict cookie delivery
- Auth middleware (`requireAuth`) applied to all protected routes
- RBAC middleware (`requireRole(...roles)`) applied per-route
- SSO integration stub (Open Question 1 — protocol TBD)
- Role resolution from JWT claims: `employee`, `manager`, `hr_admin`, `sys_admin`

**Backend Endpoints (provisional)**:
```
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
POST   /api/v1/auth/refresh
```

---

### Module 2 — `transfer-requests`
**Responsibility**: Full lifecycle of a transfer request entity — creation, status tracking, withdrawal, effective date finalization.

**BRD Traceability**: BRD-001 (submission), BRD-005 (status tracking), BRD-006 (withdrawal), BRD-010 (effective date enforcement).

**Actors Served**: Employee (create, view, withdraw), System (effective date job)

**Key Responsibilities**:
- Create transfer request with unique ID (TR-YYYYMMDD-XXXXX)
- Enforce BR-001 (eligibility check: tenure, disciplinary, prior requests)
- Enforce BR-003 (effective date 30–90 days from submission)
- Enforce BR-005 (single active request per employee)
- Status state machine management
- Withdrawal with confirmation and stakeholder notification trigger
- Scheduled effective date processor (daily cron — BRD-010)
- Employee "My Transfer Requests" view with approval history

**Transfer Request Status FSM**:
```
[Submitted]
    → Pending Manager Approval
    → Pending HR Validation        (on manager approval)
    → Pending Target Confirmation  (on HR approval)
    → Approved — Pending Effective Date  (on target confirmation)
    → Effective                    (on effective date — BRD-010)
    ↘ Rejected by Manager          (terminal)
    ↘ Rejected by HR               (terminal)
    ↘ Declined by Target Manager   (terminal)
    ↘ Withdrawn by Employee        (terminal — any non-terminal state)
```

**Backend Endpoints (provisional)**:
```
POST   /api/v1/transfer-requests
GET    /api/v1/transfer-requests                    (employee: own; HR/admin: all)
GET    /api/v1/transfer-requests/:id
GET    /api/v1/transfer-requests/:id/history
DELETE /api/v1/transfer-requests/:id/withdraw
```

---

### Module 3 — `approvals`
**Responsibility**: Multi-actor approval workflow engine — manager approval, HR validation, target manager confirmation. Enforces BR-002 (strict sequence) and BR-004 (timeout escalation).

**BRD Traceability**: BRD-002 (manager approval), BRD-003 (HR validation), BRD-004 (target manager confirmation).

**Actors Served**: Manager (Current), HR Administrator, Manager (Target)

**Key Responsibilities**:
- Manager approval / rejection with comments
- HR eligibility validation (display tenure, role, policy constraints) — approval / rejection
- Target manager confirmation / decline
- Enforce BR-002: sequence gate — each step only activatable when prior step approved
- Enforce BR-004: timeout detection (7 business days), escalation trigger
- Notification trigger on each decision (delegates to `notifications` module)
- Audit event emission on each decision (delegates to `audit` module)

**Backend Endpoints (provisional)**:
```
GET    /api/v1/approvals/pending                    (actor-scoped: own pending actions)
GET    /api/v1/approvals/:transferId
POST   /api/v1/approvals/:transferId/manager        (current manager action)
POST   /api/v1/approvals/:transferId/hr             (HR admin action)
POST   /api/v1/approvals/:transferId/target-manager (target manager action)
```

---

### Module 4 — `notifications`
**Responsibility**: All outbound communications — email notifications at workflow milestones (BRD-008) and integration payload delivery to IT, Payroll, Facilities systems (BRD-007).

**BRD Traceability**: BRD-007 (integration notifications), BRD-008 (email notifications).

**Actors Served**: System (triggered internally)

**Key Responsibilities**:
- Email dispatch for all 9 workflow events (BRD-008)
- Integration payload delivery: IT system, Payroll system, Facilities system (BRD-007)
- Asynchronous dispatch (fire-and-forget pattern, non-blocking)
- Retry logic: up to 3 attempts with exponential backoff (NFR-006)
- Notification log persistence (success/failure/retry count)
- Email template management (configurable per event type)
- Integration health status exposed to System Admin

**Backend Endpoints (provisional)**:
```
GET    /api/v1/notifications/logs/:transferId       (audit/admin view)
GET    /api/v1/notifications/integration-health     (sys_admin only)
POST   /api/v1/notifications/retry/:logId           (sys_admin manual retry)
```

---

### Module 5 — `audit`
**Responsibility**: Immutable append-only event log for all transfer workflow actions. Compliance-grade, 7-year retention, tamper-proof.

**BRD Traceability**: BRD-009 (audit trail and history), NFR-001 (tamper-proof audit).

**Actors Served**: HR Administrator, System Administrator (read-only consumers)

**Key Responsibilities**:
- Append audit events — never update or delete
- Event schema: `transfer_request_id`, `event_type`, `actor_id`, `actor_role`, `timestamp`, `payload` (JSON), `ip_address`
- All state transitions emit audit events (triggered by other modules)
- All integration notification attempts emit audit events
- HR Admin and System Admin audit trail view with filtering
- Retention policy enforcement (configurable floor: 7 years)

**Backend Endpoints (provisional)**:
```
GET    /api/v1/audit/:transferId                    (HR admin, sys_admin)
GET    /api/v1/audit                                (sys_admin — full log with filters)
```

---

## Frontend Architecture

- **Framework**: React 18 with Vite build tooling
- **Styling**: Tailwind CSS (utility-first) + ShadCN UI (component library)
- **Language**: JavaScript ES6+ Modules
- **State Management**: Zustand (lightweight, no boilerplate — suitable for workflow state)
- **Routing**: React Router v6
- **API Communication**: Axios — all calls target `/api/v1/` REST endpoints
- **Auth Token Handling**: JWT delivered and stored in HTTP-only cookies — no client-side token management required; `axios` configured with `withCredentials: true`

### Frontend Module Map

| Module | Pages | Key Components | BRD |
|---|---|---|---|
| `auth` | Login, Logout | LoginForm, AuthGuard, RoleGuard | NFR-001 |
| `transfer-requests` | MyTransfers, SubmitTransfer, TransferDetail | TransferForm, StatusBadge, HistoryTimeline, WithdrawModal | BRD-001, 005, 006, 010 |
| `approvals` | PendingApprovals, ApprovalDetail | ApprovalCard, DecisionForm, ApprovalHistory | BRD-002, 003, 004 |
| `notifications` | (admin) NotificationLogs, IntegrationHealth | NotificationLogTable, RetryButton, HealthIndicator | BRD-007, 008 |
| `audit` | AuditTrail | AuditEventTable, AuditFilters, ExportAudit | BRD-009 |

### Frontend Module Structure
```
src/frontend/
├── app/
│   ├── routes/           # Route definitions + role-based guards
│   ├── providers/        # Auth provider, Zustand store provider
│   └── store/            # Global Zustand stores
├── modules/
│   ├── auth/
│   │   ├── components/   # LoginForm, AuthGuard, RoleGuard
│   │   ├── pages/        # LoginPage, LogoutPage
│   │   ├── hooks/        # useAuth, useCurrentUser
│   │   ├── services/     # authService (login, logout, refresh)
│   │   └── utils/        # role helpers
│   ├── transfer-requests/
│   │   ├── components/   # TransferForm, StatusBadge, HistoryTimeline, WithdrawModal
│   │   ├── pages/        # MyTransfersPage, SubmitTransferPage, TransferDetailPage
│   │   ├── hooks/        # useTransferRequests, useTransferDetail
│   │   ├── services/     # transferService (CRUD, withdraw)
│   │   └── utils/        # status helpers, date validators
│   ├── approvals/
│   │   ├── components/   # ApprovalCard, DecisionForm, ApprovalHistoryPanel
│   │   ├── pages/        # PendingApprovalsPage, ApprovalDetailPage
│   │   ├── hooks/        # usePendingApprovals, useApprovalAction
│   │   ├── services/     # approvalService (pending, decide)
│   │   └── utils/        # approval step helpers
│   ├── notifications/
│   │   ├── components/   # NotificationLogTable, RetryButton, HealthIndicator
│   │   ├── pages/        # NotificationLogsPage, IntegrationHealthPage
│   │   ├── hooks/        # useNotificationLogs, useIntegrationHealth
│   │   ├── services/     # notificationService (logs, health, retry)
│   │   └── utils/
│   └── audit/
│       ├── components/   # AuditEventTable, AuditFilters, ExportAuditButton
│       ├── pages/        # AuditTrailPage
│       ├── hooks/        # useAuditTrail
│       ├── services/     # auditService (fetch, export)
│       └── utils/        # audit event formatters
└── shared/
    ├── components/       # Button, Modal, Badge, Table, Spinner, ErrorBoundary
    ├── hooks/            # useApi, usePagination, useDebounce
    ├── services/         # axiosInstance (withCredentials, interceptors)
    └── utils/            # date, format, validation utilities
```

---

## Backend Architecture

- **Runtime**: Node.js (LTS)
- **Framework**: Express.js
- **Language**: JavaScript ES6+ Modules (`"type": "module"` in package.json)
- **ORM**: Sequelize with PostgreSQL dialect
- **Auth**: JWT signed tokens, delivered via HTTP-only cookie on login
- **Session Strategy**: Stateless JWT — cookie carries the signed token; server validates on each request
- **Middleware Stack**: CORS, cookie-parser, helmet (security headers), express-validator (input validation), JWT auth middleware, RBAC middleware

### Backend Module Structure
```
src/backend/
├── app/
│   ├── config/           # env, database, cors, jwt config
│   ├── middleware/       # requireAuth.js, requireRole.js, errorHandler.js, validate.js
│   ├── routes/           # index.js — aggregates all module routes
│   └── server.js         # Express bootstrap
├── modules/
│   ├── auth/
│   │   ├── controllers/  # authController.js
│   │   ├── services/     # authService.js (JWT, cookie, SSO stub)
│   │   ├── repositories/ # userRepository.js
│   │   ├── models/       # User.js (Sequelize)
│   │   ├── validators/   # loginValidator.js
│   │   └── routes/       # authRoutes.js
│   ├── transfer-requests/
│   │   ├── controllers/  # transferController.js
│   │   ├── services/     # transferService.js, eligibilityService.js, effectiveDateJob.js
│   │   ├── repositories/ # transferRepository.js
│   │   ├── models/       # TransferRequest.js (Sequelize)
│   │   ├── validators/   # createTransferValidator.js, withdrawValidator.js
│   │   └── routes/       # transferRoutes.js
│   ├── approvals/
│   │   ├── controllers/  # approvalController.js
│   │   ├── services/     # approvalService.js, escalationService.js
│   │   ├── repositories/ # approvalRepository.js
│   │   ├── models/       # ApprovalStep.js (Sequelize)
│   │   ├── validators/   # approvalActionValidator.js
│   │   └── routes/       # approvalRoutes.js
│   ├── notifications/
│   │   ├── controllers/  # notificationController.js
│   │   ├── services/     # emailService.js, integrationService.js, retryService.js
│   │   ├── repositories/ # notificationLogRepository.js
│   │   ├── models/       # NotificationLog.js (Sequelize)
│   │   ├── validators/
│   │   └── routes/       # notificationRoutes.js
│   └── audit/
│       ├── controllers/  # auditController.js
│       ├── services/     # auditService.js (append-only)
│       ├── repositories/ # auditRepository.js
│       ├── models/       # AuditEvent.js (Sequelize)
│       ├── validators/   # auditQueryValidator.js
│       └── routes/       # auditRoutes.js
└── shared/
    ├── database/         # sequelize.js, migrations/, seeders/
    ├── logger/           # logger.js (Winston)
    ├── errors/           # AppError.js, errorHandler.js
    └── utils/            # dateUtils.js, paginationUtils.js, maskUtils.js
```

---

## Database Architecture

- **Engine**: PostgreSQL
- **ORM**: Sequelize (with migrations)
- **Schema Management**: Sequelize migrations only — `sync({ force: true })` prohibited in non-test environments
- **Naming Conventions**: `snake_case` for all table and column names

### Core Data Models

| Model | Table | Key Fields | Module |
|---|---|---|---|
| `User` | `users` | `id`, `email`, `role`, `department_id`, `manager_id`, `tenure_start`, `is_active` | auth |
| `Department` | `departments` | `id`, `name`, `manager_id`, `location` | shared |
| `TransferRequest` | `transfer_requests` | `id`, `employee_id`, `target_department_id`, `target_location`, `preferred_effective_date`, `justification`, `status`, `submitted_at`, `effective_at` | transfer-requests |
| `ApprovalStep` | `approval_steps` | `id`, `transfer_request_id`, `step_type` (manager/hr/target_manager), `actor_id`, `decision` (approved/rejected/declined), `comments`, `decided_at`, `escalated_at` | approvals |
| `NotificationLog` | `notification_logs` | `id`, `transfer_request_id`, `notification_type` (email/integration), `recipient`, `event_type`, `status` (sent/failed/retrying), `attempts`, `last_attempted_at` | notifications |
| `AuditEvent` | `audit_events` | `id`, `transfer_request_id`, `event_type`, `actor_id`, `actor_role`, `payload` (JSONB), `ip_address`, `created_at` | audit |

### Database Relationships
```
users ──< transfer_requests (employee_id)
users ──< transfer_requests (via departments.manager_id — target manager)
departments ──< transfer_requests (target_department_id)
transfer_requests ──< approval_steps
transfer_requests ──< notification_logs
transfer_requests ──< audit_events
```

---

## Authentication & Security Architecture

- **Token Type**: JWT (JSON Web Token)
- **Signing Algorithm**: HS256 (secret from `process.env.JWT_SECRET`)
- **Access Token TTL**: 15 minutes
- **Refresh Token TTL**: 7 days (HTTP-only cookie)
- **Token Delivery**: Set as HTTP-only, Secure, SameSite=Strict cookie on successful login
- **Token Validation**: `requireAuth` middleware validates JWT from cookie on every protected request
- **Session Persistence**: Stateless — no server-side session store
- **CSRF Protection**: Double-submit cookie pattern
- **Role-Based Access**: `requireRole(...roles)` middleware per endpoint

### Role → Endpoint Access Matrix

| Role | transfer-requests | approvals | notifications | audit |
|---|---|---|---|---|
| `employee` | Own requests only (R/W/withdraw) | — | — | — |
| `manager` | View direct reports' requests | Manager step only | — | — |
| `hr_admin` | All requests (R) | HR step only | Notification logs | Own transfers + audit view |
| `sys_admin` | All (R) | All (R) | Full (logs, health, retry) | Full |

---

## API Design Conventions

- **Base path**: `/api/v1/`
- **RESTful resource naming**: plural nouns, kebab-case
- **Auth**: `requireAuth` on all routes; `requireRole` per action
- **Consistent JSON envelope**:
  ```json
  { "success": true, "data": { } }
  { "success": false, "error": { "code": "ERROR_CODE", "message": "Human readable" } }
  ```
- **Pagination**: offset-based (`?page=1&limit=20`) for all list endpoints
- **Filtering**: query params on list endpoints (`?status=`, `?from=`, `?to=`)
- **Versioning**: `/api/v1/` — breaking changes require `/api/v2/` + ADR

### Full Provisional API Surface

```
# Auth
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
POST   /api/v1/auth/refresh

# Transfer Requests
POST   /api/v1/transfer-requests
GET    /api/v1/transfer-requests
GET    /api/v1/transfer-requests/:id
GET    /api/v1/transfer-requests/:id/history
DELETE /api/v1/transfer-requests/:id/withdraw

# Approvals
GET    /api/v1/approvals/pending
GET    /api/v1/approvals/:transferId
POST   /api/v1/approvals/:transferId/manager
POST   /api/v1/approvals/:transferId/hr
POST   /api/v1/approvals/:transferId/target-manager

# Notifications
GET    /api/v1/notifications/logs/:transferId
GET    /api/v1/notifications/integration-health
POST   /api/v1/notifications/retry/:logId

# Audit
GET    /api/v1/audit/:transferId
GET    /api/v1/audit
```

---

## Scheduled Jobs

| Job | Schedule | Responsibility | BRD |
|---|---|---|---|
| `effective-date-processor` | Daily at 00:00 (configurable) | Query `transfer_requests` WHERE `status = 'approved_pending_effective'` AND `preferred_effective_date <= NOW()`. Transition to `effective`. Emit audit event. Trigger notification. | BRD-010 |
| `approval-timeout-detector` | Daily at 08:00 (configurable) | Query `approval_steps` WHERE `decided_at IS NULL` AND `created_at <= NOW() - 7 business days`. Trigger escalation notification. | BR-004 |

---

## Architecture Decision Records

| ADR | Decision | Status |
|---|---|---|
| ADR-001 | Zustand for frontend state management | Pending formal ADR |
| ADR-002 | Axios with `withCredentials: true` for API client | Pending formal ADR |
| ADR-003 | Asynchronous fire-and-forget for integration notifications | Pending formal ADR |
| ADR-004 | Append-only audit table — no soft deletes, no updates | Pending formal ADR |
| ADR-005 | Daily cron for effective date enforcement (vs event-driven) | Pending formal ADR |

---

## Open Architecture Questions (from BRD)

| # | Question | Blocks | Resolution |
|---|---|---|---|
| OQ-1 | SSO protocol (SAML / OAuth2 / OIDC) | `auth` module spec | Unresolved |
| OQ-2 | Integration endpoint specs (REST/SOAP/queue) for IT, Payroll, Facilities | `notifications` module spec | Unresolved |
| OQ-3 | Employee eligibility data source (tenure, disciplinary) | `transfer-requests` eligibility service | Unresolved |
| OQ-4 | Escalation authority when manager times out | `approvals` escalation service | Unresolved |
| OQ-5 | Manager hierarchy source (SSO claims vs HR directory vs portal) | `auth` + `approvals` | Unresolved |
| OQ-6 | Target manager identification method | `approvals` target step | Unresolved |
| OQ-7 | Cost center mapping for payroll notification | `notifications` integration payload | Unresolved |
| OQ-8 | Notification retry max count and interval | `notifications` retry service | Unresolved (BRD says 3 attempts) |
| OQ-9 | 7-year audit retention — regulatory or configurable | `audit` module spec | Unresolved |
| OQ-10 | Portal session timeout policy | `auth` module spec | Unresolved |

> These open questions must be resolved (as ADRs or spec clarifications) before Gate 1 approval of the relevant feature specs.

---

## Proposed Feature Spec Breakdown

Each spec maps to one bounded BRD scope. Specs proceed in dependency order after BRD Gate 0 approval.

| Spec Slug | Title | BRD Coverage | Depends On | Priority |
|---|---|---|---|---|
| `auth` | Authentication, Authorization & RBAC | NFR-001, all actors | — | P1 — Foundation |
| `transfer-requests` | Transfer Request Lifecycle | BRD-001, BRD-005, BRD-006, BRD-010 | `auth` | P1 — Core |
| `approvals` | Approval Workflow Engine | BRD-002, BRD-003, BRD-004 | `transfer-requests` | P1 — Core |
| `notifications` | Email & Integration Notifications | BRD-007, BRD-008 | `approvals` | P2 — Supporting |
| `audit` | Audit Trail & Compliance | BRD-009 | `transfer-requests` | P2 — Supporting |

---

## Revision History

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1 | 2026-09-21 | INT AI Agent | Initial scaffold (pre-BRD) |
| 1.0 | 2026-09-21 | INT AI Agent | BRD-derived architecture — 5 modules, full domain map, DB models, API surface, scheduled jobs, spec breakdown |
