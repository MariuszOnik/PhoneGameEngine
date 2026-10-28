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
- **Node-graph (visual scripting, styl Bolt/Blueprints):** LiteGraph.js — renderuje na Canvas 2D,
  lekki, dobre gesty touch, sprawdzony w produkcji (ComfyUI). Budowany **równolegle** z MVP
  edytora kodu (nie jako osobny późniejszy etap), jako alternatywny/dodatkowy panel, który
  kompiluje graf do JS/TS.
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
- [ ] **4b. Klawisz "Help" ze ściągą API** — przycisk na klawiaturze wirtualnej otwierający
      podgląd dostępnego API sandboxa (funkcje/obiekty z etapu 4). Aktualizować przy każdym
      etapie, który poszerza API (5. node-graph, 8. scene/object model), żeby ściąga nie
      wyszła z synchronizacji z tym, co faktycznie jest dostępne w skrypcie.
      Commit: `feat: API cheatsheet key`
- [ ] **5. Node-graph panel (LiteGraph.js)** — osadzenie LiteGraph jako alternatywnego panelu
      edycji, podstawowe własne typy węzłów (np. `onUpdate`, `moveSprite`, `ifCondition`),
      kompilator grafu → fragment JS/TS wstrzykiwany do runtime z etapu 4.
      Commit: `feat: node-graph editor with JS codegen`
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
