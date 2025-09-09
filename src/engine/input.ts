import { LavaEngine } from "./lava-engine";

export class Input
{
    static pressedList: Set<string> = new Set();
    static heldList: Set<string> = new Set();
    static releasedList: Set<string> = new Set();

    static mouseX: number;
    static mouseY: number;
    static mouseMovementX: number;
    static mouseMovementY: number;
    static mouseDown: boolean;
    static mouseClicked: boolean;

    static InitInputEvents()
    {
        //Keys
        //document.addEventListener("keydown", (e) => this.AddKeyPressed(e.key.toLowerCase()));
        //document.addEventListener("keypress", (e) => this.AddKeyHeld(e.key.toLowerCase()));
        //document.addEventListener("keyup", (e) => this.AddKeyReleased(e.key.toLowerCase()));

        document.addEventListener("keydown", (e) => {
            const key = this.NormalizeKey(e);
            if (key === "escape") return;
            if (key === "space") e.preventDefault();
            if (!this.heldList.has(key)) {
                this.pressedList.add(key); // pressed this frame

            }
            this.heldList.add(key); // held down
        });

        document.addEventListener("keyup", (e) => {
            const key = this.NormalizeKey(e);
            this.heldList.delete(key);
            this.releasedList.add(key); // released this frame
        });

        //Mouse
        document.addEventListener("mousedown", () => this.mouseDown = true);
        document.addEventListener("mouseup", () => this.mouseDown = false);
        document.addEventListener("mousemove", (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            if (document.pointerLockElement === LavaEngine.canvas) {
                this.mouseMovementX += e.movementX;
                this.mouseMovementY += e.movementY;
            }
        });

        document.addEventListener('wheel', function(event: WheelEvent)
        {
            if (document.pointerLockElement === LavaEngine.canvas)
            {
                event.preventDefault();
            }
        }, { passive: false });

        document.addEventListener("pointerlockchange", () => {
            if (document.pointerLockElement === LavaEngine.canvas) {
                LavaEngine.isPointerLock = true;
            } else {
                LavaEngine.isPointerLock = false;
            }
        });

    }

    static ValidateInputs(): void
    {
        this.pressedList.clear();
        this.releasedList.clear();
        this.mouseClicked = false;
        this.mouseMovementX = 0;
        this.mouseMovementY = 0;
    }


    static GetKeyPressed(s: string)
    {
        return this.pressedList.has(s);
    }

    static GetKeyHeld(s: string)
    {
        return this.heldList.has(s);
    }

    static GetKeyReleased(s: string)
    {
        return this.releasedList.has(s);
    }

    static GetMouseX()
    {
        return this.mouseX;
    }

    static GetMouseY()
    {
        return this.mouseY;
    }

    static GetMouseMovementX()
    {
        return this.mouseMovementX;
    }

    static GetMouseMovementY()
    {
        return this.mouseMovementY;
    }

    static SetMouseX(mouseX: number)
    {
        this.mouseX = mouseX;
    }

    static SetMouseY(mouseY: number)
    {
        this.mouseY = mouseY;
    }

    static IsMouseDown()
    {
        return this.mouseDown;
    }

    static SetMouseDown(mousePressed: boolean)
    {   
        this.mouseDown = mousePressed;
    }

    static IsMouseClicked()
    {
        return this.mouseClicked;
    }

    static SetMouseClicked(mouseClicked: boolean)
    {
        this.mouseClicked = mouseClicked;
    }

    //helper
    static NormalizeKey(e: KeyboardEvent): string
    {
        if (e.code.startsWith("Key"))
        {
            return e.key.toLowerCase();
        }
        return e.code.toLowerCase();
    }
}