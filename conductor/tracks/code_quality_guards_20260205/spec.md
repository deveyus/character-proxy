# Specification: Code Quality: Guard Clauses & Early Returns

## Goal

Refactor the codebase to eliminate unnecessary `else` and `else if` blocks in favor of explicit conditions and guard clauses (early returns). This improves readability, reduces cognitive load, and flattens the code structure.

## Requirements

### 1. Pattern Shift

- **From:**
  ```ts
  if (condition) {
    // heavy logic
  } else {
    // minor logic
  }
  ```
- **To:**
  ```ts
  if (!condition) {
    // minor logic
    return;
  }
  // heavy logic
  ```

### 2. Target Areas

- **tRPC Router (`api/src/trpc/router.ts`):** Replace `if/else if/else` logic with early returns or a cleaner dispatch pattern.
- **Entity Services (`api/src/services/*.ts`):** Flatten the `esiRes.status` handling logic.
- **Worker Logic (`api/src/services/discovery/worker.ts`):** Simplify the queue processing and loop logic.

## Standards

- Maintain functional style.
- Ensure all tests pass after refactoring.
- No changes to functional behavior; this is a pure refactor.
