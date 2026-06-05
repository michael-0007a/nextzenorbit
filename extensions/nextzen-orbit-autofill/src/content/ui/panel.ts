type PanelStatus = "idle" | "ready" | "working" | "error" | "unsupported";

export type PanelState = {
  status: PanelStatus;
  message: string;
  portal: string;
  fields: number;
  fieldNames: string[];
};

export type PanelActions = {
  onFill: () => void;
  onRefresh: () => void;
};

const PANEL_ID = "nextzen-autofill-panel";

export function renderAssistPanel(state: PanelState, actions: PanelActions) {
  let panel = document.getElementById(PANEL_ID);

  if (!panel) {
    panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.innerHTML = buildMarkup();
    document.body.appendChild(panel);
    injectStyles();
  }

  const portalEl = panel.querySelector("[data-portal]") as HTMLSpanElement;
  const messageEl = panel.querySelector("[data-message]") as HTMLParagraphElement;
  const fieldsEl = panel.querySelector("[data-fields]") as HTMLSpanElement;
  const fillButton = panel.querySelector("[data-fill]") as HTMLButtonElement;
  const refreshButton = panel.querySelector("[data-refresh]") as HTMLButtonElement;

  portalEl.textContent = state.portal;
  messageEl.textContent = state.message;
  fieldsEl.textContent = `${state.fields} fields`;

  const detailsEl = panel.querySelector("[data-details]") as HTMLDivElement;
  if (state.fieldNames.length > 0) {
    detailsEl.innerHTML = state.fieldNames.map(f => `<span class="nextzen-pill">${f}</span>`).join("");
    detailsEl.style.display = "flex";
  } else {
    detailsEl.style.display = "none";
  }

  fillButton.disabled = state.status !== "ready";

  fillButton.onclick = actions.onFill;
  refreshButton.onclick = actions.onRefresh;
}

function buildMarkup() {
  return `
    <div class="nextzen-panel">
      <div class="nextzen-panel__header">
        <strong>Nextzen Autofill</strong>
        <span data-portal class="nextzen-pill">Detecting</span>
      </div>
      <p data-message class="nextzen-panel__message">Scanning fields...</p>
      <div data-details class="nextzen-panel__details" style="display:none;"></div>
      <div class="nextzen-panel__footer">
        <span data-fields class="nextzen-pill">0 fields</span>
        <div class="nextzen-panel__actions">
          <button data-refresh type="button" class="nextzen-btn secondary">Refresh</button>
          <button data-fill type="button" class="nextzen-btn">Fill</button>
        </div>
      </div>
    </div>
  `;
}

function injectStyles() {
  if (document.getElementById("nextzen-autofill-style")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "nextzen-autofill-style";
  style.textContent = `
    #${PANEL_ID} {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      font-family: "Space Grotesk", "Segoe UI", system-ui, -apple-system, sans-serif;
    }
    .nextzen-panel {
      width: 280px;
      background: linear-gradient(150deg, #1a1e2c 0%, #0f111a 100%);
      color: #f5f7fa;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 14px;
      box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
    }
    .nextzen-panel__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 13px;
      margin-bottom: 8px;
    }
    .nextzen-panel__message {
      margin: 0 0 12px;
      font-size: 12px;
      color: #a7b0c0;
    }
    .nextzen-panel__details {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 12px;
    }
    .nextzen-panel__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .nextzen-panel__actions {
      display: flex;
      gap: 8px;
    }
    .nextzen-pill {
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 10px;
      color: #a7b0c0;
      background: rgba(255, 255, 255, 0.05);
    }
    .nextzen-btn {
      border: none;
      border-radius: 999px;
      padding: 6px 10px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      background: linear-gradient(135deg, #ff003d, #ff2b6a);
      color: white;
    }
    .nextzen-btn.secondary {
      background: #1b1f2b;
      color: #a7b0c0;
      border: 1px solid rgba(255, 255, 255, 0.12);
    }
    .nextzen-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `;
  document.head.appendChild(style);
}
