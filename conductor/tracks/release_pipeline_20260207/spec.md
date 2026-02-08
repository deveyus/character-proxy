# Release Pipeline Specification

## Context

The project `character-proxy` is now hosted on GitHub. To facilitate deployment and distribution, we need to automate the build and publication of OCI (Docker) images to the GitHub Container Registry (GHCR). This requires transitioning our local Nix build process to a CI-friendly approach and ensuring the application configuration is robust enough for production environments.

## Goals

1. **OCI Metadata:** Enrich the Docker image with standard OCI labels (source, description, licenses) to ensure proper presentation in the registry.
2. **CI-Optimized Build:** Convert the Nix Docker build to use `streamLayeredImage`. This avoids creating massive tarballs on disk, allowing the CI runner to stream layers directly to the registry, significantly improving performance.
3. **Automated Publishing:** Implement a GitHub Actions workflow that:
   - Installs Nix.
   - Builds the image.
   - Authenticates with GHCR.
   - Pushes the image (tagged `latest` and by commit SHA).
4. **Production Readiness:**
   - **DB Security:** Ensure the application correctly handles SSL connections for the database (typical for managed Postgres).
   - **Master Key:** Verify that the `MASTER_KEY` is strictly enforced for administrative endpoints to prevent data leaks in public deployments.

## Non-Goals

- Deploying the container to a specific runtime environment (e.g., Kubernetes, AWS ECS). We are only publishing the artifact.
- Setting up semantic versioning automation (release-plz/semantic-release) for this iteration; commit SHA tags are sufficient for now.
