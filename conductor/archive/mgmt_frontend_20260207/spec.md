# Specification: Management Frontend

## Overview
Implement a real-time management dashboard to provide observability into the discovery engine, ESI rate limits, and background worker health. The dashboard uses modern Web Standards (SSE, Web Components) to deliver a high-signal, responsive, zero-build monitoring experience.

## Functional Requirements
1.  **Unified Hono Server:**
    -   Migrate the existing `Deno.serve` logic to a Hono application.
    -   Mount the tRPC router at `/trpc`.
    -   Serve static assets (Lit components, theme) from `api/static/`.
2.  **Real-Time Event Stream (SSE):**
    -   Expose a `/api/events` endpoint in Hono.
    -   Bridge the internal `onDiscoveryEvent` bus to the SSE stream.
    -   Broadcast `queue_updated` and `*_extracted` events to the frontend.
3.  **Single-Page Dashboard Overview:**
    -   **Worker Pulse Widget:** Displays status and last heartbeat for all active workers.
    -   **ESI Budget Widget:** Real-time gauge of remaining error limit.
    -   **Queue Health Widget:** Visualizes discovery queue depth and processing throughput.
4.  **Token-Driven Styling:**
    -   Implement `theme.css` with CSS Custom Properties for a unified design language.
    -   Utilize Lit's scoped CSS for component-specific layouts.
5.  **Responsive Design (Mobile-First Foundation):**
    -   Ensure the dashboard layout adapts to smaller screens using CSS Grid.
    -   Widgets must stack vertically on mobile while expanding to a dense grid on desktop.

## Non-Functional Requirements
-   **No Build Step:** Use standard ES Modules and CDN imports to allow the frontend to run without transpilation.
-   **High Signal-to-Noise:** Minimize visual fluff; prioritize data density and accuracy.
-   **Reactive Updates:** Ensure the UI reflects system changes within < 500ms using SSE.

## Acceptance Criteria
-   The dashboard is accessible via the main server port.
-   Worker heartbeats update in real-time without page refreshes.
-   ESI budget gauge reflects current ESI headers correctly.
-   Layout is readable and functional on both mobile and desktop viewports using CSS Grid.
-   `deno test -A` and `deno lint` pass.
