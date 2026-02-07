# Technology Stack

## Core Runtime & Language

- **Runtime:** **Deno**. Chosen for its built-in security, modern tooling (linter, formatter, test runner), and first-class TypeScript support.
- **Language:** **TypeScript**. Enforced strictly across the entire codebase.
- **Error Handling:** **Result Pattern (`ts-results-es`)**. All functions that can fail must return a `Result<T, E>` or `AsyncResult<T, E>`. Use of `try-catch` blocks is discouraged in favor of explicit error propagation and functional handling.

## API & Communication

- **API Framework:** **tRPC**. Used for end-to-end type safety between the Deno backend and any consumers (internal or external).
- **Security:** **Dynamic API Key Management**. Database-backed registry with PQC-hardened hashing (**SHA3-512**) and key generation (**SHAKE256**). Includes in-memory TTL caching for high-performance validation.
- **External API:** **Eve Online ESI**. The primary data source.

## Data Persistence

- **Database:** **PostgreSQL**.
  - **Rationale:** Selected for its robust relational data modeling capabilities (essential for the complex Character -> Corp -> Alliance graph) and concurrent write handling.
- **ORM & Schema Management:** **Drizzle ORM**.
  - **Usage:** Used for schema definition, type-safe SQL query generation, and migrations.
  - **Constraint:** Data is structured into SQL tables upon ingestion. **JSONB is explicitly avoided** to ensure efficient indexing and querying.
- **Migrations:** Managed via **Drizzle Kit**.

## Infrastructure & Tooling

- **Environment Management:** **Nix (Flakes)**. Ensures a reproducible development environment for Deno, PostgreSQL, and other system dependencies.
- **Logging:** **Deno Standard Library (`std/log`)**. Implemented with custom formatters for OTel-ready JSON and human-readable "pretty" output, supporting structured attributes. Treats logs as event streams (stdout) per 12-Factor principles.
- **Testing:** **Deno built-in test runner**.
- **Linting/Formatting:** **Deno built-in linter and formatter**.

## Deployment & Architecture

- **Methodology:** **12-Factor App**. The application is designed to be stateless, configured via environment variables, and treat logs as event streams.
- **Containerization:** **OCI Ready**. Application artifacts and runtime behaviors are designed for execution within containerized environments (Docker/Podman) without modification.
