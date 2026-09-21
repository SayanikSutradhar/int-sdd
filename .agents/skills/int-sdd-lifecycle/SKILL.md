---
name: int-sdd-lifecycle
description: Manage the end-to-end INT SDD feature development lifecycle, including feature specs, status board updates, Gate 1 peer reviews, implementation plans, task breakdown, test-first TDD, Gate 2 code reviews, and Definitions of Ready & Done.
---

# INT SDD Feature Engineering Lifecycle

## Mandatory Lifecycle Flow

```text
1. BRD Ingestion / Authoring (.ai-context/BRD.md)
       ↓
2. Gate 0: BRD PR Review & Approval
       ↓
3. Spec Authoring (.ai-context/specs/<feature-slug>.spec.md) [Parallel & Non-Blocking]
       ↓
4. Gate 1: Spec PR Review & Approval
       ↓
5. Developer Work Selection
       ↓
6. Pre-Development PR Review Check & Developer Notification
       ↓
7. Plan (.ai-context/plans/<slug>.plan.md), Tasks (.tasks.md), Test Cases (.test_cases.md) Breakdown
       ↓
8. Full Development Phase: Test-First (RED) ──► Implementation (GREEN) ──► Full Test Suite Verification (PASS)
       ↓
9. Gate 2: Code PR Review & Approval
       ↓
10. EXISTING DOWNSTREAM WORKFLOW (Release Management / CR Management / Hot Fix Management)
```

---

## Mandatory Lifecycle Rules

- **No implementation without an approved Spec**.
- **Gate 1 Approval Required for Development**: Development MUST NOT start for a spec that has not received Gate 1 approval.
- **Strict Rejection Blocking Rule**: If a spec was `Rejected` or marked `Changes Requested` at Gate 1, the user is **STRICTLY BLOCKED** from creating plans, tasks, test cases, or implementation code.
- **TDD RED before GREEN**: Write failing executable tests (`tests/`) first and confirm RED before writing implementation code (GREEN).
- **Gate 2 HALT**: After development is complete and tests pass GREEN, halt and perform Gate 2 code review.
- **Mandatory Gate 1 HALT**: When requesting Gate 1 Spec Approval, the agent MUST present the Spec and **IMMEDIATELY END ITS TURN WITHOUT CALLING ANY FURTHER TOOLS**.

---

## Standardized Spec Statuses

| Status | Definition |
|---|---|
| `Draft` | Spec is being authored; not yet ready for peer review. |
| `In Peer Review` | Spec submitted for Gate 1 peer review. |
| `Changes Requested` | Gate 1 or Gate 2 review requested updates before approval. |
| `Approved` | Spec passed Gate 1 review with reviewer identity & comments captured. |
| `Plan Drafted` | Implementation plan (`.plan.md`) created from approved spec. |
| `Tasks Generated` | Executable tasks (`.tasks.md`) derived and ready for TDD. |
| `Under Development` | Feature actively being implemented (TDD Red → Green cycle). |
| `In QA` | Implementation complete, tests GREEN, undergoing Gate 2 review. |
| `Ready for Release` | Passed Gate 2 review with code merged, pending release deployment. |
| `Released (vX.Y.Z)` | Deployed to production and released under tag `vX.Y.Z`. |

---

## Feature Specifications (`.spec.md`)

Create under: `.ai-context/specs/<feature-slug>.spec.md`

A Spec MUST be authored from an approved BRD requirement (`.ai-context/BRD.md`). A requirement MUST NOT first appear in the Spec.

**Full Stack Projects**: Every feature spec MUST define both **Frontend** and **Backend** Acceptance Criteria, API Contracts, Unit Test Scenarios, and Code Deliverables.

---

## Implementation Plans (`.plan.md`)

Create under: `.ai-context/plans/<feature-slug>.plan.md`

A Plan MUST be derived from an approved Spec and MUST NOT redefine business intent.

---

## Tasks Breakdown (`.tasks.md`)

Create under: `.ai-context/tasks/<feature-slug>.tasks.md`

Tasks MUST be derived from the approved Plan. Implement one task at a time.

---

## Test-First Rule

```text
Test Case Spec → Write Executable Test → Run Test → RED → Implementation → Run Test → GREEN
```

1. Write the failing test first and confirm it fails (RED) for the expected missing capability.
2. Implement code until the test passes (GREEN).
3. Do NOT retrofit tests after coding.

---

## CRITICAL RULES

### Flat File Structure (NO SUBDIRECTORIES)
All artifact files inside `.ai-context/` MUST be created directly as **flat files** at the root of their respective category folder:
- **CORRECT**: `.ai-context/specs/dynamic-request-management.spec.md`
- **PROHIBITED**: `.ai-context/specs/dynamic-request-management/spec.md`

### Portable Repository-Relative Paths (NO ABSOLUTE PATHS)
All path references inside repository artifacts MUST be **relative to the repository root**:
- **CORRECT**: `.ai-context/specs/dynamic-request-management.spec.md`
- **PROHIBITED**: `C:\Users\Username\...`

---

## Gate 1 — Spec Peer Review

Gate 1 is a formal Spec & BRD Peer Review conducted before technical planning, design, or coding begins.

Every Gate 1 review MUST evaluate BOTH the Feature Spec and the linked BRD Requirement.

## Gate 2 — Code Review

Gate 2 occurs after tests are GREEN and before merging into main.

### Definition of Done
A feature is Done for merge only when:
- All Acceptance Criteria individually verified.
- TDD cycle verified (RED then GREEN).
- Gate 2 checklist complete.
- Security checks passed.
- `status.md` updated.
- Human code review complete.

---

## Change Request Rule

Trigger formal Change Request workflow ONLY when the user's prompt explicitly contains the keyword **"Change Request"** (or `"CR"`).

All other prompts are treated as Development-Related Fixes under the active approved spec.

---

## Repository Branching & Traceability

- Feature Branch: `feature/<feature-slug>`
- Bug-Fix Branch: `fix/<issue-slug>`
- Hotfix Branch: `hotfix/<incident-slug>`
- Commit Messages: `Implements <slug>.T01` (Do NOT include AI attribution).

## Traceability ID Conventions
- Acceptance Criteria: `<slug>.AC1`, `<slug>.AC2`
- API Contracts: `<slug>.API01`, `<slug>.API02`
- Unit Test Cases: `<slug>.UT01`, `<slug>.UT02`
- Tasks: `<slug>.T01`, `<slug>.T02`
