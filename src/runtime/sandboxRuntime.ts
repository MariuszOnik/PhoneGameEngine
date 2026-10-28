export type LogLevel = "log" | "warn" | "error" | "info";

export interface LogEntry {
  level: LogLevel;
  text: string;
}

export interface SandboxHandle {
  stop(): void;
}

function escapeScriptClose(code: string): string {
  return code.replace(/<\/(script)/gi, "<\\/$1");
}

function buildSrcDoc(userSource: string): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  html, body { margin: 0; height: 100%; overflow: hidden; background: #000; }
  canvas { display: block; width: 100%; height: 100%; }
</style>
</head>
<body>
<canvas id="fc-canvas"></canvas>
<script>
(function () {
  const canvas = document.getElementById("fc-canvas");
  const ctx = canvas.getContext("2d");
  window.canvas = canvas;
  window.ctx = ctx;

  function resize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  function post(type, text) {
    parent.postMessage({ source: "fc-runtime", type: type, text: text }, "*");
  }

  ["log", "warn", "error", "info"].forEach(function (level) {
    const original = console[level] ? console[level].bind(console) : function () {};
    console[level] = function () {
      const text = Array.prototype.map
        .call(arguments, function (a) {
          if (typeof a === "string") return a;
          try {
            return JSON.stringify(a);
          } catch (e) {
            return String(a);
          }
        })
        .join(" ");
      post(level, text);
      original.apply(console, arguments);
    };
  });

  window.onerror = function (message, source, lineno) {
    post("error", String(message) + (lineno ? " (line " + lineno + ")" : ""));
    return true;
  };
})();
</script>
<script>
${escapeScriptClose(userSource)}
</script>
<script>
(function () {
  let last = null;
  let stopped = false;
  function frame(now) {
    if (stopped) return;
    if (last === null) last = now;
    const dt = (now - last) / 1000;
    last = now;
    try {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (typeof onUpdate === "function") onUpdate(dt);
    } catch (err) {
      console.error(err && err.message ? err.message : String(err));
      stopped = true;
      return;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
</script>
</body>
</html>`;
}

export function runInSandbox(container: HTMLElement, source: string, onLog: (entry: LogEntry) => void): SandboxHandle {
  container.innerHTML = "";

  const iframe = document.createElement("iframe");
  iframe.className = "run-sandbox-frame";
  iframe.setAttribute("sandbox", "allow-scripts");
  iframe.srcdoc = buildSrcDoc(source);
  container.appendChild(iframe);

  const onMessage = (event: MessageEvent): void => {
    if (event.source !== iframe.contentWindow) return;
    const data = event.data as { source?: string; type?: LogLevel; text?: string } | null;
    if (!data || data.source !== "fc-runtime" || !data.type || data.text === undefined) return;
    onLog({ level: data.type, text: data.text });
  };
  window.addEventListener("message", onMessage);

  return {
    stop(): void {
      window.removeEventListener("message", onMessage);
      iframe.remove();
    },
  };
}
