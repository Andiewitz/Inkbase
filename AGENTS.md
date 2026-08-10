# Server Agent Rules

## services/ structure

Every service is a self-contained module in its own folder under `services/`.
A service owns ALL of its own logic — including its database access. DB code
for a service lives inside that service's folder, never in a shared or central
location.

```
services/
  auth/
    account-setup.go
    jwt.go
    db.go          <- auth's db stuff lives here
  payments/
    checkout.go
    db.go          <- payments owns its own db logic
```

Rules:

- Each feature/domain gets its own folder under `services/`.
- DB logic belongs to the service that owns the data. Do not centralize it.
- `internal/api/` handlers stay thin: parse input, call a service, write the response.
- `shared/` is only for cross-cutting helpers (response writing, validation, etc.),
  never for domain logic or DB code.

# AGENTS.md

> This file is the operational constitution for any AI agent working in this codebase.
> Read this entire file before taking any action. No exceptions.
> You do not proceed past any phase without explicit confirmation from the developer.

---

## WHO YOU ARE WORKING WITH

You are working with a senior full-stack developer. He knows his codebase. He does not need hand-holding, soft suggestions, or padded explanations. He needs precision, proactivity, and zero silent errors. Do not treat him like a beginner. Treat him like the person who owns the system and has final say on everything.

---

## THE LOOP — YOUR ONLY WAY OF WORKING

Every single task follows this loop. You do not skip steps. You do not reorder steps. You do not merge steps. If the task feels small, you still follow the loop.

### PHASE 1 — GATHER REQUIREMENTS

Ask. Clarify. Do not assume.

Before you form any opinion about the codebase or what needs to change, make sure you fully understand what is being asked. If something is ambiguous, say so and ask. If the request has multiple interpretations, surface them. Do not start reviewing the codebase until you understand exactly what you are solving for.

Do not touch any file. Do not propose anything. Just gather.

---

### PHASE 2 — REVIEW CURRENT STATE

Read the codebase with the requirements in mind.

Understand what already exists before forming any plan. Map out the relevant files, services, and logic that will be affected. Identify how the existing system works, what patterns it follows, and where the request fits in.

**During this review, you are required to proactively flag anything you find that is wrong — even if it was not part of the original request.** This includes but is not limited to:

- N+1 query problems
- Security vulnerabilities (exposed secrets, missing auth guards, improper input sanitization, etc.)
- Race conditions
- Broken or missing error handling
- Architectural violations (see Service Boundaries section)
- Performance bottlenecks that are obvious from the code

You do not stay silent about these. You surface them clearly, labeled as **⚠️ FLAGGED ISSUE**, with a plain explanation of what it is and why it matters. The developer decides what to do with them — but you are required to report them.

---

### PHASE 3 — PRESENT PLAN FOR APPROVAL

You do not implement anything until the developer says go.

Present your full plan. The approval summary must include every one of the following:

**Tech Stack**
- What is being added (new packages, tools, services)
- What is being removed
- What existing stack is being used or touched

**Files Touched**
- Every file that will be created, modified, or deleted
- A one-line explanation of what changes in each file

**Core Logic Interaction**
- How the changes interact with existing business logic
- Any side effects, dependencies, or ripple effects to be aware of

**Service Boundaries**
- What service boundaries this change creates or crosses
- Where new files will live and why they live there
- Confirm that no file is doing more than one distinct job

**Flagged Issues (if any)**
- Anything surfaced during Phase 2 that is not part of the current task
- You are not implementing fixes for these unless the developer asks — but they must be listed

After presenting, you stop. You wait. The developer responds with confirmation or changes. If changes are requested, you revise the plan and present again. You do not proceed until you receive explicit approval.

---

### PHASE 4 — TEST PLAN

Before implementation, define the test strategy.

Quality over quantity. Do not write tests to hit a coverage number. Write tests that actually catch real failures. For each test you plan, be able to answer: what breaks if this test fails, and why does that matter?

Your test plan must include:
- What is being tested and why it is worth testing
- What failure scenario each test is designed to catch
- Any edge cases or boundary conditions that are non-obvious
- Integration points that need to be validated end-to-end

Present the test plan as part of your pre-implementation summary. The developer may trim, add to, or approve it as-is.

---

### PHASE 5 — BREAK INTO GOALPOSTS

Decompose the approved plan into discrete, sequential steps.

Each goalpost is one unit of work that can be completed, committed, tested, and verified independently. No goalpost should be so large that its failure is hard to isolate. No goalpost should be so small that it is meaningless in isolation.

Present the goalpost list before starting. This becomes the working checklist.

---

### PHASE 6 — UPDATE TODO.MD

Before touching a single line of code, update `TODO.md` at the project root.

- If `TODO.md` does not exist, create it
- If it already exists, append to it — do not overwrite previous entries
- Each entry must include:
  - The date (YYYY-MM-DD format)
  - The task name
  - A detailed description of what is being done and why
  - The goalpost list for this task

`TODO.md` is a living document. It is the audit trail of everything that has been done in this project.

---

### PHASE 7 — IMPLEMENT

Work through goalposts one at a time.

After completing each goalpost:

1. Write the git commit message and commit
2. Run the relevant tests for that goalpost
3. Show that it works — output, logs, passing tests, whatever is appropriate
4. Only then move to the next goalpost

You do not batch goalposts. You do not skip the commit. You do not skip the test run. You do not move on until the current goalpost is demonstrably working.

If something breaks during implementation that changes the plan, stop. Surface it. Do not silently work around it.

---

### PHASE 8 — FINAL WALKTHROUGH

After all goalposts are complete, you deliver a full walkthrough. This is not optional.

The walkthrough must cover:

- A summary of every change made, file by file
- How the final implementation compares to the original plan (any deviations and why)
- Any issues that were encountered during implementation and how they were resolved
- All flagged issues from Phase 2 — restated with a recommended action for each one
- Any suggestions for future improvements you observed but did not implement
- Confirmation that all tests pass and the feature works end-to-end

This walkthrough is the close of the loop. Nothing is considered done until it is delivered.

---

## SERVICE BOUNDARIES — NON-NEGOTIABLE

This is the structural law of this codebase. You follow it without exception.

### Folder = Domain. File = Operation.

A folder defines a service domain. A file inside that folder defines one distinct operation within that domain. If something does something different, it gets its own file. Period.

**Example — correct:**
```
/server/services/auth/
  login.py
  logout.py
  account-setup.py
  token-refresh.py
  password-reset.py
  gateway.py
```

**Example — wrong:**
```
/server/services/auth/
  auth.py        ← contains login, logout, token refresh, password reset, and gateway logic
```

If you find yourself putting more than one distinct operation into a single file, stop and split it. The rule is not "keep files short." The rule is "one file does one thing." A file can be long if that one thing is complex. A file cannot be short if it is doing two different jobs.

### The /shared/ Directory

`/shared/` is reserved for infrastructure-level code that genuinely has no single service owner and is consumed by multiple services. This includes:

- Redis configuration and connection management
- Nginx configuration
- Load balancer logic
- Shared middleware
- Cross-cutting utilities (logging, tracing, etc.)

`/shared/` is **not** a place to put things you are unsure where to put. If you are unsure where something belongs, ask. Do not dump it in `/shared/` to resolve ambiguity.

### Before Creating Any File

Ask yourself:
1. What is the single responsibility of this file?
2. Does a file with this responsibility already exist?
3. Does this belong to a specific service domain, or is it genuinely cross-cutting infrastructure?

If you cannot answer question 1 in one sentence, the file is not scoped correctly.

---

## FLAGGED ISSUES — HOW TO REPORT THEM

When you find a problem during your review that was not part of the original request, report it in this format:

```
⚠️ FLAGGED ISSUE
Type: [Security / Performance / Architecture / Logic / Other]
Location: [file path and line reference if applicable]
What it is: [plain description of the problem]
Why it matters: [what breaks or what risk it creates]
Suggested fix: [what you would do to address it]
Status: Awaiting developer decision
```

You do not implement the fix unless asked. You do not bury it at the bottom of a long message. You surface it clearly.

---

## GIT COMMIT CONVENTIONS

Every commit after a completed goalpost follows this format:

```
<type>(<scope>): <short description>

- <what was done>
- <what it affects>
- <any non-obvious decision made>
```

Types: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`

Scope is the service or domain affected (e.g. `auth`, `shared`, `redis`, `api`).

Example:
```
feat(auth): add token-refresh service

- Created /server/services/auth/token-refresh.py
- Handles silent refresh via httpOnly cookie
- Integrated with existing gateway.py middleware
```

---

## WHAT YOU DO NOT DO

- You do not start implementing before receiving explicit approval
- You do not merge multiple operations into one file
- You do not use `/shared/` as a catch-all
- You do not stay silent about bugs, vulnerabilities, or architectural violations you find
- You do not skip commits between goalposts
- You do not skip tests
- You do not skip the final walkthrough
- You do not make assumptions when you can ask
- You do not pad your responses with unnecessary caveats, apologies, or filler
- You do not deliver a final walkthrough that glosses over what actually changed

---

## QUICK REFERENCE — THE LOOP AT A GLANCE

```
1. GATHER REQUIREMENTS     → ask, clarify, no assumptions
2. REVIEW CURRENT STATE    → read codebase, flag all issues found
3. PRESENT PLAN            → stack / files / logic / boundaries → WAIT FOR APPROVAL
4. TEST PLAN               → quality over quantity, justify each test
5. GOALPOSTS               → break into discrete units of work
6. TODO.MD                 → create or update, dated, detailed
7. IMPLEMENT               → one goalpost → commit → test → verify → next
8. FINAL WALKTHROUGH       → all changes, deviations, flags, suggestions
```

No step is optional. No step can be skipped because the task feels small.

---

*Last updated: 2026-08-10*