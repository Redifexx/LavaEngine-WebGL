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
            if (e.key === 'Escape') // put this elsewhere plz
            {
                document.exitPointerLock();
                LavaEngine.isPointerLock = false;
            }
            const key = e.key.toLowerCase();
            if (!this.heldList.has(key)) {
                this.pressedList.add(key); // pressed this frame
                console.log("KEY PRESSED");

            }
            this.heldList.add(key); // held down
            console.log("KEY HELD");
        });

        document.addEventListener("keyup", (e) => {
            const key = e.key.toLowerCase();
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
                // accumulate deltas instead of replacing
                this.mouseMovementX += e.movementX;
                this.mouseMovementY += e.movementY;
            }
        });
    }

    // Call at Frame End
    static ValidateInputs(): void
    {
        this.pressedList.clear();
        this.releasedList.clear();
        this.mouseClicked = false;
        // Reset mouse movement each frame
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


}