# Specification: OCI Containerization

## Overview
Implement a production-grade containerization pipeline using Nix to produce a lean, distroless OCI image. The build process will be isolated and use granular Deno permissions to maintain a high security posture.

## Functional Requirements
1.  **Application Derivation:**
    -   Define a Nix derivation capturing: `api/src/`, `api/static/`, `deno.json`, and `deno.lock`.
2.  **OCI Image Generation:**
    -   Use `pkgs.dockerTools.buildLayeredImage` for `x86_64-linux`.
    -   Runtime Configuration: Set `Entrypoint` to `deno run` with granular permissions:
        -   `--allow-net`: For ESI API and Hono server.
        -   `--allow-env`: For config (DATABASE_URL, PORT, etc.).
        -   `--allow-read`: For static assets and source code.
3.  **Pipeline Isolation:**
    -   Definitions in `nix/build.nix` and `nix/docker.nix`.
4.  **Local Verification:**
    -   Utilize `podman` to load and run the generated image to ensure permissions are sufficient and the server bootstraps.

## Non-Functional Requirements
-   **Least Privilege:** No use of `-A` flag in the container entrypoint.
-   **Distroless:** Final image should contain only the Deno runtime, glibc/openssl, and the application.
-   **Reproducibility:** The build must be bit-for-bit reproducible via Nix.

## Acceptance Criteria
-   A Nix build command produces a valid OCI image archive.
-   The resulting image starts the Hono server correctly when run.
-   The management dashboard is served and functional within the container environment.
-   Local verification via `podman` passes.
