import { setLocationOfNode } from './setLocationOfNode.js'
import { Nodes } from './nodes.js'
import { variableList } from './variable.js'
import { deleteProgramNode, deleteWire } from './delete.js'

export var ContextMenu = {
    contextMenu: function (stage, layer) {
        let contextMenu = document.getElementById("ctx-menu-container");
        let deleteCtxMenu = document.getElementById("delete-ctx-container");
        let getSetCtxMenu = document.getElementById("get-set-ctx-menu-container");
        let searchBar = document.getElementById("ctx-search-bar");
        let draggedVariableInfo = {
            name: null,
            dataType: null,
        };
        // CodeWire's original offsets only ever pushed a popup up/left by a hardcoded guess, and
        // only when opened near the bottom/right edge of the STAGE, not the real viewport — easy
        // to miss on a phone, where the popup can be taller than the guess or open near the very
        // top of a small screen. Clamp against the real measured size and the real viewport instead.
        function clampToViewport(el, x, y) {
            el.style.left = x + 'px';
            el.style.top = y + 'px';
            const rect = el.getBoundingClientRect();
            const margin = 8;
            let clampedX = x;
            let clampedY = y;
            if (rect.right > window.innerWidth - margin) clampedX -= rect.right - (window.innerWidth - margin);
            if (rect.bottom > window.innerHeight - margin) clampedY -= rect.bottom - (window.innerHeight - margin);
            if (clampedX < margin) clampedX = margin;
            if (clampedY < margin) clampedY = margin;
            el.style.left = clampedX + 'px';
            el.style.top = clampedY + 'px';
        }
        function toggleContextMenu(location, show) {
            if (show) {
                contextMenu.classList.toggle("hidden", false);
                clampToViewport(contextMenu, location[0], location[1]);
                searchBar.focus();
            }
            else {
                contextMenu.classList.toggle("hidden", true);
                searchBar.value = '';
                for (let ctxItem of contextMenu.children[1].children) {
                    ctxItem.classList.toggle("hidden", false);
                }
            }
        }
        function toggleDeleteCtxMenu(location, show) {
            if (show) {
                deleteCtxMenu.classList.toggle("hidden", false);
                clampToViewport(deleteCtxMenu, location[0], location[1]);
            }
            else {
                deleteCtxMenu.classList.toggle("hidden", true);
            }
        }
        function toggleGetSetCtxMenu(location, show) {
            if (show) {
                getSetCtxMenu.classList.toggle("hidden", false);
                clampToViewport(getSetCtxMenu, location[0], location[1]);
            }
            else {
                getSetCtxMenu.classList.toggle("hidden", true);
            }
        }
        // Touch equivalent of the drop handler further down: sets the same draggedVariableInfo
        // the Get/Set popup's own click handler reads, then opens that popup directly instead
        // of waiting for a native HTML5 'drop' event that touch input can never produce.
        ContextMenu.openGetSetForVariable = function (location, name, dataType) {
            draggedVariableInfo = { name, dataType };
            toggleGetSetCtxMenu(location, true);
        };
        ContextMenu.addEventToCtxMenuItems = function (e) {
            e.addEventListener('click', function () {
                makeNode(e, stage, layer, toggleContextMenu);
            });
        }
        searchBar.addEventListener("input", (e) => {
            let key = e.target.value.toLowerCase();
            // /\bhe/gmi
            // let patt = /\b(key)/gi;
            // let patt = new RegExp(`${key}`, "gis");
            // console.log(patt);
            for (let ctxItem of contextMenu.children[1].children) {
                if (ctxItem.innerHTML.toString().toLowerCase().includes(key)) {
                    ctxItem.classList.toggle("hidden", false);
                }
                else {
                    ctxItem.classList.toggle("hidden", true);
                }
            }

        });




        for (let e of contextMenu.children[1].children) {
            this.addEventToCtxMenuItems(e);
        };

        // let alreadyPresent = [];   // to prevent adding multiple eventListeners
        stage.on('contextmenu', function (e) {
            e.evt.preventDefault();
            if (e.target === stage) {
                let availY = stage.getContainer().getBoundingClientRect().height - e.evt.clientY;
                let offY = 0, offX = 0;
                if (availY <= 260) {
                    offY = -260;
                }
                let availX = stage.getContainer().getBoundingClientRect().width - e.evt.clientX;
                if (availX <= 200) {
                    offX = -200;
                }
                toggleContextMenu([e.evt.clientX + offX, e.evt.clientY + offY], true);
            }
            else {

                toggleDeleteCtxMenu([e.evt.clientX - 130, e.evt.clientY - 35], true);
                // console.log("xx");
                deleteCtxMenu.onclick = function () {
                    // console.log("x");
                    // console.log(e);
                    if (e.target.getParent().name() == 'aProgramNodeGroup') {
                        deleteProgramNode(e, layer, stage);
                        stage.draw();
                    }
                    else if (e.target.name() == "isConnection") {
                        deleteWire(e.target);
                        stage.draw();
                    }
                    toggleDeleteCtxMenu([e.evt.clientX - 130, e.evt.clientY - 35], false);
                }
            };

        });
        stage.on('click', function (e) {
            toggleContextMenu([e.evt.clientX, e.evt.clientY], false);
            toggleDeleteCtxMenu([], false);
            toggleGetSetCtxMenu([], false);
        });
        document.addEventListener("click", (e) => {
            if (e.target !== stage.getContainer() && e.target !== searchBar)
                toggleContextMenu([0, 0], false);
            if (e.target !== stage.getContainer()) {
                toggleDeleteCtxMenu([], false);
                toggleGetSetCtxMenu([], false);
            }
        });

        getSetCtxMenu.addEventListener("click", (e) => {
            let nodeType = e.target.innerHTML + " " + draggedVariableInfo.name;
            let xx = e.target.parentElement.getBoundingClientRect().x - stage.getContainer().getBoundingClientRect().x;
            let yy = e.target.parentElement.getBoundingClientRect().y - stage.getContainer().getBoundingClientRect().y;
            if (e.target.innerHTML == "Get") {
                Nodes.CreateNode(nodeType, { x: xx, y: yy }, layer, stage, "Get", draggedVariableInfo.dataType, null);
            }
            else {
                Nodes.CreateNode(nodeType, { x: xx, y: yy }, layer, stage, "Set", draggedVariableInfo.dataType, null);
            }
        });


        stage.getContainer().addEventListener('dragenter', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
        stage.getContainer().addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
        stage.getContainer().addEventListener('drop', (e) => {
            e.preventDefault();
            if (e.dataTransfer.getData("variableName")) {
                toggleGetSetCtxMenu([e.clientX, e.clientY], true);
                draggedVariableInfo = {
                    name: e.dataTransfer.getData("variableName"),
                    dataType: e.dataTransfer.getData("dataType"),
                }
            }
            e.stopPropagation();
        });
    }
}



function makeNode(e, stage, layer, toggleContextMenu) {
    let xx = e.parentElement.getBoundingClientRect().x - stage.getContainer().getBoundingClientRect().x;
    let yy = e.parentElement.getBoundingClientRect().y - stage.getContainer().getBoundingClientRect().y;
    let node = undefined;
    let dataType;
    if (e.dataset.datatype)
        dataType = e.dataset.datatype;
    let tmp = e.innerHTML.split(" ");
    let isGetSet = "";
    if (tmp[0] == "Get")
        isGetSet = "Get";
    else if (tmp[0] == "Set")
        isGetSet = "Set";
    let defValue = null;
    // console.log(e.innerHTML);
    Nodes.CreateNode(e.innerHTML, { x: xx, y: yy }, layer, stage, isGetSet, dataType, defValue);
    layer.draw();
    toggleContextMenu([], false);
}
