import { allocateRenderBufferStorage, attachRenderBufferToFrameBuffer, createFrameBuffer, createProgram, createRenderBuffer, createTexture, eulerToDirection, eulerToQuatWorld, getContext, getQuatForward, logFramebufferStatus, quatToEuler, setFrameBufferColorAttachment, showError } from "../gl-utils";
import { EngineDemo } from "../projects/engine-demo";
import { Input } from "./input";
import { Project } from "./project";
import '../index.css'
import { Transform, TransformComponent } from "../components/transform-component";
import { mat4, quat, vec2, vec3 } from "gl-matrix";
import { Audio } from 'ts-audio';
import { Mesh } from "../datatypes/mesh";
import { CUBE_INDICES, CUBE_VERTICES, quadVertices } from "../geometry";
import { Shader } from "../datatypes/shader";
import { screenTextureVertSdrSourceCode } from "../../shaders/screenTexture/screenTexture.vert";
import { screenTextureFragSdrSourceCode } from "../../shaders/screenTexture/screenTexture.frag";
import { depthMapVertSdrSourceCode } from "../../shaders/depthMap/depthMap.vert";
import { depthMapFragSdrSourceCode } from "../../shaders/depthMap/depthMap.frag";
import { depthDebugFragSdrSourceCode } from "../../shaders/debug/depthDebug.frag";
import { Material } from "../datatypes/material";
import { simpleVertSdrSourceCode } from "../../shaders/simple/simple.vert";
import { simpleFragSdrSourceCode } from "../../shaders/simple/simple.frag";

 
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

    static screenFramebuffer: WebGLFramebuffer | null; // msaa
    static screenDepthRenderbuffer: WebGLRenderbuffer | null;
    static screenColorFramebuffer: WebGLFramebuffer | null;
    static screenColorRenderbuffer: WebGLRenderbuffer | null; // multi sample color
    static screenQuad: Mesh | null;
    static screenShader: Shader | null;
    static screenTexture: WebGLTexture | null;

    static shadowMapResolution: number = 1024;
    static depthMap: WebGLTexture | null;
    static depthMapFB: WebGLFramebuffer | null;
    static depthShader:  Shader | null;
    static shadowMat: Material | null;
    static debugCube: Mesh | null;
    static triVAO: WebGLVertexArrayObject;
    static simpleProgram: WebGLProgram;

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

        const ext = this.gl_context.getExtension('EXT_texture_filter_anisotropic');
        if (ext) {
            console.log("yes");
        }

        this.internalResolutionScale = 1.0;
        this.canvasWidth = (this.canvas.clientWidth * devicePixelRatio) / 1;
        this.canvasHeight = (this.canvas.clientHeight * devicePixelRatio) / 1;
        this.internalWidth = this.canvasWidth * this.internalResolutionScale;
        this.internalHeight = this.canvasHeight * this.internalResolutionScale;
        this.fpsTarget = 240;

        this.debugCube = new Mesh(this.gl_context, CUBE_VERTICES, CUBE_INDICES);

        this.ResizeCanvases();
        this.SetupShadowMap();

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

        const q = eulerToQuatWorld([0, 0, 0]);
        const forward = vec3.create();
        vec3.transformQuat(forward, [0, 0, -1], q);
        console.log(forward); // -> [0, 0, -1]

        console.log(this.gl_context.getContextAttributes()?.antialias); // true or false
        console.log(this.gl_context.getParameter(this.gl_context.SAMPLES));

        // ---- INPUT LISTENING ----
        Input.InitInputEvents();


        // ---- FRAME / RENDER BUFFERS FOR SCREEN QUAD ----
        this.ResizeFramebuffer();

        LavaEngine.screenQuad = new Mesh(this.gl_context, quadVertices, null);
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
                //console.log("FRAME: " + lastFrameTime);
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

                LavaEngine.ShadowPass();

                LavaEngine.BindFramebuffer(LavaEngine.screenFramebuffer!); // custom frame buffer
                LavaEngine.project.MAIN_SCENE.render(LavaEngine.internalWidth, LavaEngine.internalHeight);
                LavaEngine.RenderScreenTexture(); // To Screen Quad
            }

            
            //requestAnimationFrame(frame);
            setTimeout(frame, 0);
        }
        frame();
        //requestAnimationFrame(frame);
    }

    static UpdateEngine()
    {
        this.project.Update();
    }

    // ---- ui LOGIC ----
    static DrawDebugui()
    {
        this.ui!.clearRect(0, 0, this.ui_canvas!.width, this.ui_canvas!.height);
        let playerTransform = this.project.MAIN_SCENE.getEntityByName("Player")!.getGlobalTransform();
        let cameraTransform = this.project.MAIN_SCENE.getEntityByName("Camera")!.getGlobalTransform();

        const cameraRot = quatToEuler(cameraTransform.rotation);
        this.ui!.font = "20px Quantico"; 
        this.ui!.fillStyle = "white";
        this.ui!.shadowColor = "rgba(0, 0, 0, 0.7)";
        this.ui!.shadowBlur = 6;
        this.ui!.shadowOffsetX = 3;
        this.ui!.shadowOffsetY = 3;
        this.ui!.fillText(`FPS: ${this.fps.toFixed(1)} (${this.frameTime.toFixed(1)} ms)`, 50, 50);
        this.ui!.fillText(`X: ${playerTransform.position[0].toFixed(2)} Y: ${playerTransform.position[1].toFixed(2)} Z: ${playerTransform.position[2].toFixed(2)}`, 50, 75);
        this.ui!.fillText(`RX: ${cameraRot[0].toFixed(2)} RY: ${cameraRot[1].toFixed(2)} RZ: ${cameraRot[2].toFixed(2)}`, 50, 100);
        const forward = getQuatForward(playerTransform.rotation);
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

        if (!this.screenFramebuffer)
        {
            this.screenFramebuffer = createFrameBuffer(this.gl_context);
        }

        if (!this.screenColorFramebuffer)
        {
            this.screenColorFramebuffer = createFrameBuffer(this.gl_context);
        }

        if (!this.screenColorRenderbuffer)
        {
            this.screenColorRenderbuffer = createRenderBuffer(this.gl_context);
        }

        if (!this.screenDepthRenderbuffer)
        {
            this.screenDepthRenderbuffer = createRenderBuffer(this.gl_context);
        }
        

        //msaa color buffer
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.screenColorRenderbuffer);
        gl.renderbufferStorageMultisample(
            gl.RENDERBUFFER,
            gl.getParameter(gl.MAX_SAMPLES) / 2,
            gl.RGBA8,
            LavaEngine.internalWidth,
            LavaEngine.internalHeight
        );

        //depth
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.screenDepthRenderbuffer);
        gl.renderbufferStorageMultisample(
            gl.RENDERBUFFER,
            gl.getParameter(gl.MAX_SAMPLES) / 2,
            gl.DEPTH24_STENCIL8,
            LavaEngine.internalWidth,
            LavaEngine.internalHeight
        );

        this.BindFramebuffer(this.screenFramebuffer);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, this.screenColorRenderbuffer);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, this.screenDepthRenderbuffer);
        console.log('MAX_SAMPLES', gl.getParameter(gl.MAX_SAMPLES));
        console.log('MAX_COLOR_ATTACHMENTS', gl.getParameter(gl.MAX_COLOR_ATTACHMENTS));


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


        this.BindFramebuffer(this.screenColorFramebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.screenTexture, 0);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    } 

    // --- Engine Helper ---
    static RenderScreenTexture() 
    {
        const gl = this.gl_context;

        //resolve
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.screenFramebuffer);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.screenColorFramebuffer);
        gl.blitFramebuffer(
            0, 0, LavaEngine.internalWidth, LavaEngine.internalHeight,
            0, 0, LavaEngine.internalWidth, LavaEngine.internalHeight,
            gl.COLOR_BUFFER_BIT, gl.LINEAR
        );

        //---
        gl.bindFramebuffer(this.gl_context.FRAMEBUFFER, null);
        gl.viewport(0.0, 0.0, this.canvas!.width, this.canvas!.height); 
        gl.clearColor(1.0, 0.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(this.screenShader!.shaderProgram);
        gl.bindVertexArray(this.screenQuad!.vertexArrayObject);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.screenQuad!.vertexBuffer);
        gl.disable(gl.DEPTH_TEST);

        const posAttrib = gl.getAttribLocation(this.screenShader!.shaderProgram, 'vertexPosition');
        const texAttrib = gl.getAttribLocation(this.screenShader!.shaderProgram, 'vertexTexCoord');

        gl.enableVertexAttribArray(posAttrib);
        gl.vertexAttribPointer(
            posAttrib, 2, gl.FLOAT, false,
            4 * Float32Array.BYTES_PER_ELEMENT, 0
        );

        gl.enableVertexAttribArray(texAttrib);
        gl.vertexAttribPointer(
            texAttrib, 2, gl.FLOAT, false,
            4 * Float32Array.BYTES_PER_ELEMENT,
            2 * Float32Array.BYTES_PER_ELEMENT
        );

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.screenTexture);

        gl.uniform1i(gl.getUniformLocation(this.screenShader!.shaderProgram, "screenTexture"), 0);
        gl.uniform2fv(gl.getUniformLocation(this.screenShader!.shaderProgram, "screenSize"), vec2.fromValues(LavaEngine.internalWidth, LavaEngine.internalHeight));

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    static SetupShadowMap()
    {
        const gl = this.gl_context;
        this.depthShader = new Shader(gl, depthMapVertSdrSourceCode, depthMapFragSdrSourceCode);

        const depthMap = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, depthMap);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.DEPTH_COMPONENT32F,
            this.canvasWidth * 3,
            this.canvasWidth * 3,
            0,
            gl.DEPTH_COMPONENT,
            gl.FLOAT,
            null,
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);
        

        this.shadowMat = new Material(this.depthShader!);

        const depthMapFB = createFrameBuffer(gl);
        gl.bindFramebuffer(gl.FRAMEBUFFER, depthMapFB!);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthMap, 0);
        logFramebufferStatus(this.gl_context, "fb text");
        gl.drawBuffers([gl.NONE]);
        gl.readBuffer(gl.NONE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, depthMapFB!);

        this.depthMap = depthMap!;
        this.depthMapFB = depthMapFB!;
    }

    static ShadowPass()
    {
        const gl = this.gl_context;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.depthMapFB!);
        logFramebufferStatus(gl, "Shadow Pass Bind");
        gl.viewport(0, 0, this.canvasWidth * 3, this.canvasWidth * 3);
        gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.DEPTH_BUFFER_BIT);

        gl.cullFace(gl.FRONT);
        LavaEngine.project.MAIN_SCENE.renderShadow(this.depthShader!.shaderProgram);
        gl.cullFace(gl.BACK);
    }

    
    static BindFramebuffer(framebuffer: WebGLFramebuffer | null)
    {
        this.gl_context.bindFramebuffer(LavaEngine.gl_context.FRAMEBUFFER, framebuffer);
        logFramebufferStatus(this.gl_context, "BindFrameBuffer");
        return true;
    }
}

try {
    LavaEngine.CreateEngineWindow();
} catch (e)
{
    showError('Unhandled JavaScript exception: ${e}');
}