import { css, html, LitElement } from 'lit';

// --- ESI Budget Component ---
class EsiBudget extends LitElement {
  static properties = {
    remain: { type: Number },
    reset: { type: Number },
    health: { type: String },
  };

  constructor() {
    super();
    this.remain = 100;
    this.reset = 60;
    this.health = 'up';
  }

  static styles = css`
    :host {
      display: block;
    }
    .gauge {
      height: 1.5rem;
      background: #334155;
      border-radius: 99px;
      overflow: hidden;
      margin: 1rem 0;
    }
    .fill {
      height: 100%;
      transition: width 0.5s ease, background-color 0.5s ease;
    }
    .status {
      font-weight: bold;
    }
    .up {
      color: var(--color-success);
    }
    .degraded {
      color: var(--color-warning);
    }
    .down {
      color: var(--color-error);
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.fetchData();

    // Listen for SSE events
    globalThis.addEventListener('sse-event', () => {
      this.fetchData();
    });
  }

  async fetchData() {
    try {
      const res = await fetch('/trpc/getSystemStatus');
      const json = await res.json();
      if (json.result?.data) {
        const { limiter } = json.result.data;
        this.remain = limiter.remain;
        this.reset = limiter.reset;
        this.health = limiter.health;
      }
    } catch (err) {
      console.error('Failed to fetch system status', err);
    }
  }

  render() {
    const percentage = Math.min(100, Math.max(0, this.remain));
    let color = 'var(--color-success)';
    if (this.remain < 50) color = 'var(--color-warning)';
    if (this.remain < 20) color = 'var(--color-error)';

    return html`
      <h2 class="card-title">ESI Error Budget</h2>
      <div class="status">Health: <span class="${this.health}">${this.health
        .toUpperCase()}</span></div>
      <div class="gauge">
        <div class="fill" style="width: ${percentage}%; background-color: ${color}"></div>
      </div>
      <div>${this.remain} / 100 remaining</div>
      <div style="font-size: 0.8rem; color: var(--color-text-muted)">Resets in ${this.reset}s</div>
    `;
  }
}
customElements.define('esi-budget', EsiBudget);

// --- Worker Status Component ---
class WorkerStatus extends LitElement {
  static properties = {
    workers: { type: Array },
  };

  constructor() {
    super();
    this.workers = [];
  }

  static styles = css`
    :host {
      display: block;
    }
    .worker {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid #334155;
    }
    .worker:last-child {
      border-bottom: none;
    }
    .pulse {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--color-success);
      display: inline-block;
      margin-right: 8px;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.fetchData();
    globalThis.addEventListener('sse-event', () => this.fetchData());
  }

  async fetchData() {
    try {
      const res = await fetch('/trpc/getSystemStatus');
      const json = await res.json();
      if (json.result?.data) {
        this.workers = json.result.data.workers;
      }
    } catch (err) {
      console.error('Failed to fetch workers', err);
    }
  }

  render() {
    return html`
      <h2 class="card-title">Worker Pulse</h2>
      ${this.workers.length === 0
        ? html`
          <p>No active workers found.</p>
        `
        : ''} ${this.workers.map((w) =>
          html`
            <div class="worker">
              <span><span class="pulse"></span>${w.key.replace(
                'heartbeat_worker_',
                'Worker #',
              )}</span>
              <span style="font-size: 0.8rem; color: var(--color-text-muted)">
                ${new Date(w.updatedAt).toLocaleTimeString()}
              </span>
            </div>
          `
        )}
    `;
  }
}
customElements.define('worker-status', WorkerStatus);

// --- Queue Monitor Component ---
class QueueMonitor extends LitElement {
  static properties = {
    depth: { type: Number },
    processed: { type: Number },
  };

  constructor() {
    super();
    this.depth = 0;
    this.processed = 0;
  }

  static styles = css`
    :host {
      display: block;
    }
    .stat {
      font-size: 2rem;
      font-weight: bold;
      color: var(--color-primary);
    }
    .label {
      font-size: 0.8rem;
      color: var(--color-text-muted);
      text-transform: uppercase;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.fetchData();
    globalThis.addEventListener('sse-event', () => this.fetchData());
  }

  async fetchData() {
    try {
      const res = await fetch('/trpc/getSystemStatus');
      const json = await res.json();
      if (json.result?.data) {
        this.depth = json.result.data.queueDepth;
        this.processed = json.result.data.metrics.discovery_queue_processed_total;
      }
    } catch (err) {
      console.error('Failed to fetch queue data', err);
    }
  }

  render() {
    return html`
      <h2 class="card-title">Discovery Queue</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div>
          <div class="stat">${this.depth}</div>
          <div class="label">Pending</div>
        </div>
        <div>
          <div class="stat">${this.processed}</div>
          <div class="label">Processed</div>
        </div>
      </div>
    `;
  }
}
customElements.define('queue-monitor', QueueMonitor);

// --- SSE Bootstrap ---
const eventSource = new EventSource('/api/events');
eventSource.onmessage = (event) => {
  globalThis.dispatchEvent(new CustomEvent('sse-event', { detail: event }));
};
eventSource.onerror = (err) => {
  console.error('SSE Error:', err);
};
