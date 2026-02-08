# Implementation Plan: OCI Containerization

## Phase 1: Build Pipeline Scaffolding

- [x] Task: Create Build Derivations b53576a
  - [x] Create `nix/build.nix` to define the application source derivation.
  - [x] Create `nix/docker.nix` to define the OCI image using `dockerTools`.
- [x] Task: Define Granular Permissions 2796ba8
  - [x] Identify and document every environment variable and network host required for production.
  - [x] Configure the OCI `Entrypoint` with specific `--allow-*` flags.

## Phase 2: Image Production & Verification

- [x] Task: Build OCI Image 898c5ac
  - [x] Update `flake.nix` to add a `packages.container` output.
  - [x] Run `nix build .#container`.
- [x] Task: Verification via Podman 85b1460
  - [x] Load the image: `podman load < result`. (Confirmed via user sudo)
  - [x] Run the container with dummy environment variables.
  - [x] Verify HTTP connectivity and permission stability.

## Phase 3: Final Polishing

- [x] Task: Project audit 259493
  - [x] Run `deno check`.
  - [x] Run `deno lint`.
