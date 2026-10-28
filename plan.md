# Fantasy Console — plan realizacji

## Jak wznowić pracę w nowym czacie
Ten plik jest źródłem prawdy o projekcie. Na starcie nowego czatu: przeczytaj ten plik,
sprawdź `git log --oneline` (który etap jest ostatnio zacommitowany) i kontynuuj od
pierwszego nieoznaczonego ✅ etapu w sekcji "Etapy i commity" poniżej.

## Decyzje architektoniczne (ustalone)
- **Repo / hosting:** GitHub repo `MariuszOnik/PhoneGameEngine`, publikowane przez GitHub Pages
  jako project site pod `https://mariuszonik.github.io/PhoneGameEngine/` (nie root user-site —
  to repo nie nazywa się `<user>.github.io`). Konsekwencja: w konfiguracji Vite trzeba ustawić
  `base: '/PhoneGameEngine/'`, inaczej zasoby (JS/CSS/manifest) się nie wczytają po deployu.
  Service worker scope też musi pokrywać się z tym base path.
- **Platforma:** czyste PWA działające w przeglądarce mobilnej (bez Capacitor/Tauri na start).
  Instalowalność przez manifest + service worker, projekty w IndexedDB.
- **Runtime gry:** własny, minimalny silnik 2D nad Canvas 2D (pętla gry, sprite, input).
  Brak gotowego silnika (Phaser) na start — pełna kontrola, bliżej ducha "fantasy console".
  Warstwa 3D/WebGL jako rozszerzenie później, nie blokuje MVP.
- **Edytor kodu:** CodeMirror 6 (dobre wsparcie mobile/touch, lekki, rozszerzalny).
- **Klawiatura:** własna wirtualna klawiatura (nie systemowa) — pełna kontrola nad layoutem,
  dotykiem i skrótami (nawiasy, tab, strzałki, undo).
- **Node-graph (visual scripting, styl Bolt/Blueprints):** ~~LiteGraph.js~~ **porzucone** — biblioteka
  ma w kodzie dosłowny komentarz „touch not in production and not ready", zero realnej obsługi
  dotyku. Zamiast tego: **fork `reference/CodeWire`** (MIT, silnik Konva.js) przeniesiony do
  `src/nodegraph/codewire/`, z łatkami pod dotyk (patrz Etap 5 niżej). Budowany **równolegle**
  z MVP edytora kodu, jako alternatywny/dodatkowy panel, który kompiluje graf do JS/TS.
- **Stos technologiczny:** Vite + TypeScript, zero ciężkiego frameworka UI (React/Vue) na start —
  mobile-first, minimalny narzut. Do rozważenia później, jeśli UI się rozrośnie.
- **Persystencja:** IndexedDB (projekty/skrypty jako "kartridże").

## Etapy i commity
Każdy etap = jeden lokalny commit po zweryfikowaniu, że działa (w miarę możliwości
przetestowane w przeglądarce na symulowanym viewport telefonu).

- [x] **0. Scaffold projektu** — `git init`, Vite + TS, struktura folderów
      (`src/editor`, `src/keyboard`, `src/runtime`, `src/nodegraph`, `src/scene`, `src/storage`).
      Commit: `chore: init project scaffold`
- [x] **1. Layout split-screen** — pionowy podział ekranu: góra = panel edytora
      (kod lub node-graph, przełączalny), dół = wirtualna klawiatura / panel dotykowy.
      Resizable divider, działa w orientacji portrait na mobile.
      Commit: `feat: vertical split layout shell`
- [x] **2. Edytor kodu (CodeMirror 6)** — integracja, podświetlanie JS/TS, własny theme.
      Commit: `feat: code editor pane`
- [x] **3. Własna klawiatura wirtualna** — wstawianie tekstu w pozycję kursora, klawisze
      specjalne (Tab, `{}()[]`, strzałki, Undo/Redo, Escape/zamknij).
      Commit: `feat: custom virtual keyboard`
- [x] **4. Runtime wykonania kodu** — przycisk "Run", sandbox (np. `Function`/iframe),
      minimalne API Canvas 2D udostępnione skryptowi, przechwytywanie błędów/console do UI.
      Commit: `feat: sandboxed canvas runtime`
- [x] **4b. Klawisz "Help" ze ściągą API** — przycisk na klawiaturze wirtualnej otwierający
      podgląd dostępnego API sandboxa (funkcje/obiekty z etapu 4). Aktualizować przy każdym
      etapie, który poszerza API (5. node-graph, 8. scene/object model), żeby ściąga nie
      wyszła z synchronizacji z tym, co faktycznie jest dostępne w skrypcie.
      Commit: `feat: API cheatsheet key`
- [ ] **5. Node-graph panel (fork CodeWire)** — **kod gotowy, NIEZACOMMITOWANY jeszcze**
      (`git status` czysty od commita `21ec52e` — całość poniżej leży w working tree).
      Przed commitem: ostatnia runda testów na telefonie (patrz niżej) i `git add`/`git commit`.

      **Co zrobione:**
      - Próba 1 (LiteGraph.js) porzucona — zero obsługi dotyku w bibliotece, patrz wyżej.
      - Fork `reference/CodeWire` → `src/nodegraph/codewire/core/*.js` (silnik: Nodes, Wiring,
        ContextMenu, Delete, InputBox, VisualScriptToJavascript, Variable, LeftPanel — plain JS,
        `allowJs`/`checkJs:false` dodane w `tsconfig.json` żeby `.ts` mogło je importować bez
        próby ich typowania). Wejście: `src/nodegraph/codewire/mobileGraphEditor.ts`,
        zamontowane w zakładce „Node Graph" z `splitLayout.ts`.
      - Konva.js wektorowany jako `public/vendor/konva.min.js`, ładowany classic `<script>` w
        `index.html` PRZED `main.ts` (UMD bundle — musi być `this === window` przy wykonaniu;
        jako ESM import tree-shake'uje się na śmierć). NIE jest zależnością npm.
      - Usunięte: CodeMirror 5, Bootstrap/FontAwesome z CDN (PWA ma działać offline — CDN-y by to
        zepsuły), SaveAndLoad/Export/Import (należy do Etapu 6 — persystencja).
      - Węzeł wejściowy przemianowany `Begin`→`Update` (pasuje do `Unity.Update()` — odpala się
        co klatkę przez istniejącą pętlę `requestAnimationFrame` w `sandboxRuntime.ts` z Etapu 4,
        NIE raz na starcie). Kompilator (`VisualScriptToJavascript.js`) generuje teraz
        `function onUpdate(dt) { ... }` zamiast surowego skryptu na `alert`/`console`.
      - Nowe typy węzłów: `FillRect` (statement, `ctx.fillRect`), `DeltaTime` (expression, `dt`).
        Z menu dodawania usunięte: Alert/Confirm/Prompt/OpenWindow/HttpRequest (nie pasują do
        sandboxowanego iframe'u z Etapu 4).
      - **Poprawki dotykowe** (CodeWire oryginalnie był czysto mysz-centryczny):
        pan/pinch-zoom (`intiStage.js`, własna maszyna stanów zamiast `stage.draggable()` — ten
        pierwszy był konfliktował z ręcznym pinch-zoom), łączenie przewodów (`Wiring.js` — było
        wyłącznie na `mousedown`/`mousemove`/`mouseup`, dotyk w ogóle nie trafiał do tej logiki),
        popupy (dodaj-węzeł/usuń/get-set) przycięte do widocznego ekranu (`contextMenu.js`),
        edycja wartości węzła przez `touchend` + jawny przycisk „Gotowe" (klawiatura telefonu nie
        zawsze odpala `blur` przy geście wstecz) (`InputBox.js`), Get/Set zmiennej przez tapnięcie
        zamiast HTML5 drag-and-drop (fizycznie niemożliwe na dotyku) (`variable.js`). Powtarzający
        się bug złapany 2×: listener `document.addEventListener("click", ...)` zamykający popupy
        zamykał je w tej samej klatce co otwarcie — trzeba `stopPropagation()` na elemencie, który
        popup otwiera.
      - Klawiatura wirtualna (z Etapu 3) chowa się w zakładce „Node Graph" (niepotrzebna, pola
        tekstowe grafu i tak odpalają natywną klawiaturę telefonu; zajmowała połowę ekranu).
      - `litegraph.js` odinstalowane z npm, `public/vendor/litegraph.*` usunięte.

      **Do zrobienia przed commitem:** końcowy test na telefonie całego przepływu (Update→FillRect
      wire→Run rysuje prostokąt), potem `git add`/`git commit -m "feat: node-graph editor with JS
      codegen"` (zgodnie z konwencją commitów etapów w tym pliku).
- [ ] **6. Persystencja projektów** — zapis/odczyt skryptów i grafów do IndexedDB,
      lista "kartridży", przełączanie między nimi.
      Commit: `feat: project persistence via IndexedDB`
- [ ] **7. PWA** — manifest, service worker, offline cache, "Add to Home Screen".
      Commit: `feat: PWA installability`
- [ ] **8. Scene/object model** — lista obiektów na scenie, każdy z własnym skryptem/grafem
      (jak MonoBehaviour w Unity), wybór obiektu ładuje jego kod do edytora z etapu 2/5.
      Commit: `feat: scene editor with per-object scripts`
- [ ] **9. Polish** — gesty touch (pan/zoom na canvasie gry i node-graph), obsługa błędów,
      przykładowa gra demo jako szablon startowy.
      Commit: `chore: polish and sample project`

## Otwarte pytania (do rozstrzygnięcia, jeszcze nie zaplanowane jako etap)
- **Wczytywanie grafiki** — jak obrazki/sprite'y trafiają do sandboksa gry (upload z telefonu?
  wbudowana biblioteka grafik? IndexedDB jako storage assetów?) i jak je eksponujemy w API
  skryptu (np. `loadImage()` / preload przed `Run`). Prawdopodobnie wiąże się z Etapem 6
  (persystencja), ale wymaga osobnej decyzji co do formatu i API.
- **Pakowanie gier jako paczek do wymiany z innymi graczami** — format eksportu całego projektu
  (kod/graf + assety) do jednego pliku, który inny użytkownik aplikacji może zaimportować i
  uruchomić u siebie. To coś więcej niż punkt "Eksport projektu" niżej (backup/sync między
  własnymi urządzeniami) — tu chodzi o wymianę międzyludzką, więc potrzebny format/kontener i
  sposób importu.

## Co dalej (poza zakresem MVP, do rozważenia później)
- Warstwa 3D (Three.js/Babylon) jako opcjonalny tryb renderowania.
- Eksport projektu do pliku / współdzielenie między urządzeniami.
- Wrapping natywny (Capacitor/Tauri), jeśli PWA okaże się niewystarczające
  (np. potrzeba prawdziwego dostępu do systemu plików).

---

## Historia / kontekst decyzji (oryginalna notatka)

moim marzenien jest programowac gry bezposrednio na telefonie. Chciałbym uzyc html i jego
canvas, (3d/2D). Najwiekszym marzeniem jest edytor kodu, ekran podzielony pionowej orientacji
na pół góra kod, dół własna wirtualna klawiatura. Takie fantasy console. Najwiekszym marzeniem
jest zrobienie cos uproszcoznego do sceny edytora gdzie kazdy obiekt mozna edytowac jego kod
(cosj jak monobehawior unity). BARDZO zalezy mi na mozliwosci pisania kodu jak unity(bolt) lub
unreal ale w js lub typescript.

Rozważane opcje node-graph: React Flow (HTML+SVG, ekosystem React), Rete.js (multi-framework,
własny engine przetwarzania), **LiteGraph.js (Canvas 2D, wybrany)**, html-graph (HTML+CSS, lekki).
