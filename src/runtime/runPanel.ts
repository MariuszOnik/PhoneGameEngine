import "./runPanel.css";
import { runInSandbox, type SandboxHandle, type LogEntry } from "./sandboxRuntime";

export interface RunPanel {
  run(source: string): void;
  stop(): void;
  showError(message: string): void;
}

const MAX_LOG_LINES = 200;

export function mountRunPanel(root: HTMLElement): RunPanel {
  root.innerHTML = `
    <div class="run-panel">
      <div class="run-toolbar">
        <button type="button" class="run-stop-btn" disabled>⏹ Stop</button>
      </div>
      <div class="run-canvas-host"></div>
      <div class="run-console"></div>
    </div>
  `;

  const stopBtn = root.querySelector<HTMLButtonElement>(".run-stop-btn")!;
  const canvasHost = root.querySelector<HTMLDivElement>(".run-canvas-host")!;
  const consoleEl = root.querySelector<HTMLDivElement>(".run-console")!;

  let handle: SandboxHandle | null = null;

  const appendLog = (entry: LogEntry): void => {
    const line = document.createElement("div");
    line.className = `run-console-line run-console-line--${entry.level}`;
    line.textContent = entry.text;
    consoleEl.appendChild(line);
    while (consoleEl.childElementCount > MAX_LOG_LINES) {
      consoleEl.removeChild(consoleEl.firstElementChild!);
    }
    consoleEl.scrollTop = consoleEl.scrollHeight;
  };

  const stopSandbox = (): void => {
    if (!handle) return;
    handle.stop();
    handle = null;
    stopBtn.disabled = true;
    appendLog({ level: "info", text: "⏹ Stopped" });
  };

  stopBtn.addEventListener("click", stopSandbox);

  return {
    run(source: string): void {
      handle?.stop();
      consoleEl.innerHTML = "";
      handle = runInSandbox(canvasHost, source, appendLog);
      stopBtn.disabled = false;
    },
    stop(): void {
      handle?.stop();
      handle = null;
      stopBtn.disabled = true;
    },
    showError(message: string): void {
      handle?.stop();
      handle = null;
      stopBtn.disabled = true;
      consoleEl.innerHTML = "";
      appendLog({ level: "error", text: message });
    },
  };
}
