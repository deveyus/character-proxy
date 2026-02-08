# Technology Stack

## Core Runtime & Language

- **Runtime:** **Deno**. Chosen for its built-in security, modern tooling (linter, formatter, test runner), and first-class TypeScript support.
- **Language:** **TypeScript**. Enforced strictly across the entire codebase.
- **Error Handling:** **Result Pattern (`ts-results-es`)**. All functions that can fail must return a `Result<T, E>` or `AsyncResult<T, E>`. Use of `try-catch` blocks is discouraged in favor of explicit error propagation and functional handling.

## API & Communication

- **Web Server:** **Hono**. Used as the primary web application framework for serving the dashboard, tRPC API, and real-time event streams.
- **Real-Time Updates:** **Server-Sent Events (SSE)**. Used to broadcast discovery and system events from the backend to the dashboard without the overhead of WebSockets.
- **API Framework:** **tRPC**. Used for end-to-end type safety between the Deno backend and any consumers (internal or external).

+## Frontend & Observability
+
+- **Component Model:** **Lit**. Used for building lightweight, reactive Web Components for the management dashboard. Leverages standard JavaScript template literals instead of JSX.
+- **Styling:** **Design Token Driven CSS**. Utilizes global CSS Custom Properties for theme consistency and scoped component styles for encapsulation.
+

## Data Persistence

- **Database:** **PostgreSQL**.
  - **Rationale:** Selected for its robust relational data modeling capabilities (essential for the complex Character -> Corp -> Alliance graph) and concurrent write handling.
- **SQL Execution:** **Raw SQL (`postgres.js`)**.
  - **Usage:** Used for all database interactions to ensure maximum performance and clarity. Queries are written in idiomatic SQL.
- **Data Validation & Typing:** **Zod**.
  - **Usage:** All rows returned from the database are validated against Zod schemas. These schemas serve as the single source of truth for TypeScript types across the application.
  - **Constraint:** Data is structured into SQL tables upon ingestion. **JSONB is explicitly avoided** for entity data to ensure efficient indexing and querying, though it may be used for internal system state.

## Infrastructure & Tooling

- **Environment Management:** **Nix (Flakes)**. Ensures a reproducible development environment for Deno, PostgreSQL, and other system dependencies.
- **Logging:** **Deno Standard Library (`std/log`)**. Implemented with custom formatters for OTel-ready JSON and human-readable "pretty" output, supporting structured attributes. Treats logs as event streams (stdout) per 12-Factor principles.
- **Testing:** **Deno built-in test runner**.
- **Linting/Formatting:** **Deno built-in linter and formatter**.

## Deployment & Architecture

- **Methodology:** **12-Factor App**. The application is designed to be stateless, configured via environment variables, and treat logs as event streams.
- **Containerization:** **OCI Ready**. Application artifacts and runtime behaviors are designed for execution within containerized environments (Docker/Podman) without modification.
