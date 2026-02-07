# Specification: Documentation & JSDoc Hardening

## Overview
Improve project-wide explorability and maintainability by standardizing and enriching JSDoc documentation across all public and private functions. This track focuses on precise language, performance awareness, and clear usage patterns.

## Functional Requirements
1.  **Standardized JSDoc Structure:**
    -   All functions (public and private) must have `@param` and `@returns` tags where applicable.
    -   Precise language must be used in summaries to describe the function's primary intent.
2.  **Performance Documentation:**
    -   Functions with significant performance implications (ESI calls, large DB scans) must include a "Performance" heading in the main description.
    -   Format: `[Degree] -- [Type]`. Example: `High -- ESI` or `Medium -- DB Scan`.
3.  **Side-Effect & Metadata Declarations:**
    -   Explicitly document side effects, such as database writes or the triggering of background tasks.
    -   ESI client functions must include the specific ESI URL template used (e.g., `ESI: /characters/{id}/`).
4.  **Usage Examples:**
    -   Prioritize `@example` blocks for:
        -   All Public Service Functions.
        -   All fallible functions returning a `Result` type, demonstrating proper error handling.

## Non-Functional Requirements
-   **Consistency:** The documentation style must be uniform across the entire Deno codebase.
-   **Explorability:** Enhance the developer experience for IDE tooltips and auto-generated documentation.

## Acceptance Criteria
-   All files in `api/src/` have been audited and updated.
-   Public service methods include usage examples with `ts-results-es` patterns.
-   High-latency functions are clearly marked with performance notes.
-   `deno check` and `deno lint` pass.

## Out of Scope
-   Functional changes to application logic.
-   Frontend documentation (focused strictly on the API/Backend for this track).
