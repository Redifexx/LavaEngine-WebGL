import { allocateRenderBufferStorage, attachRenderBufferToFrameBuffer, createFrameBuffer, createRenderBuffer, eulerToQuat, getContext, quatToEuler, setFrameBufferColorAttachment, showError } from "../gl-utils";
import { EngineDemo } from "../projects/engine-demo";
import { Input } from "./input";
import { Project } from "./project";
import '../index.css'
import { TransformComponent } from "../components/transform-component";
import { quat, vec2, vec3 } from "gl-matrix";
import { Audio } from 'ts-audio';
import { Mesh } from "../datatypes/mesh";
import { quadVertices } from "../geometry";
import { Shader } from "../datatypes/shader";
import { screenTextureVertSdrSourceCode } from "../../shaders/screenTexture/screenTexture.vert";
import { screenTextureFragSdrSourceCode } from "../../shaders/screenTexture/screenTexture.frag";

 
export class LavaEngine
 {
    static canvas: HTMLCanvasElement | null;
    static gl_context: WebGL2RenderingContext;
    static canvasWidth: number;
    static canvasHeight: number;
    static internalWidth: number;
    static internalHeight: number;
    static internalResolutionScale: number = 1.0;
    static project: Project;

    static ui_canvas: HTMLCanvasElement | null;
    static ui: CanvasRenderingContext2D | null;
    static isPointerLock: boolean;

    static fpsTarget: number;
    static deltaTime: number;
    static fpsHistory: number[] = [];
    static fps: number = 0;
    static frameTime: number = 0;

    static screenFramebuffer: WebGLFramebuffer | null;
    static screenRenderbuffer: WebGLRenderbuffer | null;
    static screenQuad: Mesh | null;
    static screenShader: Shader | null;
    static screenTexture: WebGLTexture | null;

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
        const ext = this.gl_context.getExtension("EXT_sRGB");
        if (!ext) {
            console.warn("EXT_sRGB not supported, falling back to RGBA");
        }

        this.internalResolutionScale = 1.0;
        this.canvasWidth = (this.canvas.clientWidth * devicePixelRatio) / 1;
        this.canvasHeight = (this.canvas.clientHeight * devicePixelRatio) / 1;
        this.internalWidth = this.canvasWidth * this.internalResolutionScale;
        this.internalHeight = this.canvasHeight * this.internalResolutionScale;
        this.fpsTarget = 240;

        this.ResizeCanvases();

        // Audio
        const audio = Audio({
            file: '../../audio/music/gates.mp3',
            volume: 0.03,
            loop: true,
            preload: true
        });

        window.addEventListener("resize", () => LavaEngine.ResizeCanvases());
        this.canvas.addEventListener('click', () => {
            audio.play();
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


        // ---- FRAME / RENDER BUFFERS FOR SCREEN QUAD ----
        this.screenFramebuffer = createFrameBuffer(this.gl_context);
        this.ResizeFramebuffer();

        LavaEngine.screenQuad = new Mesh(this.gl_context, quadVertices);
        LavaEngine.screenShader = new Shader(this.gl_context, screenTextureVertSdrSourceCode, screenTextureFragSdrSourceCode);


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
                
                LavaEngine.project.MAIN_SCENE.render(LavaEngine.internalWidth, LavaEngine.internalHeight);
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
        const pixelWidth = Math.floor(this.canvas!.clientWidth * devicePixelRatio);
        const pixelHeight = Math.floor(this.canvas!.clientHeight * devicePixelRatio);

        this.canvas!.width = pixelWidth;
        this.canvas!.height = pixelHeight;

        this.canvasWidth = pixelWidth;
        this.canvasHeight = pixelHeight;

        this.ui_canvas!.width = Math.floor(this.ui_canvas!.clientWidth * devicePixelRatio);
        this.ui_canvas!.height = Math.floor(this.ui_canvas!.clientHeight * devicePixelRatio);

        this.internalWidth = Math.floor(pixelWidth * this.internalResolutionScale);
        this.internalHeight = Math.floor(pixelHeight * this.internalResolutionScale);

        if (this.gl_context) {
            this.gl_context.viewport(0, 0, this.canvasWidth, this.canvasHeight);
        }

        // Recreate / resize screen texture + renderbuffer attachments:
        if (this.screenFramebuffer) {
            this.ResizeFramebuffer();
        }

    }

    static ResizeFramebuffer()
    {
        const gl = this.gl_context;

        this.BindFramebuffer(this.screenFramebuffer!);

        if (this.screenTexture)
        {
            try { gl.deleteTexture(this.screenTexture); } catch(e) {}
            this.screenTexture = null;
        }

        const tex = gl.createTexture();
        if (!tex) {
            showError("Failed to create screen texture");
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            return;
        }
        gl.bindTexture(gl.TEXTURE_2D, tex);

        // Allocate storage (null data) using sized internal format (WebGL2)
        // Note: internalFormat = gl.RGBA8, format = gl.RGBA, type = gl.UNSIGNED_BYTE
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, LavaEngine.internalWidth, LavaEngine.internalHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        // sampling/wrap params
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        this.screenTexture = tex;

        // attach to FBO
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

        if (this.screenRenderbuffer)
        {
            try { gl.deleteRenderbuffer(this.screenRenderbuffer); } catch(e) {}
            this.screenRenderbuffer = null;
        }
        // create new renderbuffer
        const rbo = gl.createRenderbuffer();
        if (!rbo) {
            showError("Failed to create renderbuffer");
            // cleanup and unbind
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            return;
        }
        this.screenRenderbuffer = rbo;
        gl.bindRenderbuffer(gl.RENDERBUFFER, rbo);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH24_STENCIL8, LavaEngine.internalWidth, LavaEngine.internalHeight);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, rbo);

        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    } 

    // --- Engine Helper ---
    static RenderScreenTexture() 
    {
        this.gl_context.bindFramebuffer(this.gl_context.FRAMEBUFFER, null);
        this.gl_context.viewport(0.0, 0.0, this.canvas!.width, this.canvas!.height);
        this.gl_context.clearColor(1.0, 1.0, 1.0, 1.0);
        this.gl_context.clear(this.gl_context.COLOR_BUFFER_BIT);

        this.gl_context.useProgram(this.screenShader!.shaderProgram);
        this.gl_context.bindVertexArray(this.screenQuad!.vertexArrayObject);
        this.gl_context.bindBuffer(this.gl_context.ARRAY_BUFFER, this.screenQuad!.vertexBuffer);
        this.gl_context.disable(this.gl_context.DEPTH_TEST);


        const posAttrib = this.gl_context.getAttribLocation(this.screenShader!.shaderProgram, 'vertexPosition');
        const texAttrib = this.gl_context.getAttribLocation(this.screenShader!.shaderProgram, 'vertexTexCoord');

        this.gl_context.enableVertexAttribArray(posAttrib);
        this.gl_context.vertexAttribPointer(
            posAttrib, 2, this.gl_context.FLOAT, false,
            4 * Float32Array.BYTES_PER_ELEMENT, 0
        );

        this.gl_context.enableVertexAttribArray(texAttrib);
        this.gl_context.vertexAttribPointer(
            texAttrib, 2, this.gl_context.FLOAT, false,
            4 * Float32Array.BYTES_PER_ELEMENT,
            2 * Float32Array.BYTES_PER_ELEMENT
        );

        this.gl_context.activeTexture(this.gl_context.TEXTURE0);
        this.gl_context.bindTexture(this.gl_context.TEXTURE_2D, this.screenTexture);

        this.gl_context.texParameteri(this.gl_context.TEXTURE_2D, this.gl_context.TEXTURE_WRAP_S, this.gl_context.CLAMP_TO_EDGE);
        this.gl_context.texParameteri(this.gl_context.TEXTURE_2D, this.gl_context.TEXTURE_WRAP_T, this.gl_context.CLAMP_TO_EDGE);
        this.gl_context.texParameteri(this.gl_context.TEXTURE_2D, this.gl_context.TEXTURE_MIN_FILTER, this.gl_context.LINEAR);
        this.gl_context.texParameteri(this.gl_context.TEXTURE_2D, this.gl_context.TEXTURE_MAG_FILTER, this.gl_context.LINEAR);

        this.gl_context.uniform1i(this.gl_context.getUniformLocation(this.screenShader!.shaderProgram, "screenTexture"), 0);
        this.gl_context.uniform2fv(this.gl_context.getUniformLocation(this.screenShader!.shaderProgram, "screenSize"), vec2.fromValues(LavaEngine.internalWidth, LavaEngine.internalHeight));

        this.gl_context.bindTexture(this.gl_context.TEXTURE_2D, this.screenTexture);
        this.gl_context.drawArrays(this.gl_context.TRIANGLES, 0, 6);

        this.gl_context.bindBuffer(this.gl_context.ARRAY_BUFFER, null);
        this.gl_context.bindVertexArray(null);
    }
    
    static BindFramebuffer(framebuffer: WebGLFramebuffer)
    {
        this.gl_context.bindFramebuffer(LavaEngine.gl_context.FRAMEBUFFER, framebuffer);
        if(this.gl_context.checkFramebufferStatus(this.gl_context.FRAMEBUFFER) != this.gl_context.FRAMEBUFFER_COMPLETE)
            showError("FRAMEBUFFER INCOMPLETE!");
        return true;
    }
}

try {
    LavaEngine.CreateEngineWindow();
} catch (e)
{
    showError('Unhandled JavaScript exception: ${e}');
}