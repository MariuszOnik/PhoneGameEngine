import "./codewire.css";
import { AppStage } from "./core/intiStage.js";
import { Delete } from "./core/delete.js";
import { Wiring } from "./core/Wiring.js";
import { ContextMenu } from "./core/contextMenu.js";
import { leftPanel } from "./core/LeftPanel.js";
import { VSToJS } from "./core/VisualScriptToJavascript.js";

export interface GraphEditorHandle {
  getSource(): { code: string; error: string | null };
}

const CONTEXT_MENU_ITEMS = [
  "Update",
  "FillRect",
  "DeltaTime",
  "Print",
  null,
  "If/Else",
  "WhileLoop",
  "ForLoop",
  "ForEachLoop",
  "Continue",
  "Break",
  null,
  "Add",
  "Subtract",
  "Multiply",
  "Divide",
  "Modulo",
  "Power",
  "Random",
  "Ceil",
  "Floor",
  "Max(Num)",
  "Min(Num)",
  null,
  "Swap",
  "Equals",
  "Not Equals",
  "Less",
  "LessEq",
  "Greater",
  "GreaterEq",
  null,
  "AND",
  "OR",
  "XOR",
  "NEG",
  null,
  "bAND",
  "bOR",
  "bXOR",
  "bNEG",
  null,
  "GetByName(JSON)",
  "StrToArray",
  "ArrayToStr",
  "Length",
  "Front",
  "Back",
  "GetByPos",
  "SetByPos",
  "Search",
  "BinarySearch(Num)",
  "PushBack",
  "PopBack",
  "PushFront",
  "PopFront",
  "Insert",
  "Sort(Num)",
  "isEmpty",
  "Reverse",
  "Max(Array)",
  "Min(Array)",
];

function buildContextMenuHtml(): string {
  return CONTEXT_MENU_ITEMS.map((item) => (item === null ? "<hr>" : `<div class="context-menu-items">${item}</div>`)).join("\n");
}

function buildShellHtml(): string {
  return `
    <div class="cw-root">
      <div id="cw-container"></div>

      <button type="button" class="cw-add-btn" id="cw-add-btn" title="Add node">+</button>
      <div class="slider-icon" id="slide-left-panel"><div>☰</div></div>

      <div id="left-panel" class="closed-left-panel">
        <div id="add-variables" class="left-panel-tab">Add Variable<span id="add-variables-plus-icon"></span></div>
        <div id="add-variables-content" class="left-panel-tab-content hidden">
          <div id="create-variables">
            <div class="input-group">
              <div class="icon2">Type</div>
              <select id="variable-data-type">
                <option value="Number" selected>Number</option>
                <option value="Boolean">Boolean</option>
                <option value="String">String</option>
                <option value="Array">Array</option>
              </select>
            </div>
            <div class="input-group">
              <div class="icon2">Name</div>
              <input type="text" placeholder="Name" id="variable-name">
            </div>
            <div class="input-group" id="number-default-form">
              <div class="icon2">Value</div>
              <input type="number" placeholder="Default" id="number-default-value" value="0">
            </div>
            <div class="input-group hidden" id="string-default-form">
              <div class="icon2">Value</div>
              <input type="text" placeholder="Default" id="string-default-value" value="hello">
            </div>
            <div class="input-group hidden" id="array-default-form">
              <div class="icon2">Value</div>
              <input type="text" placeholder="[1,2,3]" id="array-default-value" value="[]">
            </div>
            <div class="input-group hidden" id="bool-default-form">
              <div class="icon2">Value</div>
              <select id="bool-default-value">
                <option value="true" selected>True</option>
                <option value="false">False</option>
              </select>
            </div>
            <button type="button" id="create-btn">Create</button>
          </div>
        </div>
        <div id="list-of-variables" class="left-panel-tab">Variable List<span id="list-of-variables-down-icon"></span></div>
        <div id="list-of-variables-content" class="left-panel-tab-content hidden">
          <ul id="variable-list"></ul>
        </div>
      </div>

      <div id="delete-ctx-container" class="context-menu-items hidden">
        <div>Delete</div>
      </div>
      <div id="get-set-ctx-menu-container" class="hidden">
        <div id="get-set-ctx-menu">
          <div class="context-menu-items" data-isGetOrSet="Get">Get</div>
          <div class="context-menu-items" data-isGetOrSet="Set">Set</div>
        </div>
      </div>
      <div id="ctx-menu-container" class="hidden">
        <input type="text" id="ctx-search-bar" placeholder="Search nodes...">
        <div id="context-menu">${buildContextMenuHtml()}</div>
      </div>

      <input type="number" id="number-ip" class="ipn">
      <input type="text" id="string-ip" class="ips">
      <input type="text" id="array-ip" class="ips">
      <select id="bool-ip" class="ipb">
        <option value="true" selected>true</option>
        <option value="false">false</option>
      </select>
      <button type="button" id="value-editor-done" class="hidden">✓ Done</button>

      <div class="sidebox hidden" id="alert-box">
        <div class="sidebox-flex">
          <div></div>
          <button type="button" class="icon" id="alert-ok-btn">OK</button>
        </div>
      </div>
    </div>
  `;
}

export function mountMobileGraphEditor(container: HTMLElement): GraphEditorHandle {
  container.innerHTML = buildShellHtml();
  const root = container.querySelector<HTMLDivElement>(".cw-root")!;
  const canvasHost = root.querySelector<HTMLDivElement>("#cw-container")!;

  const stage: any = AppStage.getStage(canvasHost.clientWidth || container.clientWidth, canvasHost.clientHeight || container.clientHeight, "cw-container");
  const layer = new (window as any).Konva.Layer({ id: "main_layer" });
  const dragLayer = new (window as any).Konva.Layer({ id: "dragLayer" });
  stage.add(layer);
  stage.add(dragLayer);

  Delete.enableDelete(stage, layer);
  Wiring.enableWiring(stage, layer);
  ContextMenu.contextMenu(stage, layer);
  new leftPanel();
  layer.draw();

  // Dismissing the phone's own on-screen keyboard (back gesture/button) doesn't reliably fire a
  // DOM blur on the focused input — InputBox.js's only way to close its value editor, leaving it
  // stuck open. A visible, explicit confirm button sidesteps that platform quirk entirely, and
  // Enter is a convenience for keyboards that do send it through onkeydown.
  const doneBtn = root.querySelector<HTMLButtonElement>("#value-editor-done")!;
  doneBtn.addEventListener("click", () => {
    (document.activeElement as HTMLElement | null)?.blur();
  });
  (["number-ip", "string-ip", "array-ip"] as const).forEach((id) => {
    root.querySelector<HTMLInputElement>(`#${id}`)!.addEventListener("keydown", (keyEvent) => {
      if (keyEvent.key === "Enter") {
        keyEvent.preventDefault();
        (keyEvent.target as HTMLElement).blur();
      }
    });
  });

  // Reliable add-node entry point: fires the same 'contextmenu' handler ContextMenu.contextMenu
  // already listens for, without depending on long-press→contextmenu support (unreliable on iOS Safari).
  const addBtn = root.querySelector<HTMLButtonElement>("#cw-add-btn")!;
  addBtn.addEventListener("click", (clickEvent) => {
    // contextMenu.js installs a document-level click listener that closes the menu
    // whenever a click lands outside the stage/search bar — without stopping propagation
    // here, this button's own click would bubble to that listener and close the menu
    // it just opened, in the same tick.
    clickEvent.stopPropagation();
    const rect = canvasHost.getBoundingClientRect();
    stage.fire(
      "contextmenu",
      {
        target: stage,
        evt: {
          preventDefault() {},
          clientX: rect.left + rect.width / 2,
          clientY: rect.top + Math.min(80, rect.height / 3),
        },
      },
      true,
    );
  });

  const resize = (): void => {
    stage.width(canvasHost.clientWidth);
    stage.height(canvasHost.clientHeight);
    stage.draw();
  };
  new ResizeObserver(resize).observe(canvasHost);
  resize();

  return {
    getSource(): { code: string; error: string | null } {
      const compiled = new VSToJS(stage, layer, "code");
      return { code: compiled.script, error: compiled.error };
    },
  };
}
