
export class Input
{
    static pressedList: Set<string> = new Set();
    static heldList: Set<string> = new Set();
    static releasedList: Set<string> = new Set();

    static mouseX: number;
    static mouseY: number;
    static mouseDown: boolean;
    static mouseClicked: boolean;

    // Received from UI
    static received_PressedList: Set<string> = new Set();
    static received_HeldList: Set<string> = new Set();
    static received_ReleasedList: Set<string> = new Set();

    static received_MouseX: number;
    static received_MouseY: number;
    static received_MouseDown: boolean;
    static received_MouseClicked: boolean;

    static InitInputEvents()
    {
        //Keys
        //document.addEventListener("keydown", (e) => this.AddKeyPressed(e.key.toLowerCase()));
        //document.addEventListener("keypress", (e) => this.AddKeyHeld(e.key.toLowerCase()));
        //document.addEventListener("keyup", (e) => this.AddKeyReleased(e.key.toLowerCase()));

        document.addEventListener("keydown", (e) => {
        const key = e.key.toLowerCase();
        if (!this.received_HeldList.has(key)) {
            this.received_PressedList.add(key); // pressed this frame
        }
        this.received_HeldList.add(key); // held down
        });

        document.addEventListener("keyup", (e) => {
            const key = e.key.toLowerCase();
            this.received_HeldList.delete(key);
            this.received_ReleasedList.add(key); // released this frame
        });

        //Mouse
        //document.addEventListener("keydown", (e) => this.AddKeyPressed(e.key.toLowerCase()));
        //document.addEventListener("keypress", (e) => this.AddKeyHeld(e.key.toLowerCase()));
        //document.addEventListener("keyup", (e) => this.AddKeyReleased(e.key.toLowerCase()));


    }

    // Call at Frame Start
    static ReceiveInputs(): void
    {
        // Pressed
        for (const s of this.received_PressedList)
        {
            this.pressedList.add(s);
        }

        for (const s of this.received_HeldList)
        {
            this.heldList.add(s);
        }

        for (const s of this.received_ReleasedList)
        {
            this.releasedList.add(s);
        }

        if (this.mouseX !== this.received_MouseX)
        {
            this.mouseX = this.received_MouseX;
        }

        if (this.mouseY !== this.received_MouseY)
        {
            this.mouseY = this.received_MouseY;
        }

        if (this.mouseDown !== this.received_MouseDown)
        {
            this.mouseDown = this.received_MouseDown;
        }

        if (this.mouseClicked !== this.received_MouseClicked)
        {
            this.mouseClicked = this.received_MouseClicked;
        }

        // Clearing Received
        this.received_PressedList.clear();
        this.received_ReleasedList.clear();
        this.received_MouseDown = false;
        this.received_MouseClicked = false;
    }

    // Call at Frame End
    static ValidateInputs(): void
    {
        this.pressedList.clear();
        this.mouseClicked = false;

        const toRemove = new Set<string>;
        for (const s of this.heldList)
        {
            if (this.releasedList.has(s)) toRemove.add(s);
        }

        for (const s of toRemove)
        {
            this.heldList.delete(s);
        }
        this.releasedList.clear();
    }

    static AddKeyPressed(s: string)
    {
        this.received_PressedList.add(s);
    }

    static AddKeyHeld(s: string)
    {
        this.received_HeldList.add(s);
    }

    static AddKeyReleased(s: string)
    {
        if (!this.received_ReleasedList.has(s))
        {
            this.received_ReleasedList.add(s);
            if (this.received_HeldList.has(s))
            {
                this.received_HeldList.delete(s);
            }
        }
    }

    static GetKeyPressed(s: string)
    {
        return this.received_PressedList.has(s);
    }

    static GetKeyHeld(s: string)
    {
        return this.received_HeldList.has(s);
    }

    static GetKeyReleased(s: string)
    {
        return this.received_ReleasedList.has(s);
    }

    static GetMouseX()
    {
        return this.mouseX;
    }

    static GetMouseY()
    {
        return this.mouseY;
    }

    static SetMouseX(mouseX: number)
    {
        this.received_MouseX = mouseX;
    }

    static SetMouseY(mouseY: number)
    {
        this.received_MouseY = mouseY;
    }

    static IsMouseDown()
    {
        return this.mouseDown;
    }

    static SetMouseDown(mousePressed: boolean)
    {   
        this.received_MouseDown = mousePressed;
    }

    static IsMouseClicked()
    {
        return this.mouseClicked;
    }

    static SetMouseClicked(mouseClicked: boolean)
    {
        this.received_MouseClicked = mouseClicked;
    }


}