import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection } from "@codemirror/view";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
  undo,
  redo,
  cursorCharLeft,
  cursorCharRight,
  cursorLineUp,
  cursorLineDown,
  deleteCharBackward,
  insertNewlineAndIndent,
  insertTab,
} from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { bracketMatching, indentOnInput, syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";

const EDITOR_STORAGE_KEY = "fc:editorSource";

const DEFAULT_SOURCE = `function onUpdate(dt) {
  // write your game logic here
}
`;

const fcHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: "#ff7ab2" },
  { tag: [tags.string, tags.special(tags.string)], color: "#9ece6a" },
  { tag: tags.comment, color: "#6a737d", fontStyle: "italic" },
  { tag: [tags.number, tags.bool, tags.null], color: "#ffb86c" },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: "#7dcfff" },
  { tag: tags.variableName, color: "#eee" },
  { tag: tags.propertyName, color: "#e0af68" },
  { tag: tags.operator, color: "#89ddff" },
  { tag: tags.punctuation, color: "#999" },
  { tag: tags.className, color: "#ffd580" },
]);

const fcEditorTheme = EditorView.theme(
  {
    "&": {
      height: "100%",
      fontSize: "0.85rem",
      backgroundColor: "#1a1a1a",
      color: "#eee",
    },
    ".cm-content": {
      fontFamily: "'SFMono-Regular', Consolas, Menlo, monospace",
      caretColor: "#fff",
      padding: "0.5rem 0",
    },
    ".cm-scroller": {
      overflow: "auto",
    },
    "&.cm-focused": {
      outline: "none",
    },
    ".cm-gutters": {
      backgroundColor: "#1a1a1a",
      color: "#555",
      border: "none",
    },
    ".cm-activeLine": {
      backgroundColor: "#242424",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "#242424",
    },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
      backgroundColor: "#2d4f67 !important",
    },
    ".cm-matchingBracket": {
      backgroundColor: "#3a3a3a",
      outline: "1px solid #666",
    },
  },
  { dark: true },
);

let view: EditorView | null = null;

function loadSource(): string {
  return localStorage.getItem(EDITOR_STORAGE_KEY) ?? DEFAULT_SOURCE;
}

export function mountCodeEditor(root: HTMLElement): EditorView {
  const state = EditorState.create({
    doc: loadSource(),
    extensions: [
      lineNumbers(),
      history(),
      indentOnInput(),
      bracketMatching(),
      highlightActiveLine(),
      drawSelection(),
      javascript({ typescript: true }),
      syntaxHighlighting(fcHighlightStyle),
      fcEditorTheme,
      // Suppress the OS soft keyboard — input comes from our own virtual keyboard instead.
      EditorView.contentAttributes.of({
        inputmode: "none",
        autocapitalize: "off",
        autocorrect: "off",
        spellcheck: "false",
      }),
      keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          localStorage.setItem(EDITOR_STORAGE_KEY, update.state.doc.toString());
        }
      }),
    ],
  });

  view = new EditorView({ state, parent: root });
  return view;
}

export function getEditorSource(): string {
  return view?.state.doc.toString() ?? "";
}

export function insertAtCursor(text: string): void {
  if (!view) return;
  const { from, to } = view.state.selection.main;
  view.dispatch({
    changes: { from, to, insert: text },
    selection: { anchor: from + text.length },
    scrollIntoView: true,
  });
}

export function deleteBackward(): void {
  if (!view) return;
  deleteCharBackward(view);
}

export function insertNewline(): void {
  if (!view) return;
  insertNewlineAndIndent(view);
}

export function indentCursor(): void {
  if (!view) return;
  insertTab(view);
}

export function moveCursor(direction: "left" | "right" | "up" | "down"): void {
  if (!view) return;
  const command =
    direction === "left"
      ? cursorCharLeft
      : direction === "right"
        ? cursorCharRight
        : direction === "up"
          ? cursorLineUp
          : cursorLineDown;
  command(view);
}

export function runUndo(): void {
  if (!view) return;
  undo(view);
}

export function runRedo(): void {
  if (!view) return;
  redo(view);
}

export function blurEditor(): void {
  view?.contentDOM.blur();
}
