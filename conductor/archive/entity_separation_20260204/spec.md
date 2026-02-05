# Specification: Entity Type Separation & Architecture Refinement

## Goal

Refactor the data and service layers to eliminate polymorphic functions and `any` casts by creating dedicated, type-safe modules for each entity type (Character, Corporation, Alliance).

## Requirements

### 1. File Structure Refinement

Decompose the existing combined files into entity-specific modules:

**DB Layer:**

- `api/src/db/character.ts`
- `api/src/db/corporation.ts`
- `api/src/db/alliance.ts`

**Service Layer:**

- `api/src/services/character.ts`
- `api/src/services/corporation.ts`
- `api/src/services/alliance.ts`

### 2. Type-Safe DB Operations

Each entity DB module will implement:

- `resolveById(id)`: Returns the specific entity type (Static + latest Ephemeral).
- `resolveByName(name)`: Returns the specific entity type.
- `upsertStatic(values)`: Typed specifically to the entity's static table.
- `appendEphemeral(values)`: Typed specifically to the entity's ephemeral table.

**CRITICAL:** No `any` casts allowed. Drizzle's `$inferSelect` and `$inferInsert` must be used for strict typing.

### 3. Service Layer Refinement

Each entity service module will implement:

- `getById(id)`: The "Smart Cache" logic (Check DB -> ESI -> Update).
- `getByName(name)`: Coordination logic using the typed DB calls.

### 4. Integration

- Update `api/src/trpc/router.ts` to route requests to the appropriate specialized service.
- Update all existing tests to reflect the new structure.

## Standards

- **Strict Typing:** Zero `any` casts in the data or service layers.
- **Single Responsibility:** Each file handles exactly one entity type.
- **Functional Style:** Maintain the existing exported function pattern.
