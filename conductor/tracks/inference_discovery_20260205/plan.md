# Implementation Plan - Inference-Based Discovery

## Phase 1: Infrastructure & Schema

- [x] Task: Database Schema
  - [x] Sub-task: Create migration for `discovery_queue` table
  - [x] Sub-task: Run migration
- [x] Task: ESI Client Expansion 611634b
  - [x] Sub-task: Add `getCharacterCorpHistory` to `api/src/clients/esi.ts`
  - [x] Sub-task: Add `getCorpAllianceHistory` to `api/src/clients/esi.ts`
  - [x] Sub-task: Add `getAllianceMembers` to `api/src/clients/esi.ts`
- [x] Task: Bio Parser Utility a810248
  - [x] Sub-task: Create `api/src/utils/bio_parser.ts` with regex logic for `showinfo` links
  - [x] Sub-task: Write unit tests for `BioParser`

## Phase 2: Discovery Service

- [x] Task: Discovery Service Core c0e75bf
  - [x] Sub-task: Create `api/src/services/discovery/` modules
  - [x] Sub-task: Implement `addToQueue` (with deduplication)
  - [x] Sub-task: Implement `processQueueItem` (consumer logic)
- [x] Task: Extraction Logic c0e75bf
  - [x] Sub-task: Implement `extractFromCharacter` (History + Relations)
  - [x] Sub-task: Implement `extractFromCorporation` (History + Key People + Bio)
  - [x] Sub-task: Implement `extractFromAlliance` (Members + Leadership + Bio)

## Phase 3: Integration

- [ ] Task: Service Hooks
  - [ ] Sub-task: Update `CharacterService.getById` to trigger discovery
  - [ ] Sub-task: Update `CorporationService.getById` to trigger discovery
  - [ ] Sub-task: Update `AllianceService.getById` to trigger discovery
- [ ] Task: Background Worker
  - [ ] Sub-task: Create a simple polling loop in `api/src/worker.ts` (or similar)
  - [ ] Sub-task: Integrate worker start into `api/src/main.ts` (non-blocking)

## Phase 4: Verification

- [ ] Task: Integration Testing
  - [ ] Sub-task: Verify that fetching a Character queues their Corp
  - [ ] Sub-task: Verify that the Worker processes the queue and populates the DB
  - [ ] Sub-task: Verify Bio scraping captures links
