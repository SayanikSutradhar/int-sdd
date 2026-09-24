# Spec: Employee Internal Transfer — Full System SDD

## Spec ID
`internal-transfer-sdd`

## Status
Draft — On Hold (Pending Gate 0 BRD Approval)

## Roles & Assignments
- **Developer:** Sayanik Sutradhar (sayanik.sutradhar@intglobal.com)
- **Gate 1 Reviewer:** Supratim Jetty (supratim.jetty@intglobal.com) — Project Manager
- **Gate 2 Reviewer:** Soumyadeep Adhikary (soumyadeep@intglobal.com) — Technical Lead

## Linked BRD
`.ai-context/BRD.md` — BRD-001 through BRD-010, NFR-001 through NFR-006, BR-001 through BR-005

## Gate Approvals & History
| Gate | Approver Name | Approver Email/ID | Date/Time | Outcome | Comment |
|---|---|---|---|---|---|
| Gate 1 (Spec Review) | Supratim Jetty | supratim.jetty@intglobal.com | — | Pending | — |
| Gate 2 (Code Review) | Soumyadeep Adhikary | soumyadeep@intglobal.com | — | Pending | — |

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Module 1 — Authentication & RBAC](#module-1--authentication--rbac)
3. [Module 2 — Transfer Request Lifecycle](#module-2--transfer-request-lifecycle)
4. [Module 3 — Approval Workflow Engine](#module-3--approval-workflow-engine)
5. [Module 4 — Email & Integration Notifications](#module-4--email--integration-notifications)
6. [Module 5 — Audit Trail & Compliance](#module-5--audit-trail--compliance)
7. [Consolidated Acceptance Criteria](#consolidated-acceptance-criteria)
8. [Consolidated Unit Test Cases](#consolidated-unit-test-cases)
9. [Open Questions](#open-questions)

---

## System Overview

### Intent

Implement the complete Employee Internal Transfer Portal — a full-stack, modular monolith that digitises the fragmented manual internal transfer process into a single unified workflow through the organisation's One-Point Employee Portal.

The system covers:
- Employee-initiated transfer requests
- Sequential multi-actor approval workflow (Current Manager → HR Administrator → Target Manager)
- Automated effective date enforcement
- Email notifications at all workflow milestones
- Asynchronous integration notifications to IT, Payroll, and Facilities systems
- Immutable audit trail with 7-year retention

### Architecture
- **Backend**: Node.js + Express.js (ES6 Modules), PostgreSQL + Sequelize ORM
- **Frontend**: React + Vite + Tailwind CSS + ShadCN UI
- **Auth**: JWT (HTTP-only cookies, stateless)
- **Deployment**: Localhost (development only)
- Reference: `.ai-context/architecture.md`

### Module Dependency Order
```
auth  →  transfer-requests  →  approvals  →  notifications
                           ↘                ↗
                             audit (cross-cutting)
```

### Transfer Request Status FSM
```
[Created] ──────────────────────────────────────────────────────► pending_manager_approval
pending_manager_approval ──► pending_hr_validation          (manager approves)
pending_manager_approval ──► rejected_by_manager            (manager rejects — terminal)
pending_hr_validation    ──► pending_target_confirmation    (HR approves)
pending_hr_validation    ──► rejected_by_hr                 (HR rejects — terminal)
pending_target_confirmation ─► approved_pending_effective   (target confirms)
pending_target_confirmation ─► declined_by_target_manager   (target declines — terminal)
approved_pending_effective  ─► effective                    (scheduled job — BRD-010)
Any non-terminal state ─────► withdrawn_by_employee         (employee withdraws — BRD-006)
```

### Complete API Surface
```
# Auth (4 endpoints)
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
POST   /api/v1/auth/refresh

# Transfer Requests (5 endpoints)
POST   /api/v1/transfer-requests
GET    /api/v1/transfer-requests
GET    /api/v1/transfer-requests/:id
GET    /api/v1/transfer-requests/:id/history
DELETE /api/v1/transfer-requests/:id/withdraw

# Approvals (5 endpoints)
GET    /api/v1/approvals/pending
GET    /api/v1/approvals/:transferId
POST   /api/v1/approvals/:transferId/manager
POST   /api/v1/approvals/:transferId/hr
POST   /api/v1/approvals/:transferId/target-manager

# Notifications (3 endpoints)
GET    /api/v1/notifications/logs/:transferId
GET    /api/v1/notifications/integration-health
POST   /api/v1/notifications/retry/:logId

# Audit (2 endpoints)
GET    /api/v1/audit/:transferId
GET    /api/v1/audit
```

### Scheduled Jobs
| Job | Schedule | BRD |
|---|---|---|
| `effective-date-processor` | Daily 00:05 UTC | BRD-010 |
| `approval-timeout-detector` | Daily 08:00 UTC | BR-004 |

---

## Module 1 — Authentication & RBAC

**BRD:** NFR-001, BR-002, all actor access requirements

### Intent
Issue JWT tokens via HTTP-only cookies on login, validate on every protected request, and enforce role-gated access (`employee`, `manager`, `hr_admin`, `sys_admin`) across all modules.

### Data Models

**Table: `users`**

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, `gen_random_uuid()` | |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | |
| `password_hash` | VARCHAR(255) | NOT NULL | bcrypt cost 12 |
| `first_name` | VARCHAR(100) | NOT NULL | |
| `last_name` | VARCHAR(100) | NOT NULL | |
| `role` | ENUM | NOT NULL | `employee`, `manager`, `hr_admin`, `sys_admin` |
| `department_id` | UUID | FK → `departments.id` | nullable |
| `manager_id` | UUID | FK → `users.id` | nullable |
| `tenure_start_date` | DATE | NOT NULL | |
| `is_active` | BOOLEAN | NOT NULL, default `true` | |
| `created_at` | TIMESTAMPTZ | NOT NULL | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | |

**Table: `departments`**

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | |
| `name` | VARCHAR(150) | UNIQUE, NOT NULL | |
| `manager_id` | UUID | FK → `users.id` | nullable |
| `location` | VARCHAR(150) | | |
| `created_at` | TIMESTAMPTZ | NOT NULL | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | |

### API Contract

**auth.API01 — POST /api/v1/auth/login**

Request:
```json
{ "email": "string (required)", "password": "string (required, min 8)" }
```
Success `200` + sets `token` (15min) and `refreshToken` (7d) as `HttpOnly; Secure; SameSite=Strict` cookies.
```json
{ "success": true, "data": { "user": { "id": "uuid", "email": "string", "firstName": "string", "lastName": "string", "role": "string", "departmentId": "uuid|null" } } }
```

| Code | Condition | Error Code |
|---|---|---|
| 400 | Invalid fields | `VALIDATION_ERROR` |
| 401 | Wrong credentials | `INVALID_CREDENTIALS` |
| 403 | Inactive account | `ACCOUNT_INACTIVE` |
| 429 | > 5 attempts / 15 min | `RATE_LIMITED` |

---

**auth.API02 — POST /api/v1/auth/logout**

Clears both cookies (Max-Age=0). Returns `200`. Requires valid session.

---

**auth.API03 — GET /api/v1/auth/me**

Returns current user profile from JWT cookie. `401 UNAUTHENTICATED` if no/expired token.
```json
{ "success": true, "data": { "user": { "id": "uuid", "email": "string", "firstName": "string", "lastName": "string", "role": "string", "departmentId": "uuid|null", "managerId": "uuid|null" } } }
```

---

**auth.API04 — POST /api/v1/auth/refresh**

Reads `refreshToken` cookie, issues new `token` cookie. `401 INVALID_REFRESH_TOKEN` if expired/invalid.

---

### Middleware Contracts

**`requireAuth`**: Reads `token` cookie → verifies JWT (`process.env.JWT_SECRET`) → attaches `req.user = { id, email, role, departmentId, managerId }` → calls `next()`. Responds `401` on missing/expired/invalid token.

**`requireRole(...roles)`**: Used after `requireAuth`. Checks `req.user.role` against `roles` array. Responds `403 FORBIDDEN` on mismatch.

### Role → Endpoint Access Matrix

| Role | transfer-requests | approvals | notifications | audit |
|---|---|---|---|---|
| `employee` | Own requests (R/W/withdraw) | — | — | — |
| `manager` | Direct reports' requests (R) | Own manager steps | — | — |
| `hr_admin` | All (R) | HR steps only | Logs (R) | Own transfers audit |
| `sys_admin` | All (R) | All (R) | Full (logs, health, retry) | Full |

---

## Module 2 — Transfer Request Lifecycle

**BRD:** BRD-001, BRD-005, BRD-006, BRD-010, BR-001, BR-003, BR-005

### Intent
Enable employees to submit, view, and withdraw internal transfer requests. Enforce all eligibility and date constraints. Run daily job to finalise approved transfers on their effective date.

### Data Model

**Table: `transfer_requests`**

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | |
| `employee_id` | UUID | FK → `users.id`, NOT NULL | |
| `target_department_id` | UUID | FK → `departments.id`, NOT NULL | |
| `target_location` | VARCHAR(150) | nullable | |
| `preferred_effective_date` | DATE | NOT NULL | 30–90 days from `submitted_at` (BR-003) |
| `justification` | TEXT | NOT NULL | |
| `status` | ENUM | NOT NULL | See FSM above |
| `submitted_at` | TIMESTAMPTZ | NOT NULL | |
| `effective_at` | TIMESTAMPTZ | nullable | |
| `withdrawn_at` | TIMESTAMPTZ | nullable | |
| `created_at` | TIMESTAMPTZ | NOT NULL | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | |

### API Contract

**transfer-requests.API01 — POST /api/v1/transfer-requests**
Auth: `requireAuth`, `requireRole('employee')`

Request:
```json
{ "targetDepartmentId": "uuid", "targetLocation": "string|null", "preferredEffectiveDate": "YYYY-MM-DD", "justification": "string (20–1000 chars)" }
```
Success `201`:
```json
{ "success": true, "data": { "transferRequest": { "id": "uuid", "status": "pending_manager_approval", "targetDepartmentId": "uuid", "preferredEffectiveDate": "YYYY-MM-DD", "submittedAt": "ISO8601" } } }
```

| Code | Condition | Error Code |
|---|---|---|
| 400 | Validation failure | `VALIDATION_ERROR` |
| 400 | Effective date < 30 days | `INVALID_EFFECTIVE_DATE` |
| 400 | Effective date > 90 days | `INVALID_EFFECTIVE_DATE` |
| 404 | Department not found | `DEPARTMENT_NOT_FOUND` |
| 409 | Active request already exists | `ACTIVE_REQUEST_EXISTS` |
| 422 | Tenure < 12 months | `ELIGIBILITY_TENURE` |
| 422 | Active disciplinary action | `ELIGIBILITY_DISCIPLINARY` |
| 422 | Request within 6-month cooldown | `ELIGIBILITY_COOLDOWN` |

---

**transfer-requests.API02 — GET /api/v1/transfer-requests**
Auth: `requireAuth`. Returns role-scoped paginated list. `?status=&page=1&limit=20`

---

**transfer-requests.API03 — GET /api/v1/transfer-requests/:id**
Auth: `requireAuth`. Returns full detail. `403` if not owner/manager/hr/admin. `404` if not found.

---

**transfer-requests.API04 — GET /api/v1/transfer-requests/:id/history**
Auth: `requireAuth`. Returns chronological approval history with actor, decision, comments, timestamps.

---

**transfer-requests.API05 — DELETE /api/v1/transfer-requests/:id/withdraw**
Auth: `requireAuth`, `requireRole('employee')`. Employee withdraws own active request.

| Code | Condition | Error Code |
|---|---|---|
| 403 | Not the owner | `FORBIDDEN` |
| 404 | Not found | `NOT_FOUND` |
| 409 | Already terminal | `ALREADY_TERMINAL` |
| 409 | Already effective | `TRANSFER_EFFECTIVE` |

---

### Scheduled Job: `effective-date-processor`
**Schedule:** Daily 00:05 UTC (`process.env.EFFECTIVE_DATE_JOB_CRON`)

1. Query `transfer_requests` WHERE `status = 'approved_pending_effective'` AND `preferred_effective_date <= CURRENT_DATE`
2. For each: transition → `effective`, set `effective_at`, update employee `department_id` + `manager_id`, emit audit event, dispatch notification
3. Per-record failures are logged and do not halt processing. Job must complete within 30 minutes.

---

## Module 3 — Approval Workflow Engine

**BRD:** BRD-002, BRD-003, BRD-004, BR-002, BR-004

### Intent
Orchestrate the three sequential approval steps (Current Manager → HR → Target Manager), enforce strict sequencing, detect timeouts, and trigger escalation.

### Data Model

**Table: `approval_steps`**

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | |
| `transfer_request_id` | UUID | FK → `transfer_requests.id`, NOT NULL | |
| `step_type` | ENUM | NOT NULL | `manager`, `hr`, `target_manager` |
| `actor_id` | UUID | FK → `users.id`, nullable | null until decided |
| `decision` | ENUM | nullable | `approved`, `rejected`, `declined` |
| `comments` | TEXT | nullable | |
| `assigned_to_id` | UUID | FK → `users.id`, NOT NULL | Pre-assigned reviewer |
| `due_at` | TIMESTAMPTZ | NOT NULL | 7 business days from creation (BR-004) |
| `escalated_at` | TIMESTAMPTZ | nullable | |
| `decided_at` | TIMESTAMPTZ | nullable | |
| `created_at` | TIMESTAMPTZ | NOT NULL | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | |

### API Contract

**approvals.API01 — GET /api/v1/approvals/pending**
Auth: `requireAuth`, `requireRole('manager', 'hr_admin', 'sys_admin')`. Returns role-scoped pending steps.

---

**approvals.API02 — GET /api/v1/approvals/:transferId**
Auth: `requireAuth`. Returns full approval step history.

---

**approvals.API03 — POST /api/v1/approvals/:transferId/manager**
Auth: `requireAuth`, `requireRole('manager')`. Caller must be `assigned_to_id`.

Request: `{ "decision": "approved|rejected", "comments": "string (optional)" }`

Success `200`: `{ "transferRequestId", "stepType": "manager", "decision", "newTransferStatus", "decidedAt" }`

| Code | Condition | Error Code |
|---|---|---|
| 403 | Not the assigned manager | `FORBIDDEN` |
| 409 | Step already decided | `STEP_ALREADY_DECIDED` |
| 409 | Request not at manager stage | `INVALID_WORKFLOW_STATE` |

Approved → status: `pending_hr_validation`, new `hr` step created.
Rejected → status: `rejected_by_manager` (terminal).

---

**approvals.API04 — POST /api/v1/approvals/:transferId/hr**
Auth: `requireAuth`, `requireRole('hr_admin')`.

Request: `{ "decision": "approved|rejected", "comments": "string (optional)" }`

Approved → status: `pending_target_confirmation`, new `target_manager` step created (assigned to `departments.manager_id`).
Rejected → status: `rejected_by_hr` (terminal).

---

**approvals.API05 — POST /api/v1/approvals/:transferId/target-manager**
Auth: `requireAuth`, `requireRole('manager')`. Caller must be `assigned_to_id`.

Request: `{ "decision": "approved|declined", "comments": "string (optional)" }`

Approved → status: `approved_pending_effective`.
Declined → status: `declined_by_target_manager` (terminal).

All decision endpoints: atomic DB transaction per decision. `409 STEP_ALREADY_DECIDED` on re-submission. `409 INVALID_WORKFLOW_STATE` if request not at expected stage.

---

### Scheduled Job: `approval-timeout-detector`
**Schedule:** Daily 08:00 UTC (`process.env.TIMEOUT_DETECTOR_CRON`)

1. Query `approval_steps` WHERE `decision IS NULL` AND `due_at <= NOW()` AND `escalated_at IS NULL`
2. For each: set `escalated_at = NOW()`, dispatch escalation notification to all `hr_admin` users, emit audit event
3. Per-record failures do not halt processing.

---

## Module 4 — Email & Integration Notifications

**BRD:** BRD-007, BRD-008, NFR-006

### Intent
Handle all outbound communications — email notifications to stakeholders at workflow milestones and asynchronous integration payload delivery to IT, Payroll, and Facilities systems. All dispatch is non-blocking. Failures are retried up to 3 times with exponential backoff.

### Data Model

**Table: `notification_logs`**

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | |
| `transfer_request_id` | UUID | FK → `transfer_requests.id`, NOT NULL | |
| `notification_type` | ENUM | NOT NULL | `email`, `integration` |
| `channel` | VARCHAR(50) | NOT NULL | `email`, `it_system`, `payroll_system`, `facilities_system` |
| `event_type` | VARCHAR(100) | NOT NULL | |
| `recipient` | VARCHAR(255) | NOT NULL | Email or endpoint URL |
| `status` | ENUM | NOT NULL | `pending`, `sent`, `failed`, `retrying` |
| `attempts` | INTEGER | NOT NULL, default 0 | |
| `last_attempted_at` | TIMESTAMPTZ | nullable | |
| `sent_at` | TIMESTAMPTZ | nullable | |
| `error_message` | TEXT | nullable | |
| `payload` | JSONB | NOT NULL | Dispatched payload snapshot |
| `created_at` | TIMESTAMPTZ | NOT NULL | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | |

### Email Event Matrix

| Event Type | Trigger | Recipients |
|---|---|---|
| `transfer_submitted` | Employee submits | Current Manager |
| `manager_approved` | Manager approves | Employee, HR Admins |
| `manager_rejected` | Manager rejects | Employee |
| `hr_approved` | HR approves | Employee, Current Manager, Target Manager |
| `hr_rejected` | HR rejects | Employee, Current Manager |
| `target_confirmed` | Target Manager confirms | Employee, Current Manager, HR Admins |
| `target_declined` | Target Manager declines | Employee, Current Manager, HR Admins |
| `employee_withdrawn` | Employee withdraws | Current Manager, HR Admins, Target Manager (if involved) |
| `transfer_effective` | Transfer effective | Employee, Current Manager, Target Manager, HR Admins |
| `approval_escalation` | Manager timeout | All HR Admins |

### Integration Events

When status → `approved_pending_effective` and when status → `effective`, send to all 3 external systems:

**IT System payload:**
```json
{ "event": "string", "employeeId": "uuid", "newDepartmentId": "uuid", "newDepartmentName": "string", "newLocation": "string|null", "effectiveDate": "YYYY-MM-DD", "transferRequestId": "uuid" }
```
**Payroll System payload:**
```json
{ "event": "string", "employeeId": "uuid", "newDepartmentId": "uuid", "newDepartmentName": "string", "effectiveDate": "YYYY-MM-DD", "transferRequestId": "uuid" }
```
**Facilities System payload:**
```json
{ "event": "string", "employeeId": "uuid", "newLocation": "string|null", "effectiveDate": "YYYY-MM-DD", "transferRequestId": "uuid" }
```

Endpoints via env: `INTEGRATION_IT_ENDPOINT`, `INTEGRATION_PAYROLL_ENDPOINT`, `INTEGRATION_FACILITIES_ENDPOINT`, `INTEGRATION_TIMEOUT_MS` (default 5000).

### Internal Service Contract

```js
// Called by transfer-requests and approvals modules — non-blocking
notificationService.dispatch(eventType, {
  transferRequestId, employeeId, currentManagerId, targetManagerId,
  hrAdminIds, targetDepartmentName, preferredEffectiveDate, decision?, comments?
})
```
Creates `notification_logs` records (status=`pending`), dispatches asynchronously. Retry: 3 attempts, 1min / 5min / 15min backoff. After 3 failures: status=`failed`.

### API Contract

**notifications.API01 — GET /api/v1/notifications/logs/:transferId**
Auth: `requireAuth`, `requireRole('hr_admin', 'sys_admin')`. Returns paginated log for a transfer. `?channel=&status=&page=1&limit=20`

---

**notifications.API02 — GET /api/v1/notifications/integration-health**
Auth: `requireAuth`, `requireRole('sys_admin')`. Returns health per channel.

```json
{ "success": true, "data": { "integrationHealth": { "it_system": { "status": "healthy|degraded|down", "lastSuccessAt": "ISO8601|null", "failedLast24h": 0 }, "payroll_system": { ... }, "facilities_system": { ... } } } }
```
Health: `healthy` = 0 failures/24h; `degraded` = 1–3; `down` = > 3 or last attempt failed.

---

**notifications.API03 — POST /api/v1/notifications/retry/:logId**
Auth: `requireAuth`, `requireRole('sys_admin')`. Queues a failed log for retry. `409 ALREADY_SENT` if already delivered.

---

## Module 5 — Audit Trail & Compliance

**BRD:** BRD-009, NFR-001

### Intent
Provide an immutable, append-only audit event log for all workflow actions. Accessible to HR Admins and System Admins. Minimum 7-year retention. No event may ever be updated or deleted.

### Data Model

**Table: `audit_events`**

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | |
| `transfer_request_id` | UUID | FK → `transfer_requests.id`, NOT NULL | |
| `event_type` | VARCHAR(100) | NOT NULL | |
| `actor_id` | UUID | FK → `users.id`, nullable | null for system events |
| `actor_role` | VARCHAR(50) | nullable | |
| `actor_email` | VARCHAR(255) | nullable | Masked in API responses |
| `action` | TEXT | NOT NULL | Human-readable description |
| `payload` | JSONB | NOT NULL | Full event context snapshot |
| `ip_address` | INET | nullable | null for system/job events |
| `created_at` | TIMESTAMPTZ | NOT NULL | Immutable — set once |

No `UPDATE` or `DELETE` operations permitted — enforced at repository layer.

### Audit Event Types

| Event Type | Triggered By |
|---|---|
| `transfer_submitted` | Employee |
| `manager_approved` / `manager_rejected` | Manager |
| `hr_approved` / `hr_rejected` | HR Admin |
| `target_confirmed` / `target_declined` | Target Manager |
| `employee_withdrawn` | Employee |
| `transfer_effective` | System (job) |
| `approval_escalated` | System (job) |
| `notification_sent` / `notification_failed` | System |
| `integration_sent` / `integration_failed` | System |

### Internal Service Contract

```js
// All modules call this — fire-and-forget, never throws to caller
await auditService.append(eventType, {
  transferRequestId, actorId?, actorRole?, actorEmail?, action, payload, ipAddress?
})
```
Failures logged via Winston. Never propagated to caller.

### API Contract

**audit.API01 — GET /api/v1/audit/:transferId**
Auth: `requireAuth`, `requireRole('hr_admin', 'sys_admin')`. Returns chronological events for a transfer. `?eventType=&from=YYYY-MM-DD&to=YYYY-MM-DD&page=1&limit=50`

Response: `actorEmail` masked as `str***@domain.com`.

---

**audit.API02 — GET /api/v1/audit**
Auth: `requireAuth`, `requireRole('sys_admin')`. Full audit log with filters. `?transferRequestId=&actorId=&eventType=&from=&to=&page=1&limit=50`

---

## Consolidated Acceptance Criteria

### Module 1 — Auth
1. `auth`.AC1 — Given valid email + password, when POST /auth/login, then `200`, user profile returned, 2 HTTP-only cookies set (token 15min, refreshToken 7d).
2. `auth`.AC2 — Given wrong password, when POST /auth/login, then `401 INVALID_CREDENTIALS`, no cookies set.
3. `auth`.AC3 — Given inactive account, when POST /auth/login, then `403 ACCOUNT_INACTIVE`.
4. `auth`.AC4 — Given 5 failed attempts in 15min, when 6th attempt, then `429 RATE_LIMITED`.
5. `auth`.AC5 — Given valid token cookie, when GET /auth/me, then `200` with user profile.
6. `auth`.AC6 — Given no/expired token, when any protected endpoint, then `401 UNAUTHENTICATED`.
7. `auth`.AC7 — Given valid refreshToken cookie, when POST /auth/refresh, then new token cookie issued.
8. `auth`.AC8 — Given expired refreshToken, when POST /auth/refresh, then `401 INVALID_REFRESH_TOKEN`.
9. `auth`.AC9 — Given valid session, when POST /auth/logout, then both cookies cleared, `200` returned.
10. `auth`.AC10 — Given `employee` role calling `requireRole('hr_admin')` route, then `403 FORBIDDEN`.
11. `auth`.AC11 — Given `hr_admin` role calling `requireRole('hr_admin', 'sys_admin')` route, then request proceeds.
12. `auth`.AC12 — Passwords stored as bcrypt hash (cost 12) — plaintext never stored or logged.
13. `auth`.AC13 — JWT payload contains `{ id, email, role, departmentId, managerId, iat, exp }` only.
14. `auth`.AC14 — All 4 roles creatable via seed only — no role creation via public API.

### Module 2 — Transfer Requests
15. `tr`.AC1 — Given eligible employee, when valid POST /transfer-requests, then `201`, request created with status `pending_manager_approval`.
16. `tr`.AC2 — Given tenure < 12 months, when POST /transfer-requests, then `422 ELIGIBILITY_TENURE`.
17. `tr`.AC3 — Given active disciplinary action, when POST /transfer-requests, then `422 ELIGIBILITY_DISCIPLINARY`.
18. `tr`.AC4 — Given request within 6-month cooldown, when POST /transfer-requests, then `422 ELIGIBILITY_COOLDOWN`.
19. `tr`.AC5 — Given existing active request, when POST /transfer-requests, then `409 ACTIVE_REQUEST_EXISTS`.
20. `tr`.AC6 — Given effective date < 30 days, when POST /transfer-requests, then `400 INVALID_EFFECTIVE_DATE`.
21. `tr`.AC7 — Given effective date > 90 days, when POST /transfer-requests, then `400 INVALID_EFFECTIVE_DATE`.
22. `tr`.AC8 — Given employee, when GET /transfer-requests, then only own requests returned.
23. `tr`.AC9 — Given hr_admin, when GET /transfer-requests, then all requests returned.
24. `tr`.AC10 — Given own active request, when DELETE /transfer-requests/:id/withdraw, then status → `withdrawn_by_employee`.
25. `tr`.AC11 — Given terminal status, when withdraw called, then `409 ALREADY_TERMINAL`.
26. `tr`.AC12 — Given effective status, when withdraw called, then `409 TRANSFER_EFFECTIVE`.
27. `tr`.AC13 — Given effective date job runs, when matching approved request, then status → `effective`, department updated.
28. `tr`.AC14 — Given effective date job, when one record fails, then processing continues, failure logged.
29. `tr`.AC15 — Given full approval chain, when GET /transfer-requests/:id/history, then all steps returned chronologically.

### Module 3 — Approvals
30. `appr`.AC1 — Given `pending_manager_approval`, when assigned manager approves, then status → `pending_hr_validation`, hr step created.
31. `appr`.AC2 — Given `pending_manager_approval`, when assigned manager rejects, then status → `rejected_by_manager` (terminal).
32. `appr`.AC3 — Given non-assigned manager, when POST /approvals/:id/manager, then `403 FORBIDDEN`.
33. `appr`.AC4 — Given already-decided step, when decision re-submitted, then `409 STEP_ALREADY_DECIDED`.
34. `appr`.AC5 — Given `pending_hr_validation`, when HR approves, then status → `pending_target_confirmation`, target_manager step created.
35. `appr`.AC6 — Given `pending_hr_validation`, when HR rejects, then status → `rejected_by_hr` (terminal).
36. `appr`.AC7 — Given `pending_target_confirmation`, when target manager approves, then status → `approved_pending_effective`.
37. `appr`.AC8 — Given `pending_target_confirmation`, when target manager declines, then status → `declined_by_target_manager` (terminal).
38. `appr`.AC9 — Given overdue step with no decision, when timeout detector runs, then `escalated_at` set, escalation notification dispatched.
39. `appr`.AC10 — Given employee calls POST /approvals/:id/manager, then `403 FORBIDDEN`.
40. `appr`.AC11 — Given manager, when GET /approvals/pending, then only own pending steps returned.
41. `appr`.AC12 — Given request not yet at HR stage, when POST /approvals/:id/hr, then `409 INVALID_WORKFLOW_STATE`.

### Module 4 — Notifications
42. `notif`.AC1 — Given transfer submitted, when dispatch called, then email log created for current manager, dispatched async.
43. `notif`.AC2 — Given manager approves, when dispatch called, then email logs created for employee + HR admins.
44. `notif`.AC3 — Given transfer reaches `approved_pending_effective`, when dispatch called, then 3 integration logs created (IT, Payroll, Facilities).
45. `notif`.AC4 — Given delivery fails 3 times, then status = `failed`, `error_message` recorded.
46. `notif`.AC5 — Given first attempt fails, then status = `retrying`, attempts = 1.
47. `notif`.AC6 — Given > 3 integration failures in 24h, when GET /notifications/integration-health, then channel status = `down`.
48. `notif`.AC7 — Given failed log, when sys_admin calls POST /notifications/retry/:logId, then `200`, status = `retrying`.
49. `notif`.AC8 — Given already-sent log, when retry called, then `409 ALREADY_SENT`.
50. `notif`.AC9 — Given dispatch() called by any module, then caller is not blocked (non-blocking dispatch).
51. `notif`.AC10 — Given withdrawal with target manager involved, then email logs created for 3 recipients.
52. `notif`.AC11 — Given escalation dispatched, then email log per hr_admin.
53. `notif`.AC12 — All emails include: Transfer Request ID, employee name, target department, status, portal link.

### Module 5 — Audit
54. `audit`.AC1 — Given any workflow event, when auditService.append() called, then record inserted with correct fields.
55. `audit`.AC2 — Given audit event inserted, when UPDATE/DELETE attempted at repository layer, then error thrown, operation blocked.
56. `audit`.AC3 — Given hr_admin, when GET /audit/:transferId, then all events returned in ascending `created_at` order.
57. `audit`.AC4 — Given sys_admin, when GET /audit with date filter, then only events in range returned.
58. `audit`.AC5 — Given employee, when GET /audit/:transferId, then `403 FORBIDDEN`.
59. `audit`.AC6 — Given system event (transfer_effective), when inserted, then `actor_id` = null, `actor_role` = null.
60. `audit`.AC7 — Given auditService.append() throws internally, then caller workflow continues, error logged — not propagated.
61. `audit`.AC8 — Given actorEmail stored, when returned via API, then masked (`str***@domain.com`).
62. `audit`.AC9 — Given GET /audit/:transferId?eventType=manager_approved, then only that event type returned.
63. `audit`.AC10 — Given hr_admin (not sys_admin), when GET /audit (full log), then `403 FORBIDDEN`.

---

## Consolidated Unit Test Cases

| Test ID | Module | Maps to AC | Scenario | Expected |
|---|---|---|---|---|
| `auth`.UT01 | Auth | AC1 | Login valid email + password | 200, profile, 2 cookies |
| `auth`.UT02 | Auth | AC2 | Login wrong password | 401 INVALID_CREDENTIALS |
| `auth`.UT03 | Auth | AC2 | Login non-existent email | 401 INVALID_CREDENTIALS |
| `auth`.UT04 | Auth | AC3 | Login inactive account | 403 ACCOUNT_INACTIVE |
| `auth`.UT05 | Auth | AC4 | 6th attempt within 15 min | 429 RATE_LIMITED |
| `auth`.UT06 | Auth | AC5 | GET /auth/me valid cookie | 200, profile |
| `auth`.UT07 | Auth | AC6 | GET /auth/me no cookie | 401 UNAUTHENTICATED |
| `auth`.UT08 | Auth | AC6 | GET /auth/me expired token | 401 TOKEN_EXPIRED |
| `auth`.UT09 | Auth | AC7 | Refresh with valid refresh token | 200, new cookie |
| `auth`.UT10 | Auth | AC8 | Refresh with expired refresh token | 401 INVALID_REFRESH_TOKEN |
| `auth`.UT11 | Auth | AC9 | Logout valid session | 200, cookies cleared |
| `auth`.UT12 | Auth | AC10 | requireRole('hr_admin') with employee | 403 FORBIDDEN |
| `auth`.UT13 | Auth | AC11 | requireRole('hr_admin','sys_admin') with hr_admin | proceeds |
| `auth`.UT14 | Auth | AC12 | User created — password bcrypt hashed | hash correct, plaintext absent |
| `auth`.UT15 | Auth | AC13 | Decode JWT — verify payload schema | correct fields, no sensitive data |
| `tr`.UT01 | Transfers | AC1 | Submit valid request | 201, pending_manager_approval |
| `tr`.UT02 | Transfers | AC2 | Submit — tenure < 12 months | 422 ELIGIBILITY_TENURE |
| `tr`.UT03 | Transfers | AC3 | Submit — disciplinary action | 422 ELIGIBILITY_DISCIPLINARY |
| `tr`.UT04 | Transfers | AC4 | Submit — 6-month cooldown | 422 ELIGIBILITY_COOLDOWN |
| `tr`.UT05 | Transfers | AC5 | Submit — active request exists | 409 ACTIVE_REQUEST_EXISTS |
| `tr`.UT06 | Transfers | AC6 | Submit — effective date < 30d | 400 INVALID_EFFECTIVE_DATE |
| `tr`.UT07 | Transfers | AC7 | Submit — effective date > 90d | 400 INVALID_EFFECTIVE_DATE |
| `tr`.UT08 | Transfers | AC8 | GET list as employee | own requests only |
| `tr`.UT09 | Transfers | AC9 | GET list as hr_admin | all requests |
| `tr`.UT10 | Transfers | AC10 | Withdraw own active request | 200, withdrawn_by_employee |
| `tr`.UT11 | Transfers | AC11 | Withdraw terminal request | 409 ALREADY_TERMINAL |
| `tr`.UT12 | Transfers | AC12 | Withdraw effective request | 409 TRANSFER_EFFECTIVE |
| `tr`.UT13 | Transfers | AC13 | Effective date job — matching | status → effective, dept updated |
| `tr`.UT14 | Transfers | AC14 | Effective date job — one fails | continues, failure logged |
| `tr`.UT15 | Transfers | AC15 | GET history — full chain | chronological, all steps |
| `appr`.UT01 | Approvals | AC1 | Manager approves | pending_hr_validation, hr step created |
| `appr`.UT02 | Approvals | AC2 | Manager rejects | rejected_by_manager |
| `appr`.UT03 | Approvals | AC3 | Non-assigned manager decides | 403 FORBIDDEN |
| `appr`.UT04 | Approvals | AC4 | Re-submit decided step | 409 STEP_ALREADY_DECIDED |
| `appr`.UT05 | Approvals | AC5 | HR approves | pending_target_confirmation |
| `appr`.UT06 | Approvals | AC6 | HR rejects | rejected_by_hr |
| `appr`.UT07 | Approvals | AC7 | Target manager approves | approved_pending_effective |
| `appr`.UT08 | Approvals | AC8 | Target manager declines | declined_by_target_manager |
| `appr`.UT09 | Approvals | AC9 | Timeout detector — overdue step | escalated_at set, notif dispatched |
| `appr`.UT10 | Approvals | AC10 | Employee attempts approval | 403 FORBIDDEN |
| `appr`.UT11 | Approvals | AC11 | GET pending as manager | own pending steps only |
| `appr`.UT12 | Approvals | AC12 | HR decision before HR stage | 409 INVALID_WORKFLOW_STATE |
| `notif`.UT01 | Notifications | AC1 | dispatch transfer_submitted | email log for manager |
| `notif`.UT02 | Notifications | AC2 | dispatch manager_approved | email logs employee + hr_admins |
| `notif`.UT03 | Notifications | AC3 | dispatch integration on approval | 3 integration logs created |
| `notif`.UT04 | Notifications | AC4 | 3 delivery failures | status = failed, error_message set |
| `notif`.UT05 | Notifications | AC5 | 1st attempt fails | status = retrying, attempts = 1 |
| `notif`.UT06 | Notifications | AC6 | > 3 failures in 24h | channel health = down |
| `notif`.UT07 | Notifications | AC7 | sys_admin retries failed log | 200, status = retrying |
| `notif`.UT08 | Notifications | AC8 | Retry already-sent log | 409 ALREADY_SENT |
| `notif`.UT09 | Notifications | AC9 | dispatch() call — non-blocking | returns immediately |
| `notif`.UT10 | Notifications | AC10 | Withdrawal with target manager | 3 email logs |
| `notif`.UT11 | Notifications | AC11 | Escalation dispatch | log per hr_admin |
| `notif`.UT12 | Notifications | AC12 | Email payload structure | all required fields present |
| `audit`.UT01 | Audit | AC1 | auditService.append() valid | record inserted correctly |
| `audit`.UT02 | Audit | AC2 | Update audit_events | throws, blocked |
| `audit`.UT03 | Audit | AC2 | Delete audit_events | throws, blocked |
| `audit`.UT04 | Audit | AC3 | GET /audit/:id as hr_admin | 200, asc order |
| `audit`.UT05 | Audit | AC4 | GET /audit with date filter | in-range only |
| `audit`.UT06 | Audit | AC5 | GET /audit/:id as employee | 403 FORBIDDEN |
| `audit`.UT07 | Audit | AC6 | System event appended | actor_id null, actor_role null |
| `audit`.UT08 | Audit | AC7 | auditService throws | caller continues, Winston logs |
| `audit`.UT09 | Audit | AC8 | actorEmail in API response | masked format |
| `audit`.UT10 | Audit | AC9 | GET /audit/:id?eventType filter | filtered results only |
| `audit`.UT11 | Audit | AC10 | GET /audit as hr_admin | 403 FORBIDDEN |

---

## Open Questions

The following are unresolved at spec authoring time. They must be resolved before Gate 1 or flagged as provisional stubs.

| # | Question | Impact | Current Stub |
|---|---|---|---|
| OQ-1 | SSO protocol (SAML / OAuth2 / OIDC)? | `auth` login flow | Local credential login |
| OQ-2 | Integration endpoint specs (REST/SOAP/queue) for IT, Payroll, Facilities? | `notifications` integration service | HTTP POST to env-configured URLs |
| OQ-3 | Employee eligibility data source (tenure, disciplinary)? | `transfer-requests` eligibility service | `users.tenure_start_date`, `users.is_active` |
| OQ-4 | Escalation authority when manager times out? | `approvals` escalation | All `hr_admin` users |
| OQ-5 | Manager hierarchy source (SSO claims / HR directory / portal)? | `auth` + `approvals` | `users.manager_id` FK |
| OQ-6 | Target manager identification method? | `approvals` target step | `departments.manager_id` FK |
| OQ-7 | Cost center mapping for payroll notification? | `notifications` payload | Omitted from payload |
| OQ-8 | Notification retry interval? | `notifications` retry service | 1min / 5min / 15min |
| OQ-9 | 7-year audit retention — regulatory or configurable? | `audit` retention | Configurable via `AUDIT_RETENTION_YEARS` |
| OQ-10 | Portal session timeout policy? | `auth` cookie TTL | 15min access / 7d refresh |

---

## Explicitly Out of Scope (System-wide)

- SSO/SAML/OIDC integration (OQ-1 — stubbed)
- Password reset / MFA / account self-registration
- Mobile native application
- Bulk transfer operations
- Manager delegation / proxy approvals
- Payroll, IT, Facilities system implementations (integration touchpoints only)
- Real-time notifications (WebSocket / SSE)
- Audit data purge/archival job
- Performance appraisal, promotion, or external recruitment workflows

---

## Non-Functional Constraints (System-wide)

- All write endpoints: p95 < **2 seconds** — NFR-002
- Status tracking reads: p95 < **3 seconds** — NFR-002
- Effective date job: < **30 minutes** — NFR-002
- Email dispatch: within **5 minutes** of trigger — NFR-002
- Availability: **99.5%** during business hours — NFR-003
- Bcrypt cost factor **12** — constitution.md
- JWT secrets from env only — never hardcoded
- PII masked in all logs (`maskContact`) — constitution.md
- HTTP-only, Secure, SameSite=Strict cookies — NFR-001
- All workflow transitions atomic (single DB transaction) — constitution.md
- Audit failures never propagate to callers — constitution.md
- Sequelize parameterised queries only — no raw SQL — AGENTS.md

---

*This spec covers the complete Employee Internal Transfer system (BRD v1.0 — Pending Gate 0 Review). Gate 1 submission is ON HOLD until Gate 0 is formally reviewed and approved by Supratim Jetty (supratim.jetty@intglobal.com).*
