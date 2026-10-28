import "./splitLayout.css";
import { mountCodeEditor, getEditorSource } from "../editor/codeEditor";
import { mountVirtualKeyboard } from "../keyboard/virtualKeyboard";
import { mountRunPanel } from "../runtime/runPanel";
import { mountMobileGraphEditor } from "../nodegraph/codewire/mobileGraphEditor";

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
          <button type="button" class="pane-tab pane-tab--run" data-mode="run">▶ Run</button>
        </div>
        <div class="pane-content pane-content--editor" id="editor-pane-content">
          <div class="pane-view is-active" id="view-code"></div>
          <div class="pane-view" id="view-graph"></div>
          <div class="pane-view" id="view-run"></div>
        </div>
      </section>
      <div class="split-divider" id="split-divider" role="separator" aria-orientation="horizontal"></div>
      <section class="split-pane split-pane--bottom" id="keyboard-pane">
        <div class="pane-content pane-content--keyboard" id="keyboard-pane-content"></div>
      </section>
    </div>
  `;

  const shell = root.querySelector<HTMLDivElement>(".split-shell")!;
  const divider = root.querySelector<HTMLDivElement>("#split-divider")!;

  const applyRatio = (ratio: number): void => {
    shell.style.setProperty("--split-ratio", `${ratio * 100}%`);
  };

  applyRatio(loadRatio());

  const viewCode = root.querySelector<HTMLDivElement>("#view-code")!;
  mountCodeEditor(viewCode);

  const keyboardContent = root.querySelector<HTMLDivElement>("#keyboard-pane-content")!;
  mountVirtualKeyboard(keyboardContent);

  const viewGraph = root.querySelector<HTMLDivElement>("#view-graph")!;
  const viewRun = root.querySelector<HTMLDivElement>("#view-run")!;
  const runPanel = mountRunPanel(viewRun);
  const graphEditor = mountMobileGraphEditor(viewGraph);
  const views: Record<string, HTMLDivElement> = { code: viewCode, graph: viewGraph, run: viewRun };

  let lastEditMode: "code" | "graph" = "code";

  const tabs = root.querySelectorAll<HTMLButtonElement>(".pane-tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const mode = tab.dataset.mode ?? "code";
      tabs.forEach((t) => t.classList.toggle("is-active", t === tab));
      Object.entries(views).forEach(([key, view]) => view.classList.toggle("is-active", key === mode));
      if (mode === "code" || mode === "graph") {
        lastEditMode = mode;
      }
      shell.classList.toggle("keyboard-collapsed", mode === "graph");
      if (mode === "run") {
        if (lastEditMode === "graph") {
          const { code, error } = graphEditor.getSource();
          if (error) {
            runPanel.showError(error);
          } else {
            runPanel.run(code);
          }
        } else {
          runPanel.run(getEditorSource());
        }
      } else {
        runPanel.stop();
      }
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
