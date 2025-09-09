import { eulerToQuat, getContext, quatToEuler, showError } from "../gl-utils";
import { EngineDemo } from "../projects/engine-demo";
import { Input } from "./input";
import { Project } from "./project";
import '../index.css'
import { TransformComponent } from "../components/transform-component";
import { quat, vec3 } from "gl-matrix";

 
export class LavaEngine
 {
    static canvas: HTMLCanvasElement | null;
    static gl_context: WebGL2RenderingContext;
    static canvasWidth: number;
    static canvasHeight: number;
    static project: Project;

    static ui_canvas: HTMLCanvasElement | null;
    static ui: CanvasRenderingContext2D | null;
    static isPointerLock: boolean;

    static fpsTarget: number;
    static deltaTime: number;
    static fpsHistory: number[] = [];
    static fps: number = 0;
    static frameTime: number = 0;

    static CreateEngineWindow()
    {
        this.canvas = document.getElementById('demo-canvas') as HTMLCanvasElement | null;
        this.ui_canvas = document.getElementById('ui-canvas')! as HTMLCanvasElement | null;
        this.ui = this.ui_canvas!.getContext("2d");
        if (!this.canvas || !(this.canvas instanceof HTMLCanvasElement))
        {
            showError('Cannot get demo-canvas reference - check for typos or loading script too early in HTML');
            return;
        }
        if (!this.ui_canvas || !this.ui) 
        {
            showError("Missing ui Context/canvas!");
            return;
        }

        this.gl_context = getContext(this.canvas);
        this.gl_context.pixelStorei(this.gl_context.UNPACK_FLIP_Y_WEBGL, true);
        this.canvasWidth = (this.canvas.clientWidth * devicePixelRatio) / 1;
        this.canvasHeight = (this.canvas.clientHeight * devicePixelRatio) / 1;
        this.fpsTarget = 240;

        this.ResizeCanvases();
        window.addEventListener("resize", () => LavaEngine.ResizeCanvases());
        this.canvas.addEventListener('click', () => {
            this.canvas?.requestPointerLock();
            this.isPointerLock = true;
        });
        
        this.StartEngine();
    }

    static StartEngine()
    {
        this.project = new EngineDemo(this.gl_context);
        this.project.Start();

        
        // ---- INPUT LISTENING ----
        Input.InitInputEvents();


        // ----- RENDER LOOP -------
        const frameDuration = 1000 / this.fpsTarget;
        LavaEngine.deltaTime = 0.0;
        let lastFrameTime = performance.now();

        const frame = function ()
        {
            const thisFrameTime = performance.now()
            const delta = thisFrameTime - lastFrameTime;

            if (delta >= frameDuration)
            {
                LavaEngine.deltaTime = delta / 1000;
                lastFrameTime = thisFrameTime;
                const currentFps = 1.0 / LavaEngine.deltaTime;
                LavaEngine.fpsHistory.push(currentFps);
                if (LavaEngine.fpsHistory.length > 60) {
                    LavaEngine.fpsHistory.shift();
                }
                LavaEngine.fps = LavaEngine.fpsHistory.reduce((a, b) => a + b, 0) / LavaEngine.fpsHistory.length;
                LavaEngine.frameTime = 1000.0 / LavaEngine.fps;


                // --- UPDATE LOGIC ---
                LavaEngine.DrawDebugui();
                
                LavaEngine.UpdateEngine();
                Input.ValidateInputs();

                LavaEngine.project.MAIN_SCENE.render(LavaEngine.canvas!.width, LavaEngine.canvas!.height);

            }

            
            requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    }

    static UpdateEngine()
    {
        this.project.Update();
    }

    // ---- ui LOGIC ----
    static DrawDebugui()
    {
        this.ui!.clearRect(0, 0, this.ui_canvas!.width, this.ui_canvas!.height);
        let playerTransform = this.project.MAIN_SCENE.getEntityByName("Player")!.getComponentOrThrow(TransformComponent)!.transform;

        this.ui!.font = "20px Quantico"; 
        this.ui!.fillStyle = "white";
        this.ui!.shadowColor = "rgba(0, 0, 0, 0.7)";
        this.ui!.shadowBlur = 6;
        this.ui!.shadowOffsetX = 3;
        this.ui!.shadowOffsetY = 3;
        this.ui!.fillText(`FPS: ${this.fps.toFixed(1)} (${this.frameTime.toFixed(1)} ms)`, 50, 50);
        this.ui!.fillText(`X: ${playerTransform.position[0].toFixed(2)} Y: ${playerTransform.position[1].toFixed(2)} Z: ${playerTransform.position[2].toFixed(2)}`, 50, 75);
        this.ui!.fillText(`RX: ${playerTransform.rotation[0].toFixed(2)} RY: ${playerTransform.rotation[1].toFixed(2)} RZ: ${playerTransform.rotation[2].toFixed(2)}`, 50, 100);
        const forward = playerTransform.GetForward();
        this.ui!.fillText(`VDX: ${forward[0].toFixed(2)} VDY: ${forward[1].toFixed(2)} VDZ: ${forward[2].toFixed(2)}`, 50, 125);
    }

    static ResizeCanvases()
    {
        this.canvas!.width = (this.canvas!.clientWidth * devicePixelRatio) / 1;
        this.canvas!.height = (this.canvas!.clientHeight * devicePixelRatio) / 1;
        this.ui_canvas!.width = this.ui_canvas!.clientWidth * devicePixelRatio;
        this.ui_canvas!.height = this.ui_canvas!.clientHeight * devicePixelRatio;
    }
}

try {
    LavaEngine.CreateEngineWindow();
} catch (e)
{
    showError('Unhandled JavaScript exception: ${e}');
}