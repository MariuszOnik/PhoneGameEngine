
export var InputBox = class{
    constructor(stage, layer, type, grp, position, colorMap, inputPin, iplabel, inputPinsPlaced, defValueContainer, defValueContainerForSave)
    {
        let rect = new Konva.Rect({
            width: 72,
            height: 28,
            stroke: colorMap['Text'],
            strokeWidth: 1,
        });
        this.focused = false;
        let text = new Konva.Text({
            text: '',
            fontSize: 14,
            fontFamily: 'Verdana',
            fill: colorMap['Text'],
            width: 72,
            height: 26,
            padding: 4,
        });
        this.inputBox = new Konva.Group();
        this.inputBox.add(rect);
        this.inputBox.add(text);
        this.inputBox.position(position);
        
        let htmlInputBox = null;
        let defaultValue = null;
        if(type == "Number")
        {
            defaultValue = defValueContainer.defValue;
            htmlInputBox = document.getElementById("number-ip");
        }
        else if(type == "Boolean")
        {
            defaultValue = defValueContainer.defValue;
            htmlInputBox = document.getElementById("bool-ip");
        }
        else if(type == "Array")
        {
            defaultValue = defValueContainer.defValue;
            htmlInputBox = document.getElementById("array-ip");
        }
        else 
        {
            // let x = 3;
            if(type == "String")
            {defaultValue = `${defValueContainer.defValue}`;}
            else
            {defaultValue = `${defValueContainer.defValue}`;}
            htmlInputBox = document.getElementById("string-ip");            
            // getComputedStyle(html)
        }
        text.text(defaultValue);
        layer.draw();
        const doneBtn = document.getElementById("value-editor-done");
        const openEditor = () => {
            this.focused = true;
            text.visible(false);
            layer.draw();
            htmlInputBox.value = text.text();
            let stageContainerBorderLeftWidth = parseInt(getComputedStyle(stage.getContainer()).borderLeftWidth);
            let stageContainerBorderTopWidth = parseInt(getComputedStyle(stage.getContainer()).borderTopWidth);
            htmlInputBox.style.left = stage.getContainer().getBoundingClientRect().x + stageContainerBorderLeftWidth + this.inputBox.getAbsolutePosition().x + "px";
            htmlInputBox.style.top = stage.getContainer().getBoundingClientRect().y + stageContainerBorderTopWidth + this.inputBox.getAbsolutePosition().y + "px";
            htmlInputBox.style.transform = `scale(${stage.scaleX()})`;
            htmlInputBox.style.display = "inline-block";
            htmlInputBox.focus();
            if (doneBtn) doneBtn.classList.toggle("hidden", false);
        };
        this.inputBox.on("click", openEditor);
        // Konva's "click"/"tap" are two entirely separate synthetic events (like touchstart vs
        // mousedown), and "tap" is additionally gated behind a global flag that's off by
        // default — rather than depend on that, just treat a touchend that lands on this shape
        // as a tap directly. Guard against the end of a wiring drag: Wiring.js's pin handlers
        // run on the same stage-level touchend, but this box isn't a 'pin', so there's no
        // overlap in practice, only a cleared src ever reaches here from a quick, real tap.
        this.inputBox.on("touchend", (e) => {
            if (e.evt.cancelable) e.evt.preventDefault();
            openEditor();
        });
        stage.on("wheel", () => {
            htmlInputBox.blur();
        });
        htmlInputBox.addEventListener("blur", () => {
            text.visible(true);
            layer.draw();
            htmlInputBox.value = '';
            htmlInputBox.style.display = "none";
            this.focused = false;
            if (doneBtn) doneBtn.classList.toggle("hidden", true);
        });
        htmlInputBox.addEventListener("input", () => {
            if(this.focused)
            {
                text.text(htmlInputBox.value);
                defValueContainerForSave.defValue = htmlInputBox.value;
            }
        });
        inputPin.on("wireconnected", (e) => {
            this.inputBox.visible(false);
            iplabel.position({ x: 28, y: 44 + 39 * inputPinsPlaced - 4 });    
        });
        inputPin.on("wireremoved", (e) => {
            if(e.isPinEmpty)
            {
                this.inputBox.visible(true);
                iplabel.position({ x: 28, y: 44 + 39 * inputPinsPlaced - 14 });    
            }
        });

        this.textBox = text;
        this.inputBox.on("mouseenter", (e) => {
            document.body.style.cursor = "text";
        });
        this.inputBox.on("mouseleave", (e) => {
            document.body.style.cursor = "default";
        });
        grp.add(this.inputBox);
    }
}