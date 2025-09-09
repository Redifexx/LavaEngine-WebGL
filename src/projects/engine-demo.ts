import { vec3 } from "gl-matrix";
import { Project } from "../engine/project";
import { Scene } from "../gameobjects/scene";
import { Mesh } from "../datatypes/mesh";
import { CUBE_INDICES, CUBE_VERTICES, PLANE_INDICES, PLANE_VERTICES } from "../geometry";
import { Shader } from "../datatypes/shader";
import { vertexShaderSourceCode } from "../../shaders/default.vert";
import { fragmentShaderSourceCode } from "../../shaders/default.frag";
import { Material } from "../datatypes/material";
import { loadTexture, showError } from "../gl-utils";
import { Model } from "../datatypes/model";
import { ModelComponent } from "../components/model-component";
import { CameraComponent } from "../components/camera-component";
import { LightComponent } from "../components/light-component";
import { PlayerMovement } from "../scripts/playerMovement";
import { CameraController } from "../scripts/cameraController";
import { MeshRotate } from "../scripts/meshRotate";
import { skyboxVertSdrSourceCode } from "../../shaders/skybox/skybox.vert";
import { skyboxFragSdrSourceCode } from "../../shaders/skybox/skybox.frag";

export class EngineDemo extends Project
{
    // ------ GAME VARIABLES --------
    MAIN_SCENE: Scene;


    constructor(gl: WebGL2RenderingContext)
    {
        super(gl);
    }

    override Setup(): void
    {
        this.MAIN_SCENE = this.CreateScene();
        const e_plane = this.MAIN_SCENE.addEntity(
            "Plane",
            vec3.fromValues(0.0, 0.0, 0.0), 
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(50.0, 50.0, 50.0)
        );
        console.log("CHECKPOINT");

        const e_player = this.MAIN_SCENE.addEntity("Player", vec3.fromValues(0.0, 0.0, 0.0));
        const e_camera = this.MAIN_SCENE.addEntity("Camera", vec3.fromValues(0.0, 2.0, 0.0));
        const e_skybox = this.MAIN_SCENE.addEntity("Skybox", vec3.fromValues(0.0, 0.0, 0.0));
        const e_sun = this.MAIN_SCENE.addEntity(
            "Sun",
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(-60.0, -20.0, -40.0)
        );

        const e_redlight = this.MAIN_SCENE.addEntity(
            "RedLight",
            vec3.fromValues(2.0, 5.0, -5.0),
            vec3.fromValues(-90.0, -10.0, -10.0)
        );

        const e_greenlight = this.MAIN_SCENE.addEntity(
            "GreenLight",
            vec3.fromValues(-2.0, 3.0, 8.0),
            vec3.fromValues(-15.0, 0.0, 0.0)
        );

        const e_bluelight = this.MAIN_SCENE.addEntity(
            "BlueLight",
            vec3.fromValues(6.0, 2, 1.0)
        );

        const e_purplelight = this.MAIN_SCENE.addEntity(
            "PurpleLight",
            vec3.fromValues(0.0, 5, 10.0)
        );

        const e_yellowlight = this.MAIN_SCENE.addEntity(
            "YellowLight",
            vec3.fromValues(-8.0, 4, -8.0),
            vec3.fromValues(0.0, 140.0, -50.0)
        );

        const e_whitelight = this.MAIN_SCENE.addEntity(
            "WhiteLight",
            vec3.fromValues(7.0, 4, 10.0)
        );

        const e_flashlight = this.MAIN_SCENE.addEntity(
            "FlashLight",
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(0.0, 0.0, 0.0)
        );

        const e_cube_1 = this.MAIN_SCENE.addEntity(
            "Cube1",
            vec3.fromValues(0.0, 1.0, -10.0), 
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(1.0, 1.0, 1.0)
        );
        const e_cube_2 = this.MAIN_SCENE.addEntity(
            "Cube2",
            vec3.fromValues(4.0, 0.2, 3.0), 
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(0.2, 0.2, 0.2)
        );
        const e_cube_3 = this.MAIN_SCENE.addEntity(
            "Cube3",
            vec3.fromValues(3.0, 0.4, -2.5), 
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(0.4, 0.4, 0.4)
        );
        const e_cube_4 = this.MAIN_SCENE.addEntity(
            "Cube4",
            vec3.fromValues(-5.0, 0.7, 2.0), 
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(0.7, 0.7, 0.7)
        );

        const e_cube_5 = this.MAIN_SCENE.addEntity(
            "Cube5",
            vec3.fromValues(0.0, 2.0, 10.0), 
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(1.5, 1.5, 1.5)
        );

        // Create meshs from vert/ind
        const msh_plane = new Mesh(this.GL_CONTEXT, PLANE_VERTICES, PLANE_INDICES);
        const msh_cube = new Mesh(this.GL_CONTEXT, CUBE_VERTICES, CUBE_INDICES);

        // Create shader to render material with
        const sdr_standard = new Shader(this.GL_CONTEXT, vertexShaderSourceCode, fragmentShaderSourceCode);
        const sdr_skybox = new Shader(this.GL_CONTEXT, skyboxVertSdrSourceCode, skyboxFragSdrSourceCode);

        // Create material to render model with
        const mat_grass = new Material(sdr_standard);
        mat_grass.setTex(0, loadTexture(this.GL_CONTEXT, "textures/grass.png"));
        
        const mat_stone = new Material(sdr_standard);
        mat_stone.setTex(0, loadTexture(this.GL_CONTEXT, "textures/stone.png")); 
    
        const mat_brick = new Material(sdr_standard);
        mat_brick.setTex(0, loadTexture(this.GL_CONTEXT, "textures/brick.png")); 

        const mat_face = new Material(sdr_standard);
        mat_face.setTex(0, loadTexture(this.GL_CONTEXT, "textures/me.jpg")); 

        const mat_gata = new Material(sdr_standard);
        mat_gata.setTex(0, loadTexture(this.GL_CONTEXT, "textures/geoff.jpg")); 

        const mat_skybox = new Material(sdr_skybox, true);

        const mat_tiles = new Material(sdr_standard);
        mat_tiles.setTex(0, loadTexture(this.GL_CONTEXT, "textures/tiles_diff.jpg")); 
        mat_tiles.setTex(1, loadTexture(this.GL_CONTEXT, "textures/tiles_spec.png")); 
        mat_tiles.setTex(2, loadTexture(this.GL_CONTEXT, "textures/tiles_norm.jpg")); 
        mat_tiles.setTex(3, loadTexture(this.GL_CONTEXT, "textures/tiles_emis.jpg")); 

        // Create models from meshs (make modelcomponent house materials)
        const mod_plane = new Model(mat_grass, msh_plane);
        const mod_cube_1 = new Model(mat_face, msh_cube);
        const mod_cube_2 = new Model(mat_stone, msh_cube);
        const mod_cube_3 = new Model(mat_gata, msh_cube);
        const mod_cube_4 = new Model(mat_brick, msh_cube);
        const mod_cube_5 = new Model(mat_tiles, msh_cube);
        const mod_skybox = new Model(mat_skybox, msh_cube);

        // Add model components to entities (trying to maintain ECS-ish)
        e_plane.addComponent(ModelComponent, new ModelComponent(mod_plane));
        e_cube_1.addComponent(ModelComponent, new ModelComponent(mod_cube_1));
        e_cube_2.addComponent(ModelComponent, new ModelComponent(mod_cube_2));
        e_cube_3.addComponent(ModelComponent, new ModelComponent(mod_cube_3));
        e_cube_4.addComponent(ModelComponent, new ModelComponent(mod_cube_4));
        e_cube_5.addComponent(ModelComponent, new ModelComponent(mod_cube_5));
        e_skybox.addComponent(ModelComponent, new ModelComponent(mod_skybox));

        e_cube_1.addScript(new MeshRotate());
        e_cube_2.addScript(new MeshRotate());
        e_cube_3.addScript(new MeshRotate());
        e_cube_4.addScript(new MeshRotate());
        e_cube_5.addScript(new MeshRotate());
    
        e_camera.addComponent(CameraComponent, new CameraComponent());
        e_player.addChildEntity(e_camera);
        e_player.addScript(new PlayerMovement());
        (e_player.getScript("PlayerMovement") as PlayerMovement).flashlight = e_flashlight;
        e_camera.addScript(new CameraController());
    
        e_sun.addComponent(LightComponent, new LightComponent(0, vec3.fromValues(1.0, 1.0, 1.0), 0.2)); // default light
        e_redlight.addComponent(LightComponent, new LightComponent(1, vec3.fromValues(1.0, 0.0, 0.0), 5.0));
        e_greenlight.addComponent(LightComponent, new LightComponent(2, vec3.fromValues(0.0, 1.0, 0.0), 5.0));
        e_bluelight.addComponent(LightComponent, new LightComponent(1, vec3.fromValues(0.0, 0.0, 1.0), 5.0));
        e_purplelight.addComponent(LightComponent, new LightComponent(1, vec3.fromValues(0.5, 0.0, 1.0), 5.0));
        e_yellowlight.addComponent(LightComponent, new LightComponent(2, vec3.fromValues(1.0, 1.0, 0.0), 5.0));
        e_whitelight.addComponent(LightComponent, new LightComponent(1, vec3.fromValues(1.0, 1.0, 1.0), 1.0));
        e_flashlight.addComponent(LightComponent, new LightComponent(2, vec3.fromValues(1.0, 1.0, 1.0), 5.0));
        e_camera.addChildEntity(e_flashlight);
    }

    override Start(): void
    {
        this.Setup();
        this.MAIN_SCENE.Start();
    }

    override Update(): void
    {
        this.MAIN_SCENE.Update();
    }

}