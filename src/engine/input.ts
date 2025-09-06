
export class Input
{
    static pressedList: Set<string>;
    static heldList: Set<string>;
    static releasedList: Set<string>;

    static mouseX: number;
    static mouseY: number;
    static mouseDown: boolean;
    static mouseClicked: boolean;

    // Received from UI
    static received_PressedList: Set<string>;
    static received_HeldList: Set<string>;
    static received_ReleasedList: Set<string>;

    static received_MouseX: number;
    static received_MouseY: number;
    static received_MouseDown: boolean;
    static received_MouseClicked: boolean;

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
        this.releasedList.clear();
        this.mouseClicked = false;
    }

    static AddKeyPressed()
    {

    }

    static AddKeyHeld()
    {
        
    }

    static AddKeyReleased()
    {
        
    }

    static GetKeyPressed()
    {

    }

    static GetKeyHeld()
    {
        
    }

    static GetKeyReleased()
    {
        
    }

    static GetMouseX()
    {

    }

    static GetMouseY()
    {
        
    }

    static SetMouseX()
    {
        
    }

    static SetMouseY()
    {

    }

    static IsMouseDown()
    {

    }

    static SetMouseDown()
    {

    }

    static IsMouseClicked()
    {

    }

    static SetMouseClicked()
    {

    }


}