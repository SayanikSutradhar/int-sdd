# Business Requirements Document — Employee Internal Transfer

## BRD Status
**Pending Review** (Gate 0)

## Gate 0 Review
- **Assigned Reviewer:** Supratim Jetty (supratim.jetty@intglobal.com) — Project Manager / BRD Reviewer
- **Review Status:** ⏳ Pending Review
- **Review Record:** `.ai-context/pr_reviews/BRD-20260921-124139.md`

## Version
1.0 (Initial Baseline — Ingested from `docs/Requirement_for_SDD.docx`)

## Last Updated
2026-09-21

---

## 1. Objective

This Business Requirements Document defines the digital journey for Employee Internal Transfer within the organization's One-Point Employee Portal.

The project evaluates application of INT's Specification-Driven Development/Delivery (SDD) methodology to an enterprise employee digital journey. The system must enable employees to request internal transfers through a unified digital interface, eliminating manual interactions across multiple teams and systems.

**Focus**: The solution must demonstrate understanding of business journeys, identification of ambiguity and missing decisions, conversion of business requirements into precise specifications, definition of testable acceptance criteria, API contracts, technical approach design, decomposition into independently verifiable tasks, test-first development, integration security and failure handling, and full traceability from requirement to implementation.

**Expected SDD Chain**: Business Requirement → Spec → Gate 1 → Plan → Tasks → Test First → Implementation → Gate 2 → Release

---

## 2. Business Context

The organization operates a One-Point Employee Portal that provides employees with access to HR, payroll, IT, learning, facilities, and other employee services.

### Current State

Currently, employees requesting internal transfers must interact with multiple teams and systems:

- Employee discusses transfer with manager
- Manager confirms the transfer
- HR validates eligibility
- Employee's organizational information is updated
- Payroll updates may be required
- IT access provisioning or removal may be required
- Facilities access (badge, parking, desk booking) may need adjustment
- Employee manually tracks progress across disconnected touchpoints

This results in a fragmented experience with no single status view, delays, and lack of transparency.

### Desired State

The organization aims to consolidate the internal transfer journey into a single digital workflow through the Employee Portal, providing:

- A single application interface for employees
- Manager approval workflow
- HR validation and organizational updates
- Automated notifications to IT, payroll, and facilities teams
- Transparent status tracking
- Single source of truth for transfer status

---

## 3. Scope

### In Scope
- Employee-initiated internal transfer requests via Employee Portal
- Manager approval workflow
- HR eligibility validation workflow
- Integration touchpoints for IT, Payroll, and Facilities (notification-based)
- Status tracking and audit trail
- Email notifications for key workflow events

### Out of Scope
- External hiring or recruitment workflows
- Payroll system implementation (integration touchpoint only)
- IT access provisioning system implementation (integration touchpoint only)
- Facilities management system implementation (integration touchpoint only)
- Mobile application (portal is web-based)
- Performance appraisal or promotion workflows

---

## 4. Actors

| Actor | Description | Responsibilities |
|---|---|---|
| **Employee** | Organization employee requesting internal transfer | Initiates transfer request; provides justification and target department; tracks status; withdraws request if needed |
| **Manager (Current)** | Employee's current reporting manager | Reviews transfer request; approves or rejects request; provides comments |
| **Manager (Target)** | Manager of the target department | Receives notification; confirms acceptance or rejection of transfer |
| **HR Administrator** | Human Resources team member | Validates employee eligibility; approves or rejects transfer based on organizational policies; updates organizational data |
| **System Administrator** | IT team member with system admin privileges | Configures system parameters; manages user access; monitors integration health |
| **Integration Systems** | External systems (IT, Payroll, Facilities) | Receive automated notifications when transfers are approved |

---

## 5. Functional Requirements

### BRD-001: Employee Transfer Request Submission
**As an** Employee  
**I want to** submit an internal transfer request via the Employee Portal  
**So that** I can formally request a transfer to another department/location within the organization

**Details**:
- Employee must be authenticated to access the transfer request form
- Request must capture: target department, target location (if applicable), preferred effective date, justification/reason
- System must validate that target department exists
- System must validate preferred effective date is in the future
- System must assign unique Transfer Request ID upon submission
- System must record submission timestamp and requester identity
- System must notify the employee's current manager upon submission
- System must send email confirmation to employee upon successful submission

---

### BRD-002: Manager Approval Workflow (Current Manager)
**As a** Manager (Current)  
**I want to** review and approve/reject internal transfer requests for my direct reports  
**So that** I can ensure business continuity and make informed decisions about team composition

**Details**:
- Manager must receive email notification when a direct report submits a transfer request
- Manager must be able to view full transfer request details (target department, justification, preferred date)
- Manager must be able to approve or reject the request
- Manager must be able to provide comments when approving or rejecting
- System must record manager decision timestamp
- System must notify HR Administrator upon manager approval
- System must notify employee upon manager decision (approval or rejection)
- If manager rejects: transfer request status becomes "Rejected by Manager" (terminal state)
- If manager approves: transfer request proceeds to HR validation

---

### BRD-003: HR Eligibility Validation
**As an** HR Administrator  
**I want to** validate employee eligibility for internal transfer  
**So that** organizational policies are enforced before finalizing the transfer

**Details**:
- HR Administrator must receive notification when manager approves a transfer request
- HR Administrator must be able to view transfer request details and manager approval
- System must display employee tenure, current role, performance status (if available), and any policy-based eligibility constraints
- HR Administrator must be able to approve or reject the request
- HR Administrator must be able to provide comments/reasons for decision
- System must record HR decision timestamp
- If HR rejects: transfer request status becomes "Rejected by HR" (terminal state); employee and manager are notified
- If HR approves: transfer request proceeds to Target Manager confirmation

---

### BRD-004: Target Manager Confirmation
**As a** Manager (Target)  
**I want to** confirm or decline acceptance of an employee transferring into my team  
**So that** I can ensure the employee fits the team's current capacity and requirements

**Details**:
- Target Manager must receive notification when HR approves the transfer
- Target Manager must be able to view transfer request details, employee profile summary, and approval history
- Target Manager must be able to confirm acceptance or decline
- Target Manager must be able to provide comments
- System must record Target Manager decision timestamp
- If Target Manager declines: transfer request status becomes "Declined by Target Manager" (terminal state); employee, current manager, and HR are notified
- If Target Manager confirms: transfer request proceeds to "Approved — Pending Effective Date"

---

### BRD-005: Transfer Status Tracking
**As an** Employee  
**I want to** view the current status of my internal transfer request  
**So that** I have visibility into where the request is in the approval workflow

**Details**:
- Employee must be able to access a "My Transfer Requests" view in the Employee Portal
- Each request must display: Transfer Request ID, target department, submission date, current status, last updated timestamp
- Status values include:
  - Pending Manager Approval
  - Pending HR Validation
  - Pending Target Manager Confirmation
  - Approved — Pending Effective Date
  - Effective (transfer completed)
  - Rejected by Manager
  - Rejected by HR
  - Declined by Target Manager
  - Withdrawn by Employee
- Employee must be able to view approval history (who approved, when, comments)

---

### BRD-006: Request Withdrawal
**As an** Employee  
**I want to** withdraw my internal transfer request before it becomes effective  
**So that** I can cancel the request if my circumstances change

**Details**:
- Employee must be able to withdraw a transfer request that is in any non-terminal status
- Withdrawal is not allowed once transfer status is "Effective"
- System must prompt for confirmation before withdrawal
- System must record withdrawal timestamp
- System must notify current manager, HR Administrator, and Target Manager (if involved) of the withdrawal
- Request status becomes "Withdrawn by Employee" (terminal state)

---

### BRD-007: Integration Notifications (IT, Payroll, Facilities)
**As a** System  
**I want to** send automated notifications to IT, Payroll, and Facilities systems when a transfer is approved  
**So that** downstream teams can take necessary actions

**Details**:
- When transfer status changes to "Approved — Pending Effective Date", system must send notification payloads to integration endpoints:
  - **IT System**: Employee ID, new department, new location, effective date (for access provisioning)
  - **Payroll System**: Employee ID, new department, new cost center (if applicable), effective date
  - **Facilities System**: Employee ID, new location, effective date (for desk/parking/badge updates)
- Notifications must be asynchronous (fire-and-forget or queued)
- System must log all integration notification attempts (success/failure)
- System must support retry logic for failed notification delivery
- No real-time synchronous validation from external systems is required (notification-based integration only)

---

### BRD-008: Email Notifications
**As a** System  
**I want to** send email notifications at key workflow milestones  
**So that** stakeholders are informed of transfer request progress

**Details**:
- Email notifications must be sent for the following events:
  - Employee submits transfer request → notify Current Manager
  - Manager approves → notify Employee and HR Administrator
  - Manager rejects → notify Employee
  - HR approves → notify Employee, Current Manager, and Target Manager
  - HR rejects → notify Employee and Current Manager
  - Target Manager confirms → notify Employee, Current Manager, and HR Administrator
  - Target Manager declines → notify Employee, Current Manager, and HR Administrator
  - Employee withdraws request → notify Current Manager, HR Administrator, and Target Manager (if applicable)
  - Transfer becomes effective → notify Employee, Current Manager, Target Manager, and HR Administrator
- Email must include: Transfer Request ID, employee name, target department, current status, link to portal
- Email templates must be configurable

---

### BRD-009: Audit Trail and History
**As an** HR Administrator or System Administrator  
**I want to** view a complete audit trail for each transfer request  
**So that** decisions and workflow progression are fully traceable for compliance purposes

**Details**:
- System must record all state transitions with timestamp, actor (user or system), and action taken
- Audit trail must be immutable (append-only)
- Audit trail must include: request creation, all approval/rejection decisions, comments, withdrawals, status changes, integration notifications sent
- Audit trail must be accessible to HR Administrators and System Administrators
- Audit data must be retained for at least 7 years (compliance requirement)

---

### BRD-010: Effective Date Enforcement
**As a** System  
**I want to** automatically update transfer request status to "Effective" on the preferred effective date  
**So that** transfers are finalized automatically without manual intervention

**Details**:
- System must run a scheduled job (daily) to identify transfer requests with status "Approved — Pending Effective Date" where preferred effective date <= current date
- System must transition status to "Effective" for matching requests
- System must send "Transfer Effective" email notifications to all stakeholders
- System must update employee's organizational data (department, location, reporting manager) in the portal's user directory
- Status change must be recorded in audit trail

---

## 6. Non-Functional Requirements

### NFR-001: Security
- All user access must be authenticated via organization's SSO (Single Sign-On)
- Role-based access control: Employee, Manager, HR Administrator, System Administrator
- Sensitive data (justification, comments, employee details) must be encrypted at rest
- All API calls must use HTTPS
- Audit trail must be tamper-proof (append-only, immutable)

### NFR-002: Performance
- Transfer request submission must complete within 2 seconds
- Manager/HR approval actions must complete within 2 seconds
- Status tracking page must load within 3 seconds
- Email notifications must be sent within 5 minutes of triggering event
- Scheduled effective date job must complete processing within 30 minutes

### NFR-003: Availability
- System must be available 99.5% uptime during business hours (8 AM — 6 PM local time, weekdays)
- Planned maintenance windows must be communicated 48 hours in advance

### NFR-004: Usability
- User interface must be accessible via modern web browsers (Chrome, Firefox, Edge, Safari)
- Forms must provide inline validation with clear error messages
- UI must be responsive (desktop and tablet; mobile out of scope)

### NFR-005: Scalability
- System must support up to 10,000 concurrent employees
- System must support up to 500 concurrent transfer requests in-flight
- System must handle up to 50 transfer request submissions per hour during peak periods

### NFR-006: Integration Resilience
- Integration notification failures must not block transfer approval workflow
- System must retry failed integration notifications up to 3 times with exponential backoff
- Integration health monitoring must be available to System Administrators

---

## 7. Business Rules

### BR-001: Eligibility Criteria
- Employee must have completed at least 12 months tenure in current role to be eligible for internal transfer
- Employee must not have an active disciplinary action on record
- Employee must not have submitted another transfer request in the past 6 months

### BR-002: Approval Sequence
- Transfer request approval must follow strict sequence: Current Manager → HR Administrator → Target Manager
- Rejection at any stage terminates the workflow (no resubmission without HR intervention)

### BR-003: Effective Date Constraints
- Preferred effective date must be at least 30 days from submission date (notice period)
- Preferred effective date must not be more than 90 days from submission date

### BR-004: Manager Notification Timeout
- If Current Manager does not respond within 7 business days, system must escalate to HR Administrator
- If Target Manager does not respond within 7 business days, system must escalate to HR Administrator

### BR-005: Single Active Request
- Employee may have only 1 active (non-terminal) transfer request at any time

---

## 8. Assumptions

1. Organization's SSO system is already operational and can be integrated
2. Employee organizational data (department, location, reporting manager) is maintained in a central directory accessible to the portal
3. Email delivery infrastructure is reliable and already provisioned
4. IT, Payroll, and Facilities systems expose integration endpoints capable of receiving notification payloads (or message queue)
5. HR policies regarding transfer eligibility are well-documented and accessible to HR Administrators
6. Target department and location master data is maintained and accessible
7. User roles (Employee, Manager, HR Administrator, System Administrator) are managed externally and provided via SSO claims

---

## 9. Out of Scope

- External recruitment or hiring workflows
- Promotion or role change workflows that are not transfers
- Salary or compensation adjustments (handled separately by Payroll after notification)
- Performance appraisal integration
- Real-time synchronous validation with IT, Payroll, or Facilities systems
- Mobile native application (web portal only)
- Bulk transfer operations (e.g., department-wide transfers)
- Manager delegation (manager must personally approve; no delegation to deputy)

---

## 10. Open Questions

1. **SSO Integration Details**: What SSO protocol is used (SAML, OAuth2, OIDC)? What user claims are provided?
2. **Integration Endpoints**: What are the API specifications (REST, SOAP, message queue) for IT, Payroll, and Facilities systems?
3. **Employee Eligibility Data Source**: Where is tenure, disciplinary status, and prior transfer request data sourced from?
4. **Escalation Authority**: Who receives escalated requests when managers do not respond within 7 business days?
5. **Manager Hierarchy**: How is "current manager" determined? From SSO claims, from HR directory, or maintained in portal?
6. **Target Manager Identification**: How is the target manager identified for the target department? From organizational hierarchy or manual assignment?
7. **Cost Center Mapping**: Is cost center data required for payroll notification? If yes, where is it sourced?
8. **Notification Retry Policy**: What is the maximum retry count and retry interval for failed integration notifications?
9. **Audit Retention**: Is 7-year audit retention a strict regulatory requirement, or configurable?
10. **Portal Session Timeout**: What is the session timeout policy for the Employee Portal?

---

## 11. Acceptance Criteria (BRD-Level)

- All functional requirements (BRD-001 through BRD-010) are satisfied
- All non-functional requirements (NFR-001 through NFR-006) are met
- All business rules (BR-001 through BR-005) are enforced
- All actors can perform their designated responsibilities
- No out-of-scope features are implemented
- All open questions are resolved before feature spec approval (Gate 1)
- System demonstrates full traceability from BRD requirement to implemented feature
- All integration touchpoints (IT, Payroll, Facilities) receive correct notification payloads
- Audit trail captures all workflow events with full history

---

## 12. Timeline & Milestones (Reference)

This section is provided for context from the original assessment document and is NOT part of the executable project plan. Actual SDD execution follows INT SDD lifecycle as governed by `.ai-context/constitution.md`.

**Original Assessment Timeline**:
- Milestone 1 — BRD → Spec → AC → API Contract → Test Cases: Days 1-2
- Milestone 2 — Gate 1 Peer Review: Day 3
- Milestone 3 — Plan → Tasks: Days 4-5
- Milestone 4 — Implementation & Gate 2: Days 6-8

**Effort Expectation**: Approximately 30-35 hours total, spread over 8 working days

---

## Revision History

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-09-21 | INT AI Agent | Initial baseline ingested from `docs/Requirement_for_SDD.docx` |
