# Release Pipeline Plan

## Phase 1: OCI Image Configuration

- [x] **Configure OCI Labels:** Update `nix/docker.nix` to include `org.opencontainers.image` labels (source, description, licenses).
- [x] **Switch to Streamed Build:** Refactor `nix/docker.nix` to use `pkgs.dockerTools.streamLayeredImage` instead of `buildLayeredImage` (or ensure compatibility with streaming). _Note: `streamLayeredImage` produces a script, not a tarball, which requires a change in how we load/push._

## Phase 2: GitHub Actions Workflow

- [x] **Draft Workflow:** Create `.github/workflows/publish.yml` to define the CI pipeline.
  - [x] Install Nix (via `cachix/install-nix-action`).
  - [x] Authenticate to GHCR (`docker login`).
  - [x] Run the stream-to-registry command.
- [x] **Local Verification:** specific that the build command still works locally (or provide a local alias).

## Phase 3: Production Hardening

- [x] **Verify Master Key Enforcement:** Review `manage_keys.ts` or the tRPC context middleware to ensure `MASTER_KEY` is required for sensitive operations. Add a regression test if missing.
- [x] **Database SSL Config:** Review `api/src/db/client.ts`. Ensure `postgres.js` options allow/require SSL when `DATABASE_URL` specifies it (or via a separate env var if needed).

## Phase 4: Finalization

- [ ] **Documentation:** Update `README.md` to include badge/link to the container package.
- [ ] **Checkpoint:** Commit all changes and verify the Action runs successfully on GitHub.
