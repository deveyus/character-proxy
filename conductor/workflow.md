# Project Workflow

## Guiding Principles

1. **The Plan is the Source of Truth:** All work must be tracked in `plan.md`
2. **The Tech Stack is Deliberate:** Changes to the tech stack must be documented in `tech-stack.md` _before_ implementation
3. **Test-Driven Development (Knowledge Encoding):** Write unit tests to encode knowledge and prevent regressions. Testing focuses on logical failures and critical edge cases rather than exhaustive line coverage.
4. **Avoid Mock-Heavy Tests:** Tests that rely heavily on mocks (e.g., monkey-patching `fetch`) are often brittle and "lie" about system behavior. Favor:
   - **Architectural Separation:** Isolate pure logic (which can be tested with real data/fixtures) from side-effects (IO, Network).
   - **Real Integration:** Test against real (or containerized) dependencies where possible for critical paths.
   - **Fakes over Mocks:** Use robust "fake" implementations of internal interfaces rather than ad-hoc mocks of global globals.
5. **Targeted Testing:** Aim for meaningful test coverage of core logic. A 0% global coverage requirement is set, but with an aggressive focus on "Regression Testing" for critical functionality.
5. **User Experience First:** Every decision should prioritize user experience (and developer experience for API consumers).
6. **Non-Interactive & CI-Aware:** Prefer non-interactive commands. Use `CI=true` for watch-mode tools (tests, linters) to ensure single execution.

## Task Workflow

All tasks follow a strict lifecycle:

### Standard Task Workflow

1. **Select Task:** Choose the next available task from `plan.md` in sequential order

2. **Mark In Progress:** Before beginning work, edit `plan.md` and change the task from `[ ]` to `[~]`

3. **Define Knowledge Tests:**
   - Create a new test file or add to existing ones.
   - Write tests that define the expected behavior for the logic being implemented.
   - Run the tests and confirm they fail.

4. **Implement Feature:**
   - Write the application code.
   - Run the test suite again and confirm that all tests now pass.

5. **Refactor:**
   - Improve code clarity and performance while keeping tests passing.

6. **Verify Standards:** Ensure code follows project style guides and documentation requirements.

7. **Document Deviations:** If implementation differs from tech stack:
   - **STOP** implementation
   - Update `tech-stack.md` with new design
   - Add dated note explaining the change
   - Resume implementation

8. **Commit Changes:**
   - Stage all code changes related to the task.
   - Create a clear, concise commit message including a detailed task summary in the body.
   - Perform the commit.

9. **Get and Record Task Commit SHA:**
   - **Step 9.1: Update Plan:** Read `plan.md`, find the line for the completed task, update its status from `[~]` to `[x]`, and append the first 7 characters of the _just-completed commit's_ commit hash.
   - **Step 9.2: Write Plan:** Write the updated content back to `plan.md`.

10. **Commit Plan Update:**
    - **Action:** Stage the modified `plan.md` file.
    - **Action:** Commit this change with a descriptive message (e.g., `conductor(plan): Mark task 'Create user model' as complete`).

### Phase Completion Verification and Checkpointing Protocol

**Trigger:** This protocol is executed immediately after a task is completed that also concludes a phase in `plan.md`.

1. **Announce Protocol Start:** Inform the user that the phase is complete and the verification and checkpointing protocol has begun.

2. **Verify and Create Regression Tests:**
   - **Step 2.1: List Changed Files:** Execute `git diff --name-only <previous_checkpoint_sha> HEAD`.
   - **Step 2.2: Verify Tests:** Ensure core logic in changed files is covered by regression tests.

3. **Execute Automated Tests:**
   - Run the automated test suite.
   - If tests fail, begin debugging. (Max two attempts before asking for help).

4. **Propose a Detailed, Actionable Manual Verification Plan:**
   - Analyze `product.md`, `product-guidelines.md`, and `plan.md`.
   - Generate a step-by-step plan for the user to verify the changes.

5. **Await Explicit User Feedback:**
   - Wait for user confirmation ("yes" or feedback).

6. **Create Checkpoint Commit:**
   - Stage all changes and commit with `conductor(checkpoint): Checkpoint end of Phase X`.

7. **Get and Record Phase Checkpoint SHA:**
   - Update `plan.md` with the checkpoint hash.

8. **Commit Plan Update:**
   - Commit the plan update: `conductor(plan): Mark phase '<PHASE NAME>' as complete`.

## Development Commands (Deno)

### Setup

```bash
# Nix will handle the environment setup.
# Run migrations:
deno task db:migrate
```

### Daily Development

```bash
# Run tests:
deno test -A
# Lint:
deno lint
# Format:
deno fmt
```

### Before Committing

```bash
deno test -A && deno lint && deno fmt --check
```

## Definition of Done

A task is complete when:

1. All code implemented to specification
2. Critical regression tests passing
3. Documentation complete
4. Code passes Deno lint and fmt
5. Implementation notes added to `plan.md`
6. Changes committed with proper message and summary
7. Plan updated with commit SHA
