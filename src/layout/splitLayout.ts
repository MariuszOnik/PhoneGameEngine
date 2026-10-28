import "./splitLayout.css";
import { mountCodeEditor } from "../editor/codeEditor";

const SPLIT_STORAGE_KEY = "fc:splitRatio";
const MIN_RATIO = 0.15;
const MAX_RATIO = 0.85;
const DEFAULT_RATIO = 0.5;

function loadRatio(): number {
  const raw = localStorage.getItem(SPLIT_STORAGE_KEY);
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? Math.min(MAX_RATIO, Math.max(MIN_RATIO, parsed)) : DEFAULT_RATIO;
}

export function mountSplitLayout(root: HTMLElement): void {
  root.innerHTML = `
    <div class="split-shell">
      <section class="split-pane split-pane--top" id="editor-pane">
        <div class="pane-tabs">
          <button type="button" class="pane-tab is-active" data-mode="code">Code</button>
          <button type="button" class="pane-tab" data-mode="graph">Node Graph</button>
        </div>
        <div class="pane-content pane-content--editor" id="editor-pane-content"></div>
      </section>
      <div class="split-divider" id="split-divider" role="separator" aria-orientation="horizontal"></div>
      <section class="split-pane split-pane--bottom" id="keyboard-pane">
        <div class="pane-content" id="keyboard-pane-content">
          <p class="pane-placeholder">Virtual keyboard placeholder</p>
        </div>
      </section>
    </div>
  `;

  const shell = root.querySelector<HTMLDivElement>(".split-shell")!;
  const divider = root.querySelector<HTMLDivElement>("#split-divider")!;

  const applyRatio = (ratio: number): void => {
    shell.style.setProperty("--split-ratio", `${ratio * 100}%`);
  };

  applyRatio(loadRatio());

  const editorContent = root.querySelector<HTMLDivElement>("#editor-pane-content")!;
  mountCodeEditor(editorContent);

  const tabs = root.querySelectorAll<HTMLButtonElement>(".pane-tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.toggle("is-active", t === tab));
    });
  });

  let dragging = false;

  const onPointerMove = (event: PointerEvent): void => {
    if (!dragging) return;
    const rect = shell.getBoundingClientRect();
    const ratio = (event.clientY - rect.top) / rect.height;
    const clamped = Math.min(MAX_RATIO, Math.max(MIN_RATIO, ratio));
    applyRatio(clamped);
  };

  const onPointerUp = (event: PointerEvent): void => {
    if (!dragging) return;
    dragging = false;
    divider.releasePointerCapture(event.pointerId);
    const rect = shell.getBoundingClientRect();
    const ratio = (event.clientY - rect.top) / rect.height;
    const clamped = Math.min(MAX_RATIO, Math.max(MIN_RATIO, ratio));
    localStorage.setItem(SPLIT_STORAGE_KEY, String(clamped));
  };

  divider.addEventListener("pointerdown", (event) => {
    dragging = true;
    divider.setPointerCapture(event.pointerId);
  });
  divider.addEventListener("pointermove", onPointerMove);
  divider.addEventListener("pointerup", onPointerUp);
  divider.addEventListener("pointercancel", onPointerUp);
}
