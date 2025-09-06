import { fragmentShaderSourceCode } from "../shaders/default.frag";
import { vertexShaderSourceCode } from "../shaders/default.vert";
import { COLOR_BLUE, COLOR_GREEN, COLOR_GREY, COLOR_RED, COLOR_WHITE, create3dInterleavedVao, Shape, CUBE_INDICES, CUBE_VERTICES, PLANE_INDICES, PLANE_VERTICES } from "./geometry";
import { createProgram, createStaticIndexBuffer, createStaticVertexBuffer, createTexture, getContext, getExtension, loadTexture, showError } from "./gl-utils";
import { glMatrix, mat4, quat, vec3 } from 'gl-matrix';
import './index.css'
import { Mesh } from "./datatypes/mesh";
import { Scene } from "./gameobjects/scene";
import { Material } from "./datatypes/material";
import { Shader } from "./datatypes/shader";
import { Model } from "./datatypes/model";
import { ModelComponent } from "./components/model-component";
import { TransformComponent } from "./components/transform-component";
import { CameraComponent } from "./components/camera-component";
import { LightComponent } from "./components/light-component";


function mainEngine()
{
    // --------- WINDOW SETUP --------
    const canvas = document.getElementById('demo-canvas');
    if (!canvas || !(canvas instanceof HTMLCanvasElement))
    {
        showError('Cannot get demo-canvas reference - check for typos or loading script too early in HTML');
        return;
    }

    const gl = getContext(canvas);


    // --------- THE GAME --------
    const mainScene = new Scene(gl);
    
    const e_plane = mainScene.addEntity(
        vec3.fromValues(0.0, 0.0, 0.0), 
        vec3.fromValues(0.0, 0.0, 0.0),
        vec3.fromValues(50.0, 50.0, 50.0)
    );
    
    const e_player = mainScene.addEntity(vec3.fromValues(0.0, 0.0, 0.0));
    const e_camera = mainScene.addEntity(vec3.fromValues(0.0, 2.0, 0.0));
    const e_sun = mainScene.addEntity(
        vec3.fromValues(0.0, 0.0, 0.0),
        vec3.fromValues(-60.0, -20.0, -40.0)
    );

    const e_cube_1 = mainScene.addEntity(
        vec3.fromValues(0.0, 1.0, -10.0), 
        vec3.fromValues(0.0, 0.0, 0.0),
        vec3.fromValues(1.0, 1.0, 1.0)
    );
    const e_cube_2 = mainScene.addEntity(
        vec3.fromValues(4.0, 0.2, 3.0), 
        vec3.fromValues(0.0, 0.0, 0.0),
        vec3.fromValues(0.2, 0.2, 0.2)
    );
    const e_cube_3 = mainScene.addEntity(
        vec3.fromValues(3.0, 0.4, -2.5), 
        vec3.fromValues(0.0, 0.0, 0.0),
        vec3.fromValues(0.4, 0.4, 0.4)
    );
    const e_cube_4 = mainScene.addEntity(
        vec3.fromValues(-5.0, 0.7, 2.0), 
        vec3.fromValues(0.0, 0.0, 0.0),
        vec3.fromValues(0.7, 0.7, 0.7)
    );
    
    // Create meshs from vert/ind
    const msh_plane = new Mesh(gl, PLANE_VERTICES, PLANE_INDICES);
    const msh_cube = new Mesh(gl, CUBE_VERTICES, CUBE_INDICES);

    
    // Create shader to render material with
    const sdr_standard = new Shader(gl, vertexShaderSourceCode, fragmentShaderSourceCode);

    
    // Create material to render model with
    const mat_grass = new Material(sdr_standard);
    mat_grass.setTex(0, loadTexture(gl, "textures/grass.png"));

    
    const mat_stone = new Material(sdr_standard);
    mat_stone.setTex(0, loadTexture(gl, "textures/stone.png")); 

    const mat_brick = new Material(sdr_standard);
    mat_brick.setTex(0, loadTexture(gl, "textures/brick.png")); 

    
    // Create models from meshs (make modelcomponent house materials)
    const mod_plane = new Model(mat_grass, msh_plane);
    const mod_cube_1 = new Model(mat_brick, msh_cube);
    const mod_cube_2 = new Model(mat_brick, msh_cube);
    const mod_cube_3 = new Model(mat_brick, msh_cube);
    const mod_cube_4 = new Model(mat_brick, msh_cube);

    
    // Add model components to entities (trying to maintain ECS-ish)
    // scene.render->entity->modelcomp->model.draw(entity.transform)
    e_plane.addComponent(ModelComponent, new ModelComponent(mod_plane));
    e_cube_1.addComponent(ModelComponent, new ModelComponent(mod_cube_1));
    e_cube_2.addComponent(ModelComponent, new ModelComponent(mod_cube_2));
    e_cube_3.addComponent(ModelComponent, new ModelComponent(mod_cube_3));
    e_cube_4.addComponent(ModelComponent, new ModelComponent(mod_cube_4));

    e_camera.addComponent(CameraComponent, new CameraComponent());
    e_player.addChildEntity(e_camera);

    e_sun.addComponent(LightComponent, new LightComponent()); // default light
    




 /*


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
    const liminalTexture = loadTexture(gl, "textures/liminal.png");

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

    // SHADOWS
    //const depthTexture = createTexture(gl, 512, 512, 0, gl.DEPTH_COMPONENT, gl.DEPTH_COMPONENT, 0, gl.UNSIGNED_INT, null);
    //const depthFramebuffer = gl.createFramebuffer();
    //gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
    //gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);
    //
    //const unusedTexture = createTexture(gl, 512, 512);
    //gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, unusedTexture, 0);


    const UP_VEC = vec3.fromValues(0, 1, 0);
    const shapes = [
        new Shape(vec3.fromValues(5, 1, 0), 1.0, UP_VEC,       0,                      COLOR_WHITE,    brickTexture,   cubeVao, CUBE_INDICES.length),
        new Shape(vec3.fromValues(4, 0.2, 3), 0.2, UP_VEC,     glMatrix.toRadian(20),  COLOR_WHITE,    woodTexture,   cubeVao, CUBE_INDICES.length),
        new Shape(vec3.fromValues(3, 0.4, -2.5), 0.4, UP_VEC,  glMatrix.toRadian(40),  COLOR_WHITE,    liminalTexture,   cubeVao, CUBE_INDICES.length),
        new Shape(vec3.fromValues(-2, 0.4, -2.5), 0.4, UP_VEC, glMatrix.toRadian(60),  COLOR_WHITE,    faceTexture,   cubeVao, CUBE_INDICES.length),
        new Shape(vec3.fromValues(-5, 0.7, 2), 0.7, UP_VEC,    glMatrix.toRadian(80),  COLOR_WHITE,    stoneTexture,   cubeVao, CUBE_INDICES.length),
        new Shape(vec3.fromValues(0, 0, 0), 50.0, UP_VEC,      0,                      COLOR_WHITE,    grassTexture,   planeVao, PLANE_INDICES.length)
    ]

    const matView = mat4.create();
    const matProj = mat4.create();

    // Camera setup
    const camera = new Camera(vec3.fromValues(0.0, 5.0, 0.0));
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

    */


    // --------- RENDER LOOP --------
    let lastFrameTime = performance.now();
    let deltaTime = 0.0;
    let groundHeight = 2.0;
    let velocityY = 0.0;
    
    const frame = function () {
        const thisFrameTime = performance.now();
        deltaTime = (thisFrameTime - lastFrameTime) / 1000;
        lastFrameTime = thisFrameTime;

        /*
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

        */

        //const viewMat = mat4.create();
        //mat4.invert(viewMat, matView);
//----------------------------------------------------------------------------
        // Render
        canvas.width = (canvas.clientWidth * devicePixelRatio) / 1;
        canvas.height = (canvas.clientHeight * devicePixelRatio) / 1;

        mainScene.render(canvas.width, canvas.height);

        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}

try {
    mainEngine();
} catch (e)
{
    showError('Unhandled JavaScript exception: ${e}');
}

function inverse(matView: mat4): any {
    throw new Error("Function not implemented.");
}
