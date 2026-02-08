# Implementation Plan: OCI Containerization

## Phase 1: Build Pipeline Scaffolding
- [x] Task: Create Build Derivations b53576a
    - [x] Create `nix/build.nix` to define the application source derivation.
    - [x] Create `nix/docker.nix` to define the OCI image using `dockerTools`.
- [ ] Task: Define Granular Permissions
    - [ ] Identify and document every environment variable and network host required for production.
    - [ ] Configure the OCI `Entrypoint` with specific `--allow-*` flags.

## Phase 2: Image Production & Verification
- [ ] Task: Build OCI Image
    - [ ] Update `flake.nix` to add a `packages.container` output.
    - [ ] Run `nix build .#container`.
- [ ] Task: Verification via Podman
    - [ ] Load the image: `podman load < result`.
    - [ ] Run the container with dummy environment variables.
    - [ ] Verify HTTP connectivity and permission stability.

## Phase 3: Final Polishing
- [ ] Task: Project audit
    - [ ] Run `deno check`.
    - [ ] Run `deno lint`.
