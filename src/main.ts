import { fragmentShaderSourceCode } from "../shaders/default.frag";
import { vertexShaderSourceCode } from "../shaders/default.vert";
import { COLOR_BLUE, COLOR_GREEN, COLOR_GREY, COLOR_RED, COLOR_WHITE, create3dInterleavedVao, CUBE_INDICES, CUBE_VERTICES, PLANE_INDICES, PLANE_VERTICES } from "./geometry";
import { createProgram, createStaticIndexBuffer, createStaticVertexBuffer, getContext, loadTexture, showError } from "./gl-utils";
import { glMatrix, mat4, quat, vec3 } from 'gl-matrix';
import './index.css'
import { Camera, CameraMovement } from "./camera";

class Shape {
    private matWorld = mat4.create();
    private scaleVec = vec3.create();
    private rotation = quat.create();

    constructor(
        private pos: vec3,
        private scale: number,
        private rotationAxis: vec3,
        private rotationAngle: number,
        private color: vec3,
        private albedoMap: WebGLTexture | null,
        public readonly vao: WebGLVertexArrayObject,
        public readonly numIndices: number) {}

    draw(gl: WebGL2RenderingContext,
        matWorldUniform: WebGLUniformLocation,
        diffuseColorUniform: WebGLUniformLocation,
        albedoMapUniform: WebGLUniformLocation
    )
    {
        quat.setAxisAngle(this.rotation, this.rotationAxis, this.rotationAngle);
        vec3.set(this.scaleVec, this.scale, this.scale, this.scale);

        mat4.fromRotationTranslationScale(
            this.matWorld,
            this.rotation,
            this.pos,
            this.scaleVec
        );

        gl.uniformMatrix4fv(matWorldUniform, false, this.matWorld);
        gl.uniform3fv(diffuseColorUniform, this.color);
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.albedoMap);
        gl.uniform1i(albedoMapUniform, 0);

        gl.bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, this.numIndices, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }
}

function introTo3DDemo()
{
    const canvas = document.getElementById('demo-canvas');
    if (!canvas || !(canvas instanceof HTMLCanvasElement))
    {
        showError('Cannot get demo-canvas reference - check for typos or loading script too early in HTML');
        return;
    }

    const gl = getContext(canvas);

    const cubeVertices = createStaticVertexBuffer(gl, CUBE_VERTICES);
    const cubeIndices = createStaticIndexBuffer(gl, CUBE_INDICES);

    const planeVertices = createStaticVertexBuffer(gl, PLANE_VERTICES);
    const planeIndices = createStaticIndexBuffer(gl, PLANE_INDICES);

    if (!cubeVertices || !cubeIndices || !planeVertices || !planeIndices) {
        showError('Failed to create vertex or index buffer.');
        return;
    }

    const demoProgram = createProgram(gl, vertexShaderSourceCode, fragmentShaderSourceCode);
    if (!demoProgram) {
        showError('Failed to create shader program.');
        return;
    }

    // Texture
    const brickTexture = loadTexture(gl, "textures/brick.png");
    const grassTexture = loadTexture(gl, "textures/grass.png");
    const woodTexture = loadTexture(gl, "textures/wood.png");
    const stoneTexture = loadTexture(gl, "textures/stone.png");
    const faceTexture = loadTexture(gl, "textures/face_2.png");
    const gatorTexture = loadTexture(gl, "textures/gata2.png");

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    const posAttrib = gl.getAttribLocation(demoProgram, 'vertexPosition');
    const texAttrib = gl.getAttribLocation(demoProgram, 'vertexTexCoord');
    const normAttrib = gl.getAttribLocation(demoProgram, 'vertexNormal');

    const matWorldUniform = gl.getUniformLocation(demoProgram, 'matWorld');
    const matViewProjUniform = gl.getUniformLocation(demoProgram, 'matViewProj');
    const matViewPosUniform = gl.getUniformLocation(demoProgram, 'viewPosition');
    
    const diffuseColorUniform = gl.getUniformLocation(demoProgram, 'diffuseColor');
    const albedoMapUniform = gl.getUniformLocation(demoProgram, 'albedoMap');

    if (!matWorldUniform || !matViewProjUniform || !diffuseColorUniform || !albedoMapUniform) {
        showError('Failed to get matWorld or diffuseColor uniform location.');
        return;
    }
    
    const cubeVao = create3dInterleavedVao(
        gl, cubeVertices, cubeIndices, posAttrib, texAttrib, normAttrib
    );
    
    const planeVao = create3dInterleavedVao(
        gl, planeVertices, planeIndices, posAttrib, texAttrib, normAttrib
    );

    if (!cubeVao || !planeVao) {
        showError('Failed to create VAO.');
        return;
    }

    const UP_VEC = vec3.fromValues(0, 1, 0);
    const shapes = [
        new Shape(vec3.fromValues(5, 1, 0), 1.0, UP_VEC,       0,                      COLOR_WHITE,    brickTexture,   cubeVao, CUBE_INDICES.length),
        new Shape(vec3.fromValues(4, 0.2, 3), 0.2, UP_VEC,     glMatrix.toRadian(20),  COLOR_WHITE,    woodTexture,   cubeVao, CUBE_INDICES.length),
        new Shape(vec3.fromValues(3, 0.4, -2.5), 0.4, UP_VEC,  glMatrix.toRadian(40),  COLOR_WHITE,    gatorTexture,   cubeVao, CUBE_INDICES.length),
        new Shape(vec3.fromValues(-2, 0.4, -2.5), 0.4, UP_VEC, glMatrix.toRadian(60),  COLOR_WHITE,    faceTexture,   cubeVao, CUBE_INDICES.length),
        new Shape(vec3.fromValues(-5, 0.7, 2), 0.7, UP_VEC,    glMatrix.toRadian(80),  COLOR_WHITE,    stoneTexture,   cubeVao, CUBE_INDICES.length),
        new Shape(vec3.fromValues(0, 0, 0), 50.0, UP_VEC,      0,                      COLOR_WHITE,    grassTexture,   planeVao, PLANE_INDICES.length)
    ]

    const matView = mat4.create();
    const matProj = mat4.create();

    // Camera setup
    const camera = new Camera(vec3.fromValues(0.0, 5.0, 0.0));
    //camera.Position = vec3.fromValues(0.0, 5.0, 0.0);
    //camera.Front = vec3.fromValues(0.0, 0.0, -1.0);

    let cameraAngle = 0;

    // Render
    let lastFrameTime = performance.now();
    let deltaTime = 0.0;

    // Some input

    let orbitRadius = 8.0;
    let cameraLocked = false;

    document.addEventListener('mousemove', function(event) {
        if (document.pointerLockElement === canvas)
        {
            camera.processMouseMovement(event.movementX, -event.movementY)
        }
    });


    canvas.addEventListener('wheel', function(event: WheelEvent)
    {
        if (document.pointerLockElement === canvas)
        {
            orbitRadius += event.deltaY / 100.0;
            event.preventDefault();
        }
    }, { passive: false });

    canvas.addEventListener('click', () => {
        canvas.requestPointerLock();
        cameraLocked = true;
    });

    let isShiftDown = false;
    let isFlying = false;

    const keysPressed = new Set<string>();
    document.addEventListener("keydown", (e) => keysPressed.add(e.key.toLowerCase()));
    document.addEventListener("keyup", (e) => keysPressed.delete(e.key.toLowerCase()));

    document.addEventListener('keydown', function(event)
    {
        if (event && event.key === "Escape")
        {
            document.exitPointerLock();
            cameraLocked = false;
        }
        
        if (event.code === "ShiftLeft")
        {
            isShiftDown = true;
        }

        if (event.key === "f" || event.key === "F")
        {
            isFlying = !isFlying;
        }

        if (event.code === "Space")
        {
            event.preventDefault();
            if (camera.Position[1] === groundHeight) {
                velocityY = 5.0;
                console.log("Jump");
            }
        }
    });

    document.addEventListener('keyup', function(event)
    {
        if (event && event.key === "LeftShift")
        {
            isShiftDown = false;
        }
    });

    let groundHeight = 2.0;
    let velocityY = 0.0;

    // Update
    const frame = function () {
        const thisFrameTime = performance.now();
        deltaTime = (thisFrameTime - lastFrameTime) / 1000;
        lastFrameTime = thisFrameTime;

        if (!isFlying)
        {
            // simple gravity
            velocityY += -15 * deltaTime;
            camera.Position[1] += velocityY * deltaTime;
            
            // ground "collision"
            if (camera.Position[1] <= groundHeight)
            {
                camera.Position[1] = groundHeight;
                velocityY = 0;
            }
        }

        // Checking Input
        if (keysPressed.has("ShiftLeft"))
        {
            isShiftDown = true;
        }
        else
        {
            isShiftDown = false;
        }

        if (keysPressed.has("w"))
        {
            if (isFlying)
            {
                camera.processKeysFlight(CameraMovement.FORWARD, deltaTime, isShiftDown);
            }
            else
            {
                camera.processKeysWalk(CameraMovement.FORWARD, deltaTime, isShiftDown);
            }
        }
        if (keysPressed.has("a"))
        {
            if (isFlying)
            {
                camera.processKeysFlight(CameraMovement.LEFT, deltaTime, isShiftDown);
            }
            else
            {
                camera.processKeysWalk(CameraMovement.LEFT, deltaTime, isShiftDown);
            }
        }
        if (keysPressed.has("s"))
        {
            if (isFlying)
            {
                camera.processKeysFlight(CameraMovement.BACKWARD, deltaTime, isShiftDown);
            }
            else
            {
                camera.processKeysWalk(CameraMovement.BACKWARD, deltaTime, isShiftDown);
            }
        }
        if (keysPressed.has("d"))
        {
            if (isFlying)
            {
                camera.processKeysFlight(CameraMovement.RIGHT, deltaTime, isShiftDown);
            }
            else
            {
                camera.processKeysWalk(CameraMovement.RIGHT, deltaTime, isShiftDown);
            }
        }
        if (keysPressed.has("e") && isFlying)
        {
            camera.processKeysFlight(CameraMovement.UP, deltaTime, isShiftDown);
        }
        if (keysPressed.has("q") && isFlying)
        {
            camera.processKeysFlight(CameraMovement.DOWN, deltaTime, isShiftDown);
        }


        mat4.copy(matView, camera.getViewMatrix());

        mat4.perspective(
            matProj,
            glMatrix.toRadian(80),
            canvas.width / canvas.height,
            0.1, 100.0
        );

        const matViewProj = mat4.create();
        mat4.multiply(matViewProj, matProj, matView)

        const viewMat = mat4.create();
        mat4.invert(viewMat, matView);

        const cameraPosition = vec3.fromValues(viewMat[12], viewMat[13], viewMat[14]);

        // Render
        canvas.width = (canvas.clientWidth * devicePixelRatio) / 1;
        canvas.height = (canvas.clientHeight * devicePixelRatio) / 1;

        gl.clearColor(0.643, 0.98, 1.00, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.viewport(0, 0, canvas.width, canvas.height);

        gl.useProgram(demoProgram);
        gl.uniformMatrix4fv(matViewProjUniform, false, matViewProj);
        gl.uniform3fv(matViewPosUniform, cameraPosition);

        shapes.forEach((shape) => shape.draw(gl, matWorldUniform, diffuseColorUniform, albedoMapUniform));

        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}

try {
    introTo3DDemo();
} catch (e)
{
    showError('Unhandled JavaScript exception: ${e}');
}

function inverse(matView: mat4): any {
    throw new Error("Function not implemented.");
}
