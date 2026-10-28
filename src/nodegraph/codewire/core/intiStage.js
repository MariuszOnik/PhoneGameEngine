export var AppStage = {
    zoomScale: 1.05,
    shapeIsDragging: false,
    shapeTouchingDirection: [],    // can be array of 'top', 'bottom', 'left', 'right'
    getStage: function (width, height, container_name) {
        let stage = new Konva.Stage({
            container: container_name,
            width: width,
            height: height,
            draggable: false,
        });
        AppStage.zoomScale = 1.05;
        stage.on('wheel', (e) => {
            e.evt.preventDefault();
            var oldScale = stage.scaleX();
            var pointer = stage.getPointerPosition();

            var mousePointTo = {
                x: (pointer.x - stage.x()) / oldScale,
                y: (pointer.y - stage.y()) / oldScale,
            };
            var newScale = oldScale;
            var checkScale = e.evt.deltaY > 0 ? oldScale / AppStage.zoomScale : oldScale * AppStage.zoomScale;
            if (checkScale > 0.175 && checkScale < 1.6) {
                newScale = checkScale;
            }
            // console.log(stage.x() + pointer.x + " " + stage.y() + pointer.y)
            stage.scale({ x: newScale, y: newScale });

            var newPos = {
                x: pointer.x - mousePointTo.x * newScale,
                y: pointer.y - mousePointTo.y * newScale,
            };
            stage.container().style.backgroundSize = `${stage.scaleX() * 10}rem ${stage.scaleY() * 10}rem`;
            stage.position(newPos);
            stage.batchDraw();
            stage.container().style.backgroundPosition = `${stage.position().x}px ${stage.position().y}px`;
            // console.log(stage.scaleX());
        });
        stage.container().tabIndex = 1;
        stage.container().focus();

        stage.on('mousedown', function (e) {
            if (e.target === stage && (e.evt.button == 0 || e.evt.button == 1)) {
                stage.draggable(true);
            }
        });
        stage.on('mouseup', function (e) {
            if (e.evt.button == 0 || e.evt.button == 1) {
                stage.draggable(false);
            }
        });
        stage.on('dragmove', (e) => {
            if (e.target == stage) {
                stage.container().style.backgroundPosition = `${stage.position().x}px ${stage.position().y}px`;
            }
        })

        // Touch pan/pinch-zoom, handled entirely by hand (not via stage.draggable(true)).
        // First attempt toggled Konva's own draggable flag for 1-finger touches, which raced
        // with this code's own position-setting the moment a 2nd finger landed mid-gesture —
        // Konva's internal drag tracking and this pinch math fought over stage.position() on
        // the same frame, which is exactly the "reacts weirdly / not every time" symptom.
        // Keeping every touch gesture in one state machine, computed from a fixed snapshot
        // taken at the start of each gesture (not incrementally frame-to-frame), avoids both
        // problems: no competing writers, and no drift from chaining relative deltas.
        function touchDistance(p1, p2) {
            return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        }
        function touchCenter(p1, p2) {
            return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
        }
        function touchPoint(touch, rect) {
            return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
        }

        let activePan = null;
        let activePinch = null;

        function beginTouchGesture(e) {
            if (e.target !== stage) return;
            const touches = e.evt.touches;
            const rect = stage.container().getBoundingClientRect();
            if (touches.length === 1) {
                const p = touchPoint(touches[0], rect);
                activePinch = null;
                activePan = { startX: p.x, startY: p.y, stageStartX: stage.x(), stageStartY: stage.y() };
            } else if (touches.length === 2) {
                const p1 = touchPoint(touches[0], rect);
                const p2 = touchPoint(touches[1], rect);
                activePan = null;
                activePinch = {
                    startDist: touchDistance(p1, p2),
                    startCenter: touchCenter(p1, p2),
                    startScale: stage.scaleX(),
                    startStageX: stage.x(),
                    startStageY: stage.y(),
                };
            }
        }

        function endTouchGesture() {
            // Any change in finger count (lift one, add one) ends the current gesture cleanly;
            // a fresh touchstart will start the next one. Re-basing mid-gesture instead of
            // ending it is what caused the occasional jump.
            activePan = null;
            activePinch = null;
        }

        stage.on('touchstart', beginTouchGesture);
        stage.on('touchend', endTouchGesture);
        // Konva doesn't forward touchcancel through its own event system (only touchstart/
        // move/end), so this one needs a plain DOM listener instead of stage.on(...).
        stage.container().addEventListener('touchcancel', endTouchGesture);

        stage.on('touchmove', function (e) {
            const touches = e.evt.touches;
            const rect = stage.container().getBoundingClientRect();

            if (activePinch && touches.length >= 2) {
                e.evt.preventDefault();
                const p1 = touchPoint(touches[0], rect);
                const p2 = touchPoint(touches[1], rect);
                const dist = touchDistance(p1, p2);
                const center = touchCenter(p1, p2);
                const pointTo = {
                    x: (activePinch.startCenter.x - activePinch.startStageX) / activePinch.startScale,
                    y: (activePinch.startCenter.y - activePinch.startStageY) / activePinch.startScale,
                };
                const rawScale = activePinch.startScale * (dist / activePinch.startDist);
                const newScale = Math.max(0.175, Math.min(1.6, rawScale));
                const dx = center.x - activePinch.startCenter.x;
                const dy = center.y - activePinch.startCenter.y;
                const newPos = {
                    x: center.x - pointTo.x * newScale + dx,
                    y: center.y - pointTo.y * newScale + dy,
                };
                stage.scale({ x: newScale, y: newScale });
                stage.position(newPos);
                stage.container().style.backgroundSize = `${newScale * 10}rem ${newScale * 10}rem`;
                stage.container().style.backgroundPosition = `${newPos.x}px ${newPos.y}px`;
                stage.batchDraw();
            } else if (activePan && touches.length === 1) {
                e.evt.preventDefault();
                const p = touchPoint(touches[0], rect);
                const newPos = {
                    x: activePan.stageStartX + (p.x - activePan.startX),
                    y: activePan.stageStartY + (p.y - activePan.startY),
                };
                stage.position(newPos);
                stage.container().style.backgroundPosition = `${newPos.x}px ${newPos.y}px`;
                stage.batchDraw();
            }
        });
        // Resize is handled by a ResizeObserver on the container in mobileGraphEditor.ts instead —
        // it reacts to the pane actually changing size (divider drag, tab switch), not just
        // window-level resize, and doesn't depend on the id this stage happens to be mounted under.
        return stage;
    }
}