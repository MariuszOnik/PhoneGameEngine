import "./apiHelp.css";

interface ApiHelpSection {
  title: string;
  items: string[];
}

const API_SECTIONS: ApiHelpSection[] = [
  {
    title: "Lifecycle",
    items: ["function onUpdate(dt) { ... } — called every frame, dt = seconds since last frame"],
  },
  {
    title: "Globals",
    items: [
      "canvas — the HTMLCanvasElement, sized to fill the Run view",
      "ctx — CanvasRenderingContext2D bound to canvas (cleared automatically before each onUpdate)",
    ],
  },
  {
    title: "Canvas 2D cheatsheet",
    items: [
      "ctx.fillStyle = 'red'; ctx.fillRect(x, y, w, h)",
      "ctx.strokeStyle = 'white'; ctx.strokeRect(x, y, w, h)",
      "ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()",
      "ctx.fillText('text', x, y)",
      "ctx.drawImage(img, x, y)",
    ],
  },
  {
    title: "Node Graph",
    items: [
      "\"Node Graph\" tab — visual alternative to writing onUpdate by hand, compiles to the same code",
      "Tap the orange + button (or long-press empty canvas) to open the add-node menu; drag from a pin to wire two nodes",
      "\"Update\" is the required entry point — like Unity's Update(), it fires every frame (not just once at the start)",
      "White triangular pins are execution order; colored round pins are data (number/boolean/string)",
      "Avoid While/For loops that don't terminate within a frame — there's no separate game-loop node, \"Update\" firing each frame already is your game loop",
      "\"DeltaTime\" node outputs dt; \"FillRect\" node calls ctx.fillRect with its X/Y/Width/Height/Color inputs",
      "☰ button (top-left) opens the variable panel — create a variable there, then find \"Get\"/\"Set\" entries for it in the add-node menu",
      "▶ Run compiles whichever tab (Code or Node Graph) you last edited",
    ],
  },
  {
    title: "Console",
    items: [
      "console.log/warn/error(...) — output appears in the panel below the canvas",
      "avoid calling it every frame inside onUpdate (~60x/sec) — the panel only keeps the last 200 lines, but it's still noisy; log once or on specific events instead",
    ],
  },
];

let overlay: HTMLDivElement | null = null;

function buildOverlay(): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "api-help-overlay";

  const panel = document.createElement("div");
  panel.className = "api-help-panel";

  const header = document.createElement("div");
  header.className = "api-help-header";
  const title = document.createElement("span");
  title.textContent = "API cheatsheet";
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "api-help-close";
  closeBtn.textContent = "✕";
  closeBtn.addEventListener("click", hideApiHelp);
  header.append(title, closeBtn);

  const body = document.createElement("div");
  body.className = "api-help-body";
  API_SECTIONS.forEach((section) => {
    const heading = document.createElement("h3");
    heading.textContent = section.title;
    body.appendChild(heading);

    const list = document.createElement("ul");
    section.items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      list.appendChild(li);
    });
    body.appendChild(list);
  });

  panel.append(header, body);
  el.appendChild(panel);
  el.addEventListener("click", (event) => {
    if (event.target === el) hideApiHelp();
  });

  return el;
}

export function showApiHelp(): void {
  if (!overlay) {
    overlay = buildOverlay();
    document.body.appendChild(overlay);
  }
  overlay.classList.add("is-visible");
}

export function hideApiHelp(): void {
  overlay?.classList.remove("is-visible");
}
