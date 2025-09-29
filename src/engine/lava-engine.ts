import { allocateRenderBufferStorage, attachRenderBufferToFrameBuffer, createFrameBuffer, createProgram, createRenderBuffer, createTexture, eulerToDirection, eulerToQuatWorld, getContext, getQuatForward, logFramebufferStatus, quatToEuler, setFrameBufferColorAttachment, showError, toggleFullscreen } from "../gl-utils";
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
import { vertexShaderSourceCode } from "../../shaders/default.vert";
import { fragmentShaderSourceCode } from "../../shaders/default.frag";
import { gaussianBlurVertSdrSourceCode } from "../../shaders/gaussianBlur/gaussianBlur.vert";
import { gaussianBlurFragSdrSourceCode } from "../../shaders/gaussianBlur/gaussianBlur.frag";
import { copyVertSdrSourceCode } from "../../shaders/copy/copy.vert";
import { copyFragSdrSourceCode } from "../../shaders/copy/copy.frag";
import { downsampleVertSdrSourceCode } from "../../shaders/downsample/downsample.vert";
import { downsampleFragSdrSourceCode } from "../../shaders/downsample/downsample.frag";
import { upsampleVertSdrSourceCode } from "../../shaders/upsample/upsample.vert";
import { upsampleFragSdrSourceCode } from "../../shaders/upsample/upsample.frag";
import { avgLumFragSdrSourceCode } from "../../shaders/avgLum/avgLum.frag";
import { Lava, PhysicsWorld } from "./physics-world";
import { PhysicsDemo } from "../projects/physics-demo";

 
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

    //timings
    static physicsTime: number = 0.0;
    static shadowTime: number = 0.0;
    static renderTime: number = 0.0;
    static skyMaskTime: number = 0.0;
    static bloomTime: number = 0.0;
    static debugMode: boolean = true;

    // Render Quad + MSAA
    static screenFramebuffer: WebGLFramebuffer | null; // msaa
    static screenDepthRenderbuffer: WebGLRenderbuffer | null;
    static screenColorFramebuffer: WebGLFramebuffer | null;
    static screenColorRenderbuffer: WebGLRenderbuffer | null; // multi sample color
    static screenSkymaskRenderbuffer: WebGLRenderbuffer | null; // multi sample color
    static screenBloomRenderbuffer: WebGLRenderbuffer | null; // multi sample color
    static screenViewDepthRenderbuffer: WebGLRenderbuffer | null; // multi sample color
    static screenQuad: Mesh | null;
    static screenShader: Shader | null;
    static screenTexture: WebGLTexture | null;
    static depthTexture: WebGLTexture | null; // for mist pass
    static skyMask: WebGLTexture | null;

    // Bloom / HDR
    static gaussianBlurShader: Shader;
    static downsampleShader: Shader;
    static upsampleShader: Shader;
    static avgLumShader: Shader; // for mist pass
    static mipTexSizes: vec2[];
    static mipWeights: number[];
    static copyShader: Shader;
    static bloomTexture: WebGLTexture; // for mist pass
    static avgLumTexture: WebGLTexture; // for mist pass
    static avgLum: number = 1.0;
    static bloomBlurTexture: WebGLTexture; // for mist pass
    static viewDepthTexture: WebGLTexture; // for mist pass
    static mipCount: number;

    static bloomFB: WebGLFramebuffer;
    static copyFB: WebGLFramebuffer;
    static bloomMipTextures: WebGLTexture[];
    static testTexture: WebGLTexture; // used for debugging

    static pingPongFB: WebGLFramebuffer[] = new Array(2);
    static pingPongTex: WebGLTexture[] = new Array(2);

    // Post Processing
    static ppFramebuffer: WebGLFramebuffer | null; // msaa

    // Shadow Stuff
    static shadowMapResolution: number = 1024;
    static depthMap: WebGLTexture | null;
    static spotShadowMap: WebGLTexture | null;
    static depthMapFB: WebGLFramebuffer | null;
    static depthShader:  Shader | null;
    static shadowMat: Material | null;
    static debugCube: Mesh | null;
    static simpleProgram: WebGLProgram;

    // Physics
    static physics: PhysicsWorld;
    static physicsStep: number = 1 / 60;
    static alpha: number;

    //Helper Defaults
    static defaultShader: Shader;
    static defaultMaterial: Material;

    //Resource Tracking for Cleanup
    static SHADERS: Shader[] = [];
    static MESHES: Mesh[] = [];
    static MATERIALS: Material[] = []; 
    static FRAMEBUFFERS: WebGLFramebuffer[] = []; 
    static RENDERBUFFERS: WebGLRenderbuffer[] = []; 
    static TEXTURES: WebGLTexture[] = []; 

    static isPageHidden = false;



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
        this.gl_context.getExtension("EXT_color_buffer_float");
        this.gl_context.getExtension("OES_texture_float_linear");

        const ext = this.gl_context.getExtension('EXT_texture_filter_anisotropic');
        if (ext) {
            console.log("yes");
        }

        this.defaultShader = new Shader(this.gl_context, vertexShaderSourceCode, fragmentShaderSourceCode);
        this.gaussianBlurShader = new Shader(this.gl_context, gaussianBlurVertSdrSourceCode, gaussianBlurFragSdrSourceCode);
        this.downsampleShader = new Shader(this.gl_context, downsampleVertSdrSourceCode, downsampleFragSdrSourceCode);
        this.upsampleShader = new Shader(this.gl_context, upsampleVertSdrSourceCode, upsampleFragSdrSourceCode);
        this.copyShader = new Shader(this.gl_context, copyVertSdrSourceCode, copyFragSdrSourceCode);
        this.avgLumShader = new Shader(this.gl_context, copyVertSdrSourceCode, avgLumFragSdrSourceCode);

        this.SHADERS.push(this.defaultShader);
        this.SHADERS.push(this.gaussianBlurShader);
        this.SHADERS.push(this.downsampleShader);
        this.SHADERS.push(this.upsampleShader);
        this.SHADERS.push(this.copyShader);
        this.SHADERS.push(this.avgLumShader);

        this.defaultMaterial = new Material(this.defaultShader);
        this.MATERIALS.push(this.defaultMaterial);

        this.mipCount = 6;
        
        this.internalResolutionScale = 1.0;
        this.canvasWidth = (this.canvas.clientWidth * devicePixelRatio) / 1;
        this.canvasHeight = (this.canvas.clientHeight * devicePixelRatio) / 1;
        this.internalWidth = this.canvasWidth * this.internalResolutionScale;
        this.internalHeight = this.canvasHeight * this.internalResolutionScale;
        this.fpsTarget = 240;
        this.shadowMapResolution = 2048;

        this.debugCube = new Mesh(this.gl_context, CUBE_VERTICES, CUBE_INDICES);
        this.MESHES.push(this.debugCube);
        
        this.ResizeCanvases();
        
        window.addEventListener("resize", () => LavaEngine.ResizeCanvases());
        this.canvas.addEventListener('click', () => {
            this.canvas?.requestPointerLock();
            this.isPointerLock = true;
        });

        window.addEventListener("beforeunload", () => this.CleanUp());
        document.addEventListener("visibilitychange", () => {
            this.isPageHidden = document.hidden;
        });
        
        this.StartPhysics();
    }

    static async StartPhysics()
    {
        this.physics = new PhysicsWorld();
        await this.physics.Init();
        this.StartEngine();
    }

    static StartEngine()
    {
        this.project = new PhysicsDemo(this.gl_context);
        this.project.Start();

        const q = eulerToQuatWorld([0, 0, 0]);
        const forward = vec3.create();
        vec3.transformQuat(forward, [0, 0, -1], q);


        // ---- INPUT LISTENING ----
        Input.InitInputEvents();


        // ---- FRAME / RENDER BUFFERS FOR SCREEN QUAD ----
        this.ResizeFramebuffer();

        LavaEngine.screenQuad = new Mesh(this.gl_context, quadVertices, null);
        this.MESHES.push(LavaEngine.screenQuad);
        LavaEngine.screenShader = new Shader(this.gl_context, screenTextureVertSdrSourceCode, screenTextureFragSdrSourceCode);
        this.SHADERS.push(LavaEngine.screenShader);

        // ----- RENDER LOOP -------
        const frameDuration = (1000 / this.fpsTarget);
        LavaEngine.deltaTime = 0.0;
        let accumulator = 0.0;
        let maxStepsPerFrame = 3;
        let lastFrameTime = performance.now();


        const frame = function ()
        {
            if (true)
            {
                const thisFrameTime = performance.now();
                const delta = (thisFrameTime - lastFrameTime) / 1000;
                lastFrameTime = thisFrameTime;
                let aTime = performance.now();


                //accumulator = Math.min(accumulator + delta, 0.5);
                accumulator += delta;
                

                let steps = 0;
                while (accumulator >= LavaEngine.physicsStep)
                {   
                    aTime = performance.now(); //
                    LavaEngine.physics.World.stepSimulation(LavaEngine.physicsStep, 2);
                    LavaEngine.FixedUpdateEngine();
                    LavaEngine.physicsTime = performance.now() - thisFrameTime; //
                    accumulator -= LavaEngine.physicsStep;
                }

                LavaEngine.alpha = accumulator  / LavaEngine.physicsStep;


                if (delta < frameDuration)
                {
                    LavaEngine.deltaTime = delta;
                    const currentFps = 1.0 / LavaEngine.deltaTime;
                    LavaEngine.fpsHistory.push(currentFps);
                    if (LavaEngine.fpsHistory.length > 60) {
                        LavaEngine.fpsHistory.shift();
                    }
                    LavaEngine.fps = LavaEngine.fpsHistory.reduce((a, b) => a + b, 0) / LavaEngine.fpsHistory.length;
                    LavaEngine.frameTime = 1000.0 / LavaEngine.fps;

                    // --- UPDATE LOGIC ---
                    if (LavaEngine.debugMode)
                    {
                        LavaEngine.DrawDebugui();
                    }
                    
                    LavaEngine.UpdateEngine();
                    LavaEngine.CheckEngineInput();

                    Input.ValidateInputs();

                    aTime = performance.now(); //
                    LavaEngine.ShadowPass();
                    LavaEngine.shadowTime = performance.now() - aTime; //

                    aTime = performance.now(); //
                    LavaEngine.BindFramebuffer(LavaEngine.screenFramebuffer!); // custom frame buffer
                    LavaEngine.project.MAIN_SCENE.render(LavaEngine.internalWidth, LavaEngine.internalHeight);
                    LavaEngine.project.MAIN_SCENE.renderSkybox(LavaEngine.internalWidth, LavaEngine.internalHeight);
                    LavaEngine.ResolveMSAA();
                    LavaEngine.renderTime = performance.now() - aTime; //

                    aTime = performance.now(); //
                    LavaEngine.RenderSkymask();
                    LavaEngine.project.MAIN_SCENE.renderSkybox(LavaEngine.internalWidth, LavaEngine.internalHeight);
                    LavaEngine.skyMaskTime = performance.now() - aTime; //

                    aTime = performance.now();
                    LavaEngine.RenderBloom();
                    LavaEngine.bloomTime = performance.now() - aTime;
                
                    LavaEngine.RenderScreenTexture(LavaEngine.screenShader!.shaderProgram); // To Screen Quad
                }
            }
            setTimeout(frame, 0);
            //requestAnimationFrame(frame);
        }
        frame();
        //requestAnimationFrame(frame);
    }

    static UpdateEngine()
    {
        this.project.Update();
    }

    static FixedUpdateEngine()
    {
        this.project.FixedUpdate();
    }

    // ---- UI LOGIC ----
    // please replace later
    static DrawDebugui()
    {
        this.ui!.clearRect(0, 0, this.ui_canvas!.width, this.ui_canvas!.height);
        let playerTransform = this.project.MAIN_SCENE.getEntityByName("Player")!.getGlobalTransform();
        let cameraTransform = this.project.MAIN_SCENE.getEntityByName("Camera")!.getGlobalTransform();

        const cameraRot = quatToEuler(cameraTransform.rotation);
        this.ui!.font = "15px Quantico"; 
        this.ui!.fillStyle = "white";
        this.ui!.shadowColor = "rgba(0, 0, 0, 0.7)";
        this.ui!.shadowBlur = 6;
        this.ui!.shadowOffsetX = 3;
        this.ui!.shadowOffsetY = 3;
        this.ui!.fillText(`FPS: ${this.fps.toFixed(1)} (${this.frameTime.toFixed(1)} ms)`, 50, 50);
        this.ui!.fillText(`X: ${playerTransform.position[0].toFixed(2)} Y: ${playerTransform.position[1].toFixed(2)} Z: ${playerTransform.position[2].toFixed(2)}`, 50, 75);
        this.ui!.fillText(`RX: ${cameraRot[0].toFixed(2)} RY: ${cameraRot[1].toFixed(2)} RZ: ${cameraRot[2].toFixed(2)}`, 50, 100);
        this.ui!.font = "13px Quantico"; 
        const forward = getQuatForward(playerTransform.rotation);
        this.ui!.fillText(`VDX: ${forward[0].toFixed(2)} VDY: ${forward[1].toFixed(2)} VDZ: ${forward[2].toFixed(2)}`, 50, 125);
        this.ui!.font = "13px Quantico"; 
        if (this.isPointerLock)
        {
            this.ui!.fillText(`Pointer Locked`, 50, 150);
        }
        //this.ui!.fillText(`Physics: ${this.physicsTime.toFixed(1)} ms`, 50, 150);
        //this.ui!.fillText(`Shadow: ${this.shadowTime.toFixed(1)} ms`, 50, 165);
        //this.ui!.fillText(`Render (MSAA): ${this.renderTime.toFixed(1)} ms`, 50, 180);
        //this.ui!.fillText(`Sky: ${this.skyMaskTime.toFixed(1)} ms`, 50, 195);
        //this.ui!.fillText(`Bloom: ${this.bloomTime.toFixed(1)} ms`, 50, 210);
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

        this.SetupShadowMap();

    }

    static ResizeFramebuffer()
    {
        const gl = this.gl_context;

        if (!this.screenFramebuffer)
        {
            this.screenFramebuffer = createFrameBuffer(this.gl_context);
            this.FRAMEBUFFERS.push(this.screenFramebuffer!);
        }

        if (!this.ppFramebuffer)
        {
            this.ppFramebuffer = createFrameBuffer(this.gl_context);
            this.FRAMEBUFFERS.push(this.ppFramebuffer!);
        }

        if (!this.screenColorFramebuffer)
        {
            this.screenColorFramebuffer = createFrameBuffer(this.gl_context);
            this.FRAMEBUFFERS.push(this.screenColorFramebuffer!);
        }

        if (!this.screenColorRenderbuffer)
        {
            this.screenColorRenderbuffer = createRenderBuffer(this.gl_context);
            this.RENDERBUFFERS.push(this.screenColorRenderbuffer!);
        }

        if (!this.screenSkymaskRenderbuffer)
        {
            this.screenSkymaskRenderbuffer = createRenderBuffer(this.gl_context);
            this.RENDERBUFFERS.push(this.screenSkymaskRenderbuffer!);
        }

        if (!this.screenViewDepthRenderbuffer)
        {
            this.screenViewDepthRenderbuffer = createRenderBuffer(this.gl_context);
            this.RENDERBUFFERS.push(this.screenViewDepthRenderbuffer!);
        }

        if (!this.screenBloomRenderbuffer)
        {
            this.screenBloomRenderbuffer = createRenderBuffer(this.gl_context);
            this.RENDERBUFFERS.push(this.screenBloomRenderbuffer!);
        }


        if (!this.screenDepthRenderbuffer)
        {
            this.screenDepthRenderbuffer = createRenderBuffer(this.gl_context);
            this.RENDERBUFFERS.push(this.screenDepthRenderbuffer!);
        }
        

        //msaa color buffer
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.screenColorRenderbuffer);
        gl.renderbufferStorageMultisample(
            gl.RENDERBUFFER,
            gl.getParameter(gl.MAX_SAMPLES) / 2,
            gl.RGBA16F,
            LavaEngine.internalWidth,
            LavaEngine.internalHeight
        );

        gl.bindRenderbuffer(gl.RENDERBUFFER, this.screenSkymaskRenderbuffer);
        gl.renderbufferStorageMultisample(
            gl.RENDERBUFFER,
            gl.getParameter(gl.MAX_SAMPLES) / 2,
            gl.RGBA16F,
            LavaEngine.internalWidth,
            LavaEngine.internalHeight
        );

        gl.bindRenderbuffer(gl.RENDERBUFFER, this.screenBloomRenderbuffer);
        gl.renderbufferStorageMultisample(
            gl.RENDERBUFFER,
            gl.getParameter(gl.MAX_SAMPLES) / 2,
            gl.RGBA16F,
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
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.RENDERBUFFER, this.screenSkymaskRenderbuffer);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT2, gl.RENDERBUFFER, this.screenBloomRenderbuffer);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, this.screenDepthRenderbuffer);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2, gl.COLOR_ATTACHMENT3]);


        this.SetupTextures();
        this.SetupBloom();
        
        this.BindFramebuffer(this.screenColorFramebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.screenTexture, 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, this.skyMask, 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT2, gl.TEXTURE_2D, this.bloomTexture, 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT3, gl.TEXTURE_2D, this.viewDepthTexture, 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depthTexture, 0);

        gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2, gl.COLOR_ATTACHMENT3]);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    } 

    static ResolveMSAA()
    {
        const gl = this.gl_context;

        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.screenFramebuffer);
        gl.readBuffer(gl.COLOR_ATTACHMENT0);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.screenColorFramebuffer);

        gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.NONE, gl.NONE, gl.NONE]);
        gl.blitFramebuffer(
            0, 0, LavaEngine.internalWidth, LavaEngine.internalHeight,
            0, 0, LavaEngine.internalWidth, LavaEngine.internalHeight,
            gl.COLOR_BUFFER_BIT, gl.NEAREST
        );

        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.screenFramebuffer);
        gl.readBuffer(gl.COLOR_ATTACHMENT1);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.screenColorFramebuffer);

        gl.drawBuffers([gl.NONE, gl.COLOR_ATTACHMENT1, gl.NONE, gl.NONE]);
        gl.blitFramebuffer(
            0, 0, LavaEngine.internalWidth, LavaEngine.internalHeight,
            0, 0, LavaEngine.internalWidth, LavaEngine.internalHeight,
            gl.COLOR_BUFFER_BIT, gl.NEAREST
        );
        
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.screenFramebuffer);
        gl.readBuffer(gl.COLOR_ATTACHMENT2);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.screenColorFramebuffer);
        gl.drawBuffers([gl.NONE, gl.NONE, gl.COLOR_ATTACHMENT2, gl.NONE]);
        gl.blitFramebuffer(
            0, 0, LavaEngine.internalWidth, LavaEngine.internalHeight,
            0, 0, LavaEngine.internalWidth, LavaEngine.internalHeight,
            gl.COLOR_BUFFER_BIT, gl.NEAREST
        );

        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.screenFramebuffer);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.screenColorFramebuffer);
        gl.blitFramebuffer(
            0, 0, LavaEngine.internalWidth, LavaEngine.internalHeight,
            0, 0, LavaEngine.internalWidth, LavaEngine.internalHeight,
            gl.DEPTH_BUFFER_BIT, gl.NEAREST
        );
    }

    // --- Engine Helper ---
    static RenderScreenTexture(shaderProgram: WebGLShader) 
    {
        const gl = this.gl_context;

        //---
        gl.bindFramebuffer(this.gl_context.FRAMEBUFFER, null);
        gl.viewport(0.0, 0.0, this.canvas!.width, this.canvas!.height); 
        gl.clearColor(1.0, 0.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(shaderProgram);
        gl.bindVertexArray(this.screenQuad!.vertexArrayObject);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.screenQuad!.vertexBuffer);
        gl.disable(gl.DEPTH_TEST);

        gl.activeTexture(gl.TEXTURE0);
        //gl.bindTexture(gl.TEXTURE_2D, this.screenTexture);
        gl.bindTexture(gl.TEXTURE_2D, this.screenTexture);
        gl.uniform1i(gl.getUniformLocation(shaderProgram, "screenTexture"), 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.depthTexture);
        gl.uniform1i(gl.getUniformLocation(shaderProgram, "depthTexture"), 1);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.bloomBlurTexture);
        gl.uniform1i(gl.getUniformLocation(shaderProgram, "bloomTexture"), 2);

        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, this.skyMask);
        gl.uniform1i(gl.getUniformLocation(shaderProgram, "skyMask"), 3);

        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, this.avgLumTexture);
        gl.uniform1i(gl.getUniformLocation(shaderProgram, "avgLumTexture"), 4);

        gl.uniform2fv(gl.getUniformLocation(shaderProgram, "screenSize"), vec2.fromValues(LavaEngine.internalWidth, LavaEngine.internalHeight));

        
        gl.uniform1f(gl.getUniformLocation(shaderProgram, "far"), this.project.MAIN_SCENE.mainCamera!.farPlane);
        gl.uniform1f(gl.getUniformLocation(shaderProgram, "near"), this.project.MAIN_SCENE.mainCamera!.nearPlane);

        gl.uniform1f(gl.getUniformLocation(shaderProgram, "deltaTime"), LavaEngine.deltaTime);
        gl.uniform1f(gl.getUniformLocation(shaderProgram, "lastExposure"), this.avgLum);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    static RenderSkymask()
    {
        const gl = this.gl_context;
        this.BindFramebuffer(this.screenColorFramebuffer);
        gl.drawBuffers([gl.NONE, gl.COLOR_ATTACHMENT1, gl.NONE]);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    static SetupShadowMap()
    {
        const gl = this.gl_context;
        this.depthShader = new Shader(gl, depthMapVertSdrSourceCode, depthMapFragSdrSourceCode);
        this.SHADERS.push(this.depthShader);

        const depthMap = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, depthMap);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.DEPTH_COMPONENT32F,
            this.shadowMapResolution,
            this.shadowMapResolution,
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
        this.TEXTURES.push(depthMap);

        const spotShadow = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, spotShadow);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.DEPTH_COMPONENT32F,
            this.shadowMapResolution,
            this.shadowMapResolution,
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
        this.TEXTURES.push(spotShadow);
        

        this.shadowMat = new Material(this.depthShader!);
        this.MATERIALS.push(this.shadowMat);

        const depthMapFB = createFrameBuffer(gl);
        gl.bindFramebuffer(gl.FRAMEBUFFER, depthMapFB!);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthMap, 0);
        
        gl.drawBuffers([gl.NONE]);
        gl.readBuffer(gl.NONE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, depthMapFB!);

        this.FRAMEBUFFERS.push(depthMapFB!);

        this.depthMap = depthMap!;
        this.depthMapFB = depthMapFB!;
    }

    static ShadowPass()
    {
        const gl = this.gl_context;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.depthMapFB!);
        gl.viewport(0, 0, LavaEngine.shadowMapResolution, LavaEngine.shadowMapResolution);
        gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.DEPTH_BUFFER_BIT);

        LavaEngine.project.MAIN_SCENE.renderShadow(this.depthShader!.shaderProgram);
    }

    
    static BindFramebuffer(framebuffer: WebGLFramebuffer | null)
    {
        this.gl_context.bindFramebuffer(LavaEngine.gl_context.FRAMEBUFFER, framebuffer);
        return true;
    }

    static SetupTextures()
    {
        const gl = this.gl_context;

        if (this.screenTexture)
        {
            gl.deleteTexture(this.screenTexture);
        }

        let tex = gl.createTexture();
        if (!tex) {
            showError("Failed to create screen texture");
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            return;
        }
        gl.bindTexture(gl.TEXTURE_2D, tex);

        // Allocate storage (null data) using sized internal format (WebGL2)
        // Note: internalFormat = gl.RGBA8, format = gl.RGBA, type = gl.UNSIGNED_BYTE
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, LavaEngine.internalWidth, LavaEngine.internalHeight, 0, gl.RGBA, gl.FLOAT, null);

        // sampling/wrap params
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        this.screenTexture = tex;

        if (!this.TEXTURES.includes(this.screenTexture))
        {
            this.TEXTURES.push(this.screenTexture);
        }

        //depthtex
        if (this.depthTexture)
        {
            gl.deleteTexture(this.depthTexture);
        }

        let depth = gl.createTexture();
        if (!depth) {
            showError("Failed to create screen texture");
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            return;
        }
        gl.bindTexture(gl.TEXTURE_2D, depth);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH24_STENCIL8, LavaEngine.internalWidth, LavaEngine.internalHeight, 0, gl.DEPTH_STENCIL, gl.UNSIGNED_INT_24_8, null);

        // sampling/wrap params
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        this.depthTexture = depth;

        if (!this.TEXTURES.includes(this.depthTexture))
        {
            this.TEXTURES.push(this.depthTexture);
        }

        
        //skymask
        if (this.skyMask)
        {
            gl.deleteTexture(this.skyMask);
        }

        let sky = gl.createTexture();
        if (!sky) {
            showError("Failed to create screen texture");
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            return;
        }
        gl.bindTexture(gl.TEXTURE_2D, sky);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, LavaEngine.internalWidth, LavaEngine.internalHeight, 0, gl.RGBA, gl.FLOAT, null);

        // sampling/wrap params
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        this.skyMask = sky;

        if (!this.TEXTURES.includes(this.skyMask))
        {
            this.TEXTURES.push(this.skyMask);
        }

        // bloom pass tex
        if (this.bloomTexture)
        {
            gl.deleteTexture(this.bloomTexture);
        }
        
        let bloom = gl.createTexture();
        if (!bloom) {
            showError("Failed to create screen texture");
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            return;
        }
        gl.bindTexture(gl.TEXTURE_2D, bloom);

        // Allocate storage (null data) using sized internal format (WebGL2)
        // Note: internalFormat = gl.RGBA8, format = gl.RGBA, type = gl.UNSIGNED_BYTE
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, LavaEngine.internalWidth, LavaEngine.internalHeight, 0, gl.RGBA, gl.FLOAT, null);

        // sampling/wrap params
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        this.bloomTexture = bloom;

        if (!this.TEXTURES.includes(this.bloomTexture))
        {
            this.TEXTURES.push(this.bloomTexture);
        }


        if (this.bloomBlurTexture)
        {
            gl.deleteTexture(this.bloomBlurTexture);
        }

        let bloomBlur = gl.createTexture();
        if (!bloomBlur) {
            showError("Failed to create screen texture");
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            return;
        }
        gl.bindTexture(gl.TEXTURE_2D, bloomBlur);

        // Allocate storage (null data) using sized internal format (WebGL2)
        // Note: internalFormat = gl.RGBA8, format = gl.RGBA, type = gl.UNSIGNED_BYTE
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, LavaEngine.internalWidth, LavaEngine.internalHeight, 0, gl.RGBA, gl.FLOAT, null);

        // sampling/wrap params
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        this.bloomBlurTexture = bloomBlur;

        if (!this.TEXTURES.includes(this.bloomBlurTexture))
        {
            this.TEXTURES.push(this.bloomBlurTexture);
        }

        if (this.testTexture)
        {
            gl.deleteTexture(this.testTexture);
        }

        let testTex = gl.createTexture();
        if (!testTex) {
            showError("Failed to create screen texture");
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            return;
        }
        gl.bindTexture(gl.TEXTURE_2D, testTex);

        // Allocate storage (null data) using sized internal format (WebGL2)
        // Note: internalFormat = gl.RGBA8, format = gl.RGBA, type = gl.UNSIGNED_BYTE
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, LavaEngine.internalWidth, LavaEngine.internalHeight, 0, gl.RGBA, gl.FLOAT, null);

        // sampling/wrap params
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        this.testTexture = testTex;

        if (!this.TEXTURES.includes(this.testTexture))
        {
            this.TEXTURES.push(this.testTexture);
        }

        let avgLum = gl.createTexture();
        if (!avgLum) {
            showError("Failed to create screen texture");
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            return;
        }
        gl.bindTexture(gl.TEXTURE_2D, avgLum);

        // Allocate storage (null data) using sized internal format (WebGL2)
        // Note: internalFormat = gl.RGBA8, format = gl.RGBA, type = gl.UNSIGNED_BYTE
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, LavaEngine.internalWidth, LavaEngine.internalHeight, 0, gl.RED, gl.FLOAT, null);

        // sampling/wrap params
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        this.avgLumTexture = avgLum;

        if (!this.TEXTURES.includes(this.avgLumTexture))
        {
            this.TEXTURES.push(this.avgLumTexture);
        }
    }

    static SetupBloom()
    {
        const gl = this.gl_context;

        if (this.copyFB)
        {
            gl.deleteFramebuffer(this.copyFB);
        }
        this.copyFB = gl.createFramebuffer();

        if (!this.FRAMEBUFFERS.includes(this.copyFB))
        {
            this.FRAMEBUFFERS.push(this.copyFB);
        }

        if (this.bloomFB)
        {
            gl.deleteFramebuffer(this.bloomFB);
        }
        this.bloomFB = gl.createFramebuffer();

        if (!this.FRAMEBUFFERS.includes(this.bloomFB))
        {
            this.FRAMEBUFFERS.push(this.bloomFB);
        }

        this.mipTexSizes = new Array(this.mipCount);
        let w = LavaEngine.internalWidth;
        let h = LavaEngine.internalHeight;
        this.bloomMipTextures = new Array(this.mipCount);
        this.mipWeights = new Array(this.mipCount);
        let initialWeight = 1.0;
        for (let i = 0; i < this.mipCount; i++)
        {
            this.mipTexSizes[i] = vec2.fromValues(w, h);
            this.mipWeights[i] = initialWeight;

            if (this.bloomMipTextures[i])
            {
                gl.deleteTexture(this.bloomMipTextures[i]);
            }
            this.bloomMipTextures[i] = gl.createTexture();

            gl.bindTexture(gl.TEXTURE_2D, this.bloomMipTextures[i]);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, Math.max(1, w), Math.max(1, h), 0, gl.RGBA, gl.FLOAT, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            w = Math.max(1, w >> 1);
            h = Math.max(1, h >> 1);

            gl.bindTexture(gl.TEXTURE_2D, null);
            initialWeight *= 1.0;

            if (!this.TEXTURES.includes(this.bloomMipTextures[i]))
            {
                this.TEXTURES.push(this.bloomMipTextures[i]);
            }
        }
    }

    static RenderBloom()
    {
        const gl = this.gl_context;

        const karisAvg = true;
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomFB);
        // downsample first
        gl.useProgram(this.downsampleShader.shaderProgram);
        if (karisAvg)
        {
            gl.uniform1i(gl.getUniformLocation(this.downsampleShader.shaderProgram, "mipLevel"), 0);
        }
        
        let srcTex = this.bloomTexture;

        // for each mip level
        for (let level = 0; level < this.mipCount; level++)
        {
            const w = this.mipTexSizes[level][0];
            const h = this.mipTexSizes[level][1];

            // step 2: downsample the current mip level
            gl.viewport(0, 0, w, h);

            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.bloomMipTextures[level], 0);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, srcTex);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,   gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,   gl.CLAMP_TO_EDGE);
            
            gl.uniform1i(gl.getUniformLocation(this.downsampleShader.shaderProgram, "uInput"), 0);
            gl.uniform2f(gl.getUniformLocation(this.downsampleShader.shaderProgram, "uTexelSize"), 1.0 / w, 1.0 / h);

            this.RenderBloomTexture(this.downsampleShader.shaderProgram);

            srcTex = this.bloomMipTextures[level];

            if (level === 0)
            {
                gl.uniform1i(gl.getUniformLocation(this.downsampleShader.shaderProgram, "mipLevel"), 1);
            }
        }
        
        //upsample
        gl.useProgram(this.upsampleShader.shaderProgram);

        const filterBase = 0.005;

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.blendEquation(gl.FUNC_ADD);
        //gl.uniform2f(gl.getUniformLocation(this.upsampleShader.shaderProgram, "uTexelSize"), 1.0 / LavaEngine.internalWidth, 1.0 / LavaEngine.internalHeight);
        
        for (let level = this.mipCount - 1; level > 0; level--)
        {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.bloomMipTextures[level]);

            gl.uniform1i(gl.getUniformLocation(this.upsampleShader.shaderProgram, "uInput"), 0);
            gl.uniform1f(gl.getUniformLocation(this.upsampleShader.shaderProgram, "levelWeight"), this.mipWeights[level]);
            gl.uniform1f(gl.getUniformLocation(this.upsampleShader.shaderProgram, "filterRadius"), filterBase);
            gl.uniform2f(gl.getUniformLocation(this.upsampleShader.shaderProgram, "uTexelSize"),
            1.0 / this.mipTexSizes[level][0], 1.0 / this.mipTexSizes[level][1]);

            gl.viewport(0, 0, this.mipTexSizes[level - 1][0], this.mipTexSizes[level - 1][1]);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.bloomMipTextures[level - 1], 0);
            this.RenderBloomTexture(this.upsampleShader.shaderProgram);
        }
            

        gl.disable(gl.BLEND);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, LavaEngine.internalWidth, LavaEngine.internalHeight);
        
        this.bloomBlurTexture = this.bloomMipTextures[0];
    }

    static RenderBloomTexture(shaderProgram: WebGLShader) 
    {
        const gl = this.gl_context;
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.bindVertexArray(this.screenQuad!.vertexArrayObject);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.screenQuad!.vertexBuffer);
        gl.disable(gl.DEPTH_TEST);

        const posAttrib = gl.getAttribLocation(shaderProgram, 'vertexPosition');
        const texAttrib = gl.getAttribLocation(shaderProgram, 'vertexTexCoord');

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

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    static ComputeAvgLum(callback: (() => void) | undefined)
    {
        const gl = this.gl_context;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomFB);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.avgLumTexture, 0);

        gl.useProgram(this.avgLumShader.shaderProgram);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.screenTexture);
        gl.uniform1i(gl.getUniformLocation(this.avgLumShader.shaderProgram, "uInput"), 0);
        
        gl.viewport(0, 0, LavaEngine.internalWidth, LavaEngine.internalHeight);
        this.RenderBloomTexture(this.avgLumShader.shaderProgram);

        gl.bindTexture(gl.TEXTURE_2D, this.avgLumTexture);

        gl.generateMipmap(gl.TEXTURE_2D);

        gl.finish();

        const pixel = new Float32Array(4);
        gl.readPixels(
            0, 0, 1, 1,
            gl.RGBA,
            gl.FLOAT,
            pixel
        );
        this.avgLum = pixel[0];

        if(callback) callback();
    }

    static CheckEngineInput()
    {
        if (Input.GetKeyPressed("digit1"))
        {
            this.debugMode = !this.debugMode;
            this.ui!.clearRect(0, 0, this.ui_canvas!.width, this.ui_canvas!.height);
        }
    }

    static CleanUp()
    {
        for (const s of this.SHADERS)
        {
            s.destroy();
        }

        for (const m of this.MESHES)
        {
            m.destroy();
        }

        for (const m of this.MATERIALS)
        {
            m.destroy();
        }

        for (const fb of this.FRAMEBUFFERS)
        {
            this.gl_context.deleteFramebuffer(fb);
        }

        for (const rb of this.RENDERBUFFERS)
        {
            this.gl_context.deleteRenderbuffer(rb);
        }

        for (const t of this.TEXTURES)
        {
            this.gl_context.deleteRenderbuffer(t);
        }

        this.physics.destroy();

        this.project.Destroy();
    }
}

try {
    LavaEngine.CreateEngineWindow();
} catch (e)
{
    showError('Unhandled JavaScript exception: ${e}');
}

