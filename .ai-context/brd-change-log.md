# BRD Change Log — Employee Internal Transfer

This file records all requirement changes to the Business Requirements Document and their impact on architecture and implementation planning.

---

### Version 1.0

**Status:** Pending Gate 0

**Change Date:** 2026-09-21

**Summary:**
Initial Employee Internal Transfer BRD baseline ingested from `docs/Requirement_for_SDD.docx`. Comprehensive functional and non-functional requirements defined for employee internal transfer digital journey. BRD submitted for Gate 0 review.

**Changes:**
- BRD ingested from client document (SDD Developer Assessment — Employee Internal Transfer Digital Journey)
- 10 functional requirements defined (BRD-001 through BRD-010)
- 6 non-functional requirements defined (NFR-001 through NFR-006)
- 5 business rules defined (BR-001 through BR-005)
- 4 primary actors identified (Employee, Manager Current/Target, HR Administrator)
- 10 open questions documented for resolution before Gate 1

**Added Requirements:**
- BRD-001: Employee Transfer Request Submission
- BRD-002: Manager Approval Workflow (Current Manager)
- BRD-003: HR Eligibility Validation
- BRD-004: Target Manager Confirmation
- BRD-005: Transfer Status Tracking
- BRD-006: Request Withdrawal
- BRD-007: Integration Notifications (IT, Payroll, Facilities)
- BRD-008: Email Notifications
- BRD-009: Audit Trail and History
- BRD-010: Effective Date Enforcement
- NFR-001: Security (SSO, RBAC, encryption, HTTPS, audit tamper-proof)
- NFR-002: Performance (2s submission, 2s approval, 3s status load, 5min email, 30min job)
- NFR-003: Availability (99.5% uptime business hours)
- NFR-004: Usability (modern browsers, responsive, inline validation)
- NFR-005: Scalability (10K users, 500 concurrent requests, 50 submissions/hour)
- NFR-006: Integration Resilience (retry logic, health monitoring)
- BR-001: Eligibility Criteria (12 months tenure, no disciplinary action, no recent transfer)
- BR-002: Approval Sequence (Current Manager → HR → Target Manager)
- BR-003: Effective Date Constraints (30-90 days window)
- BR-004: Manager Notification Timeout (7 business days escalation)
- BR-005: Single Active Request (1 non-terminal request per employee)

**Modified Requirements:**
- None (initial baseline)

**Removed Requirements:**
- None

**Unchanged Requirements:**
- None

**Affected Business Domains:**
- Employee Self-Service
- HR Operations
- Workflow Management
- Integration Services
- Notification Services

**Affected Modules:**
- Pending architecture analysis — to be defined post-Gate 0 approval

**API Impact:**
- REST API required for transfer request submission, approval workflows, status tracking
- Integration API endpoints required for IT/Payroll/Facilities notifications
- Email service API integration required

**Database Impact:**
- Transfer Request entity (request details, status, workflow state)
- Approval History entity (manager/HR/target approvals, timestamps, comments)
- Audit Trail entity (immutable event log)
- Employee organizational data (department, location, manager) updates

**Frontend Impact:**
- Transfer request submission form
- Manager approval dashboard
- HR Administrator validation dashboard
- Target Manager confirmation interface
- Employee status tracking view ("My Transfer Requests")
- Withdrawal confirmation UI

**Backend Impact:**
- Transfer request service (CRUD, workflow orchestration)
- Approval workflow engine (state transitions, validation)
- Integration notification service (IT/Payroll/Facilities)
- Email notification service (workflow events)
- Scheduled job for effective date enforcement
- Audit trail service (immutable event logging)
- SSO authentication integration
- RBAC authorization middleware

**Test Impact:**
- Functional tests for all 10 BRD requirements
- NFR tests (performance, security, scalability, integration resilience)
- Business rule validation tests
- Workflow state machine tests
- Integration notification tests (success, failure, retry)
- Email notification tests
- Effective date scheduled job tests

**Existing Implementation Impact:**
- None (greenfield project)

**Architecture Impact:**
- Multi-actor workflow system (Employee → Manager → HR → Target Manager)
- Asynchronous integration pattern (fire-and-forget notifications to external systems)
- Scheduled job infrastructure for effective date processing
- SSO integration requirement
- Email service integration requirement
- Audit trail persistence (7-year retention)
- RBAC enforcement across 4 roles (Employee, Manager, HR Administrator, System Administrator)

**Gate 0 Status:**
⏳ Pending Review

**Approval Date:**
—

**Approved By:**
Pending Review (Assigned: Supratim Jetty — supratim.jetty@intglobal.com)

**Approval Notes:**
Gate 0 review reverted to Pending per Reviewer Roster governance. Awaiting formal Gate 0 BRD review by Supratim Jetty (Project Manager / Gate 0 Reviewer). Spec generation and Gate 1 submission held until Gate 0 is approved.
