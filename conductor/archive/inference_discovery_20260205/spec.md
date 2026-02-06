# Specification: Inference-Based Discovery Engine

## Goal

Automate the population of the **Historical Ledger** by implementing a "Crawler" that infers and fetches related entities. This ensures that the system proactively discovers the social graph (Corporations, Alliances, CEOs, Founders) without requiring explicit user requests for every node.

## Core Logic

### 1. The Discovery Queue (`discovery_queue`)

A dedicated table to act as a buffer for entities that need to be fetched.

- **Deduplication:** The queue must handle duplicate requests gracefully (ignore if already pending).
- **Persistence:** Discovery tasks persist across restarts.
- **Priority:** Explicit support for differentiating "User Request" (High) vs "Discovery" (Background).

### 2. Recursive Extraction Rules

Whenever an entity is successfully resolved (whether from ESI or Cache), the system must inspect it and queue related entities.

#### A. Character (`extractFromCharacter`)
- **Corporation History:** Fetch `GET /characters/{id}/corporationhistory/`. Queue **ALL** past and present Corporation IDs.
- **Current Relations:** Queue the current `corporation_id` and `alliance_id`.

#### B. Corporation (`extractFromCorporation`)
- **Alliance History:** Fetch `GET /corporations/{id}/alliancehistory/`. Queue **ALL** past and present Alliance IDs.
- **Key People:** Queue `ceo_id` and `creator_id` (Founder).
- **Bio/Description:** Parse the description text. Extract all `showinfo` links that point to Characters, Corporations, or Alliances and queue them.

#### C. Alliance (`extractFromAlliance`)
- **Membership:** Fetch `GET /alliances/{id}/corporations/`. Queue **ALL** member Corporation IDs.
- **Leadership:** Queue `executor_corporation_id` and `creator_id`.
- **Bio/Description:** Parse the description text for `showinfo` links.

### 3. Bio Scraping (`BioParser`)

Implement a utility to parse EVE Online's specific HTML-like formatting.
- **Target:** `<a href="showinfo:typeID//itemID">...</a>`
- **Mapping:**
  - Type `1373` -> Character
  - Type `2` -> Corporation
  - Type `16159` -> Alliance
  - (Ignored others for now).

### 4. Background Worker

A non-blocking process that:
1.  Polls the `discovery_queue` for `pending` items.
2.  Executes the standard `getById` service call with `priority: 'background'`.
3.  Updates the queue status (`completed` or `failed`).
4.  Respects the **ESI Rate Limiter** (stops if the 'background' budget is exhausted).

## Architecture

- **Service Layer:** `api/src/services/discovery.ts` handles the extraction logic and queue management.
- **Integration:** The existing `Character`, `Corporation`, and `Alliance` services will call `DiscoveryService.analyze(...)` after a successful resolution.
- **Decoupling:** The actual "fetching" of queued items happens asynchronously to avoid slowing down the user's request.

## Database Schema

```sql
CREATE TABLE discovery_queue (
  entity_id INTEGER NOT NULL,
  entity_type VARCHAR(20) NOT NULL, -- 'character', 'corporation', 'alliance'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (entity_id, entity_type) -- Simple deduplication
);
```
