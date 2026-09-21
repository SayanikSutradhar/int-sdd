---
name: int-pr-gate-workflow
description: Standardized PR Gate Workflow between Spec Generation and Gate 2 Approval covering parallel spec execution, reviewer detection after git pull, role decision prompts, reviewer identity validation, Gate 1 & Gate 2 standardized review templates, and dashboard synchronization.
---

# INT PR Gate Workflow (Spec Generation → Gate 1 → Development → Gate 2)

> [!IMPORTANT]
> **Scope Restriction**
> This workflow governs exclusively the PR Gate lifecycle between **Spec Generation and Gate 2 Approval**.
> Workflows before Spec Generation (BRD, Setup, Ingestion) and after Gate 2 Approval (Release Management, CRs, Hotfixes, Deployment) remain 100% unchanged.

---

## 1. Non-Blocking Parallel Spec Execution

Multiple specs exist and progress independently. Specs in different lifecycle stages do not block one another:
- `spec-1` → Waiting for Gate 1 (`In Peer Review`)
- `spec-2` → Waiting for Gate 1 (`In Peer Review`)
- `spec-3` → Gate 1 Approved (`Approved`)
- `spec-4` → In Development (`Under Development`)
- `spec-5` → Waiting for Gate 2 (`In QA`)

---

## 2. Reviewer Detection & Trigger Mechanism

The PR Gate Workflow supports **Hybrid Triggering** for optimal user experience:

### A. Context-Aware Session Resume / Git Pull Notification
When a user pulls code or resumes an agent session:
1. The agent inspects Git user credentials: `git config user.name`, `git config user.email` (or configured User ID).
2. The agent queries `.ai-context/dashboard.html` and `.ai-context/specs/` for assigned pending reviews.
3. If pending reviews exist for this user identity, the agent displays a non-blocking notification:
   > 📌 **Pending PR Reviews**: You have **N pending reviews** assigned to you.
   > *Type **`/pr-gate-workflow`** to launch the reviewer workspace, or proceed with your command.*

### B. Mandatory Pre-Check Authorization Workflow (`/pr-gate-workflow`)

When `/pr-gate-workflow` is triggered, the system MUST execute **Mandatory Pre-Check Authorization FIRST** before asking any questions:

```text
               1. Execute /pr-gate-workflow
                           │
                           ▼
          2. Check git config user.email
                           │
                           ▼
   Compare against Assigned Reviewer Roster (project_context.md)
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
    [ EMAILS MATCH ]            [ EMAILS DO NOT MATCH ]
             │                           │
             ▼                           ▼
  User IS Authorized Reviewer   User IS NOT Authorized Reviewer
             │                           │
             ▼                           ▼
  Show Reviewer Questions:      1. Display Unauthorized Alert:
  - Option 1: Review Specs         "🛑 UNAUTHORIZED FOR PR REVIEW:
  - Option 2: Work on Specs         Your email (<logged_in_email>) does
                                    not match assigned reviewer (<assigned_email>)."
                                2. SKIP Option 1 completely!
                                3. DIRECTLY route to Developer Selection:
                                   "Which approved spec would you like
                                    to start development on?"
```

#### Step 1: Execute Authorization Pre-Check FIRST
Inspect `git config user.email` and compare against assigned reviewer emails (`Gate 0 Reviewers`, `Gate 1 Reviewers`, `Gate 2 Reviewers`) configured in `.ai-context/project_context.md` and `.ai-context/constitution.md`.

#### Step 2A: If Email MATCHES Assigned Reviewer Roster
The user is confirmed as an **Authorized Reviewer**. Present the Reviewer Decision Prompt:
> **"You are logged in as <User Name> (<Email>). You are an authorized PR Reviewer. What would you like to do?"**
> - **[ Option 1 — Review Pending Specs ]**
> - **[ Option 2 — Work on Approved Specs ]**

#### Step 2B: If Email DOES NOT MATCH Assigned Reviewer Roster
The user is **UNAUTHORIZED FOR PR REVIEW**.
1. **DO NOT** display Option 1 (Review Pending Specs).
2. **DO NOT** use interactive modal tools (`ask_question`) to prompt the user to change or update `.ai-context/project_context.md` or `.ai-context/constitution.md`!
3. Display the high-priority Unauthorized Alert:
   > 🛑 **UNAUTHORIZED FOR PR REVIEW**
   > - **Logged-in Git Email:** `<logged_in_email>`
   > - **Assigned Reviewer Email:** `<assigned_email>`
   >
   > 🔒 **Access Restricted**: You are not authorized to perform PR reviews for this project because your logged-in Git email does not match the assigned PR reviewer email. Remaining in Developer mode.
4. **Bypass Reviewer Prompt & Direct Immediately to Development**:
   > 💻 **Directing to Developer Workspace...**
   > **"Which approved spec would you like to start development on?"**
   > [Displays roster of eligible Gate 1 approved specs]

---

## 5. Behavior When Developer Pulls Code After REJECTED PR Review

When a developer pulls code or resumes execution and prompts to "continue" or start work on an artifact whose PR Review was **REJECTED** or marked **`Changes Requested`**:

The system **STRICTLY STOPS** and refuses to proceed to downstream steps (`.plan.md`, `.tasks.md`, `src/` coding, merge, or release).

---

## 3. Option 1 — Review Pending Specs Protocol (Complete Lifecycle)

1. **Role-Based Spec & Artifact Filtering & Listing**
2. **Spec & BRD-Oriented Interactive Q&A Review Process**
3. **Dedicated Review Record Artifact File Creation** under `.ai-context/pr_reviews/`
4. **Git Identity Validation**
5. **5-Artifact Synchronization Protocol**: Dashboard HTML, Spec, PR Review File, status.md, prompt_history.md

---

## 4. Option 2 / Developer Work Selection & Pre-Development Verification Protocol

1. Display ONLY specs eligible for development (Gate 1 Approved).
2. Pre-Development PR Review Check before creating plans, tasks, or code.
3. Strict Gate 1 Rejection Block on rejected specs.

---

## 5. Role Separation & Local-Only Handling

- **Reviewer Identity**: Confers official Gate 1 & Gate 2 approval/rejection rights.
- **Developer Identity**: Confers rights to pull code, select approved specs, write implementation code, and submit for Gate 2 review.
- **Local-Only Scenario**: If project is not pushed to Git, Git credential validation is bypassed, but complete reviewer name, email/User ID, review comments, description, and timestamps MUST be captured in the review record.
