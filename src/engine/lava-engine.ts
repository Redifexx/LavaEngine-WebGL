import { getContext, showError } from "../gl-utils";
import { EngineDemo } from "../projects/engine-demo";
import { Input } from "./input";
import { Project } from "./project";
import '../index.css'

 
 export class LavaEngine
 {
    static CANVAS: HTMLCanvasElement | null;
    static GL_CONTEXT: WebGL2RenderingContext;
    static CANVAS_WIDTH: number;
    static CANVAS_HEIGHT: number;
    static CURRENT_PROJECT: Project;
    static TARGET_FPS: number;
    static DELTA_TIME: number;

    static CreateEngineWindow()
    {
        this.CANVAS = document.getElementById('demo-canvas') as HTMLCanvasElement | null;
        if (!this.CANVAS || !(this.CANVAS instanceof HTMLCanvasElement))
        {
            showError('Cannot get demo-canvas reference - check for typos or loading script too early in HTML');
            return;
        }

        this.GL_CONTEXT = getContext(this.CANVAS);
        this.CANVAS_WIDTH = (this.CANVAS.clientWidth * devicePixelRatio) / 1;
        this.CANVAS_HEIGHT = (this.CANVAS.clientHeight * devicePixelRatio) / 1;
        this.TARGET_FPS = 120;
        this.StartEngine();
    }

    static StartEngine()
    {
        this.CURRENT_PROJECT = new EngineDemo(this.GL_CONTEXT);
        this.CURRENT_PROJECT.Start();
        
        // ---- INPUT LISTENING ----
        Input.InitInputEvents();


        // ----- RENDER LOOP -------
        const frameDuration = 1000 / this.TARGET_FPS;
        LavaEngine.DELTA_TIME = 0.0;
        let lastFrameTime = performance.now();

        const frame = function ()
        {
            const thisFrameTime = performance.now()
            const delta = thisFrameTime - lastFrameTime;

            if (delta >= frameDuration)
            {
                LavaEngine.DELTA_TIME = delta / 1000;
                lastFrameTime = thisFrameTime;

                // --- UPDATE LOGIC ---
                Input.ReceiveInputs();
                LavaEngine.CANVAS!.width = (LavaEngine.CANVAS!.clientWidth * devicePixelRatio) / 1;
                LavaEngine.CANVAS!.height = (LavaEngine.CANVAS!.clientHeight * devicePixelRatio) / 1;
                
                LavaEngine.UpdateEngine();

                LavaEngine.CURRENT_PROJECT.MAIN_SCENE.render(LavaEngine.CANVAS!.width, LavaEngine.CANVAS!.height);

                Input.ValidateInputs();
            }
            requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    }

    static UpdateEngine()
    {
        this.CURRENT_PROJECT.Update();
    }

 }

try {
    LavaEngine.CreateEngineWindow();
} catch (e)
{
    showError('Unhandled JavaScript exception: ${e}');
}