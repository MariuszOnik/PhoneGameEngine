import "./virtualKeyboard.css";
import {
  insertAtCursor,
  deleteBackward,
  insertNewline,
  indentCursor,
  moveCursor,
  runUndo,
  runRedo,
  blurEditor,
} from "../editor/codeEditor";

const ROW_NUMBERS = "1234567890".split("");
const ROW_TOP = "qwertyuiop".split("");
const ROW_MID = "asdfghjkl".split("");
const ROW_BOTTOM = "zxcvbnm".split("");
const SYMBOL_KEYS = ["(", ")", "{", "}", "[", "]", ";", ":", "=", '"', "'", "_", "-", "+", "<", ">", "/", "!", "?", ",", "."];

let shiftActive = false;
const letterButtons: HTMLButtonElement[] = [];

function makeKey(label: string, className: string, onPress: () => void): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `vk-key ${className}`;
  btn.textContent = label;
  btn.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    onPress();
  });
  return btn;
}

function makeLetterKey(letter: string): HTMLButtonElement {
  const btn = makeKey(letter, "vk-key--letter", () => {
    insertAtCursor(shiftActive ? letter.toUpperCase() : letter);
  });
  letterButtons.push(btn);
  return btn;
}

function makeRow(keys: HTMLButtonElement[], className = "vk-row"): HTMLDivElement {
  const row = document.createElement("div");
  row.className = className;
  keys.forEach((key) => row.appendChild(key));
  return row;
}

function applyShiftState(): void {
  letterButtons.forEach((btn) => {
    const letter = btn.textContent?.toLowerCase() ?? "";
    btn.textContent = shiftActive ? letter.toUpperCase() : letter;
  });
}

export function mountVirtualKeyboard(root: HTMLElement): void {
  letterButtons.length = 0;
  root.innerHTML = "";

  const keyboard = document.createElement("div");
  keyboard.className = "vk";

  const numberRow = makeRow(ROW_NUMBERS.map((n) => makeKey(n, "vk-key--letter", () => insertAtCursor(n))));

  const topRow = makeRow(ROW_TOP.map(makeLetterKey));

  const midRow = makeRow(ROW_MID.map(makeLetterKey));

  const shiftKey = makeKey("Shift", "vk-key--control vk-key--shift", () => {
    shiftActive = !shiftActive;
    shiftKey.classList.toggle("is-active", shiftActive);
    applyShiftState();
  });
  const backspaceKey = makeKey("⌫", "vk-key--control", deleteBackward);
  const bottomRow = makeRow([shiftKey, ...ROW_BOTTOM.map(makeLetterKey), backspaceKey]);

  const symbolRow = makeRow(SYMBOL_KEYS.map((s) => makeKey(s, "vk-key--symbol", () => insertAtCursor(s))));

  const escKey = makeKey("Esc", "vk-key--control", blurEditor);
  const tabKey = makeKey("Tab", "vk-key--control", indentCursor);
  const leftKey = makeKey("←", "vk-key--control", () => moveCursor("left"));
  const upKey = makeKey("↑", "vk-key--control", () => moveCursor("up"));
  const downKey = makeKey("↓", "vk-key--control", () => moveCursor("down"));
  const rightKey = makeKey("→", "vk-key--control", () => moveCursor("right"));
  const undoKey = makeKey("Undo", "vk-key--control", runUndo);
  const redoKey = makeKey("Redo", "vk-key--control", runRedo);
  const controlRow = makeRow([escKey, tabKey, leftKey, upKey, downKey, rightKey, undoKey, redoKey]);

  const spaceKey = makeKey("Space", "vk-key--wide", () => insertAtCursor(" "));
  const enterKey = makeKey("Enter", "vk-key--wide", insertNewline);
  const actionRow = makeRow([spaceKey, enterKey]);

  keyboard.append(numberRow, topRow, midRow, bottomRow, symbolRow, controlRow, actionRow);
  root.appendChild(keyboard);
}
