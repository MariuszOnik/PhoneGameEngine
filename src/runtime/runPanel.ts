import "./runPanel.css";
import { runInSandbox, type SandboxHandle, type LogEntry } from "./sandboxRuntime";

export interface RunPanel {
  run(source: string): void;
  stop(): void;
}

export function mountRunPanel(root: HTMLElement): RunPanel {
  root.innerHTML = `
    <div class="run-panel">
      <div class="run-canvas-host"></div>
      <div class="run-console"></div>
    </div>
  `;

  const canvasHost = root.querySelector<HTMLDivElement>(".run-canvas-host")!;
  const consoleEl = root.querySelector<HTMLDivElement>(".run-console")!;

  let handle: SandboxHandle | null = null;

  const appendLog = (entry: LogEntry): void => {
    const line = document.createElement("div");
    line.className = `run-console-line run-console-line--${entry.level}`;
    line.textContent = entry.text;
    consoleEl.appendChild(line);
    consoleEl.scrollTop = consoleEl.scrollHeight;
  };

  return {
    run(source: string): void {
      handle?.stop();
      consoleEl.innerHTML = "";
      handle = runInSandbox(canvasHost, source, appendLog);
    },
    stop(): void {
      handle?.stop();
      handle = null;
    },
  };
}
