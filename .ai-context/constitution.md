# Project Constitution — Employee Internal Transfer

> This constitution governs all engineering decisions on the Employee Internal Transfer project.
> It will be enriched and finalized upon BRD ingestion. Sections marked TBD will be populated
> from the approved BRD once Gate 0 review is complete.

## Testing Discipline
- Jest is the primary testing framework for both frontend and backend.
- All backend modules must have unit tests covering happy path, failure, and edge cases.
- Frontend components must have component-level tests.
- TDD (Test-First) discipline is enforced: write failing tests (RED) before writing implementation (GREEN).
- Test coverage minimum threshold: TBD (to be defined in BRD).
- Executable tests live under `tests/frontend/` and `tests/backend/`.
- Test case specifications (non-executable) live under `.ai-context/test_cases/`.
- No feature implementation may proceed to Gate 2 with known failing tests.

## Security Posture
- JWT tokens are signed with a secret stored in environment variables only (`process.env.JWT_SECRET`).
- Tokens are stored in HTTP-only, Secure, SameSite=Strict cookies — never in localStorage.
- CSRF protection middleware must be applied to all state-mutating routes.
- All incoming request payloads must be validated and sanitized before processing.
- No secrets, credentials, or API keys may be hardcoded in source files.
- Environment variables are managed via `.env` (gitignored). A `.env.example` file documents required variables.
- SQL injection prevention is enforced via Sequelize parameterized queries — raw queries are prohibited unless reviewed.
- Role-based access control (RBAC) must be implemented for all protected routes.
- Authentication middleware must be applied to all non-public API endpoints.

## Architectural Constraints
- Architecture style: Modular Monolith (Microservice Ready).
- Business logic must be encapsulated within clearly bounded modules under `src/backend/modules/` and `src/frontend/modules/`.
- Cross-module communication is via well-defined service interfaces — direct model-to-model imports across module boundaries are prohibited.
- Shared utilities, database connections, and infrastructure concerns live under `src/backend/shared/` and `src/frontend/shared/`.
- No new datastore may be introduced without a corresponding Architecture Decision Record (ADR) in `.ai-context/decisions/`.
- The backend exposes a RESTful API consumed by the frontend — no direct database access from frontend code.
- ES6 module syntax (`import`/`export`) is mandatory throughout — `require()` is prohibited in new code.
- `async/await` is mandatory for all asynchronous operations — raw `.then().catch()` chains are prohibited.

## Non-Functional Baselines
- API response time targets: TBD (to be defined in BRD).
- Availability requirements: TBD (to be defined in BRD).
- Concurrent user targets: TBD (to be defined in BRD).
- All API endpoints must return structured JSON responses with consistent error shapes.
- HTTP status codes must follow REST conventions (200, 201, 400, 401, 403, 404, 422, 500).
- All errors must be logged via the project logger (Winston or equivalent) — `console.log` is prohibited in production code paths.

## Versioning Rules
- Semantic versioning (SemVer): `vMAJOR.MINOR.PATCH`.
- MAJOR: breaking changes to API contracts or data models.
- MINOR: new features or non-breaking additions.
- PATCH: bug fixes and hotfixes.
- Release tags are created by the Release Management workflow.
- Hotfix branches follow the convention: `hotfix/<incident-slug>`.
- Feature branches follow the convention: `feature/<spec-slug>`.
