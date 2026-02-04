# Technology Stack

## Core Runtime & Language
- **Runtime:** **Deno**. Chosen for its built-in security, modern tooling (linter, formatter, test runner), and first-class TypeScript support.
- **Language:** **TypeScript**. Enforced strictly across the entire codebase.

## API & Communication
- **API Framework:** **tRPC**. Used for end-to-end type safety between the Deno backend and any consumers (internal or external).
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
- **Testing:** **Deno built-in test runner**.
- **Linting/Formatting:** **Deno built-in linter and formatter**.