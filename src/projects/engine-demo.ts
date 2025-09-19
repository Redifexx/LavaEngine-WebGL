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
import { LookAtPlayer } from "../scripts/lookAtPlayer";

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
        const e_plane_mesh = this.MAIN_SCENE.addEntity(
            "PlaneMesh",
            vec3.fromValues(0.0, 0.0, 0.0), 
            vec3.fromValues(-90.0, 0.0, 0.0)
        );
        e_plane.addChildEntity(e_plane_mesh);

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
            vec3.fromValues(10.0, 5.0, -15.0),
            vec3.fromValues(-90.0, -10.0, -10.0)
        );

        const e_greenlight = this.MAIN_SCENE.addEntity(
            "GreenLight",
            vec3.fromValues(-2.0, 3.0, 8.0),
            vec3.fromValues(-15.0, 0.0, 0.0)
        );

        const e_bluelight = this.MAIN_SCENE.addEntity(
            "BlueLight",
            vec3.fromValues(6.0, 3, 1.0)
        );

        const e_purplelight = this.MAIN_SCENE.addEntity(
            "PurpleLight",
            vec3.fromValues(0.0, 5, 15.0)
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

        const e_whitePtlight = this.MAIN_SCENE.addEntity(
            "WhitePtLight",
            vec3.fromValues(32.0, 4.0, 32.0)
        );

        const e_skullLight = this.MAIN_SCENE.addEntity(
            "SkullLight"
        );

        const e_flashlight = this.MAIN_SCENE.addEntity(
            "FlashLight",
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(0.0, 0.0, 0.0)
        );
        e_flashlight.setActive(false);

        const e_cube_1_mesh = this.MAIN_SCENE.addEntity(
            "Cube1Mesh",
            vec3.fromValues(0.0, 0.0, 0.0), 
            vec3.fromValues(-90.0, 0.0, 0.0)
        );
        const e_cube_2_mesh = this.MAIN_SCENE.addEntity(
            "Cube2Mesh",
            vec3.fromValues(0.0, 0.0, 0.0), 
            vec3.fromValues(-90.0, 0.0, 0.0)
        );
        const e_cube_3_mesh = this.MAIN_SCENE.addEntity(
            "Cube3Mesh",
            vec3.fromValues(0.0, 0.0, 0.0), 
            vec3.fromValues(-90.0, 0.0, 0.0)
        );
        const e_cube_4_mesh = this.MAIN_SCENE.addEntity(
            "Cube4Mesh",
            vec3.fromValues(0.0, 0.0, 0.0), 
            vec3.fromValues(-90.0, 0.0, 0.0)
        );
        const e_cube_5_mesh = this.MAIN_SCENE.addEntity(
            "Cube5Mesh",
            vec3.fromValues(0.0, 0.0, 0.0), 
            vec3.fromValues(-90.0, 0.0, 0.0)
        );
        const e_skull_mesh = this.MAIN_SCENE.addEntity(
            "SkullMesh",
            vec3.fromValues(0.0, 0.0, 0.0), 
            vec3.fromValues(0.0, 0.0, 0.0)
        );
        
        const e_cube_1 = this.MAIN_SCENE.addEntity(
            "Cube1",
            vec3.fromValues(0.0, 1.0, -10.0), 
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(1.0, 1.0, 1.0)
        );
        e_cube_1.addChildEntity(e_cube_1_mesh);

        const e_cube_2 = this.MAIN_SCENE.addEntity(
            "Cube2",
            vec3.fromValues(4.0, 0.2, 3.0), 
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(0.2, 0.2, 0.2)
        );
        e_cube_2.addChildEntity(e_cube_2_mesh);

        const e_cube_3 = this.MAIN_SCENE.addEntity(
            "Cube3",
            vec3.fromValues(3.0, 0.4, -2.5), 
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(0.4, 0.4, 0.4)
        );
        e_cube_3.addChildEntity(e_cube_3_mesh);

        const e_cube_4 = this.MAIN_SCENE.addEntity(
            "Cube4",
            vec3.fromValues(-5.0, 0.7, 2.0), 
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(0.7, 0.7, 0.7)
        );
        e_cube_4.addChildEntity(e_cube_4_mesh);

        const e_cube_5 = this.MAIN_SCENE.addEntity(
            "Cube5",
            vec3.fromValues(0.0, 2.0, 10.0), 
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(1.5, 1.5, 1.5)
        );
        e_cube_5.addChildEntity(e_cube_5_mesh);

        const e_skull = this.MAIN_SCENE.addEntity(
            "Skull",
            vec3.fromValues(0.0, 2.0, 0.0), 
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(1.0, 1.0, 1.0)
        );
        e_skull.addChildEntity(e_skull_mesh);

        // Create shader to render material with
        const sdr_standard = new Shader(this.GL_CONTEXT, vertexShaderSourceCode, fragmentShaderSourceCode);
        const sdr_skybox = new Shader(this.GL_CONTEXT, skyboxVertSdrSourceCode, skyboxFragSdrSourceCode);

        // Create material to render model with
        const mat_skybox = new Material(sdr_skybox, true);
        this.MAIN_SCENE.skybox = mat_skybox.getTex(0);

        const mat_grass = new Material(sdr_standard);
        mat_grass.setTex(0, loadTexture(this.GL_CONTEXT, "textures/meadow_diffuse.png", this.GL_CONTEXT.SRGB8_ALPHA8, this.GL_CONTEXT.TEXTURE_2D, true));
        mat_grass.setTex(1, loadTexture(this.GL_CONTEXT, "textures/meadow_spec.png"));
        mat_grass.specularFactor = 1.0;
        mat_grass.roughnessFactor = 0.9;
        
        const mat_stone = new Material(sdr_standard);
        mat_stone.setTex(0, loadTexture(this.GL_CONTEXT, "textures/stone.png", this.GL_CONTEXT.SRGB8_ALPHA8));
    
        const mat_brick = new Material(sdr_standard);
        mat_brick.setTex(0, loadTexture(this.GL_CONTEXT, "textures/brick.png", this.GL_CONTEXT.SRGB8_ALPHA8)); 

        const mat_face = new Material(sdr_standard);
        mat_face.setTex(0, loadTexture(this.GL_CONTEXT, "textures/me.jpg", this.GL_CONTEXT.SRGB8_ALPHA8)); 
        mat_face.specularFactor = 0.5;
        mat_face.roughnessFactor = 0.5;

        const mat_gata = new Material(sdr_standard);
        mat_gata.setTex(0, loadTexture(this.GL_CONTEXT, "textures/geoff.jpg", this.GL_CONTEXT.SRGB8_ALPHA8)); 

        const mat_tiles = new Material(sdr_standard);
        mat_tiles.setTex(0, loadTexture(this.GL_CONTEXT, "textures/tiles_diff.jpg", this.GL_CONTEXT.SRGB8_ALPHA8)); 
        mat_tiles.setTex(1, loadTexture(this.GL_CONTEXT, "textures/tiles_spec.png")); 
        mat_tiles.setTex(2, loadTexture(this.GL_CONTEXT, "textures/tiles_norm.jpg")); 
        mat_tiles.setTex(3, loadTexture(this.GL_CONTEXT, "textures/tiles_emis.jpg", this.GL_CONTEXT.SRGB8_ALPHA8)); 
        mat_tiles.specularFactor = 1.0;
        mat_tiles.roughnessFactor = 0.5;
        mat_tiles.emissiveFactor = 1.0;

        const mat_skull = new Material(sdr_standard);
        mat_skull.setTex(0, loadTexture(this.GL_CONTEXT, "textures/skull/skull_diff.png", this.GL_CONTEXT.SRGB8_ALPHA8)); 
        mat_skull.setTex(1, loadTexture(this.GL_CONTEXT, "textures/skull/skull_spec.png")); 
        mat_skull.setTex(2, loadTexture(this.GL_CONTEXT, "textures/skull/skull_norm.png")); 
        mat_skull.setTex(3, loadTexture(this.GL_CONTEXT, "textures/skull/skull_emis.png", this.GL_CONTEXT.SRGB8_ALPHA8)); 
        mat_skull.specularFactor = 1.0;
        mat_skull.roughnessFactor = 0.2;
        mat_skull.emissiveFactor = 1.0;

        // Create models from meshs (make modelcomponent house materials)
        //const mod_plane = new Model(null, mat_grass, msh_plane);
        const mod_plane = new Model("models/plane.json", mat_grass, null);
        const mod_cube_1 = new Model("models/cube.json", mat_face, null);
        const mod_cube_2 = new Model("models/Monkey.json", mat_stone, null);
        const mod_cube_3 = new Model("models/cube.json", mat_gata, null);
        const mod_cube_4 = new Model("models/cube.json", mat_brick, null);
        const mod_cube_5 = new Model("models/cube.json", mat_tiles, null);
        const mod_skull = new Model("models/skull.json", mat_skull, null);
        const mod_skybox = new Model("models/cube.json", mat_skybox, null);

        // Add model components to entities (trying to maintain ECS-ish)
        e_plane_mesh.addComponent(ModelComponent, new ModelComponent(mod_plane));
        e_cube_1_mesh.addComponent(ModelComponent, new ModelComponent(mod_cube_1));
        e_cube_2_mesh.addComponent(ModelComponent, new ModelComponent(mod_cube_2));
        e_cube_3_mesh.addComponent(ModelComponent, new ModelComponent(mod_cube_3));
        e_cube_4_mesh.addComponent(ModelComponent, new ModelComponent(mod_cube_4));
        e_cube_5_mesh.addComponent(ModelComponent, new ModelComponent(mod_cube_5));
        e_skull_mesh.addComponent(ModelComponent, new ModelComponent(mod_skull));
        e_skybox.addComponent(ModelComponent, new ModelComponent(mod_skybox, false));

        e_cube_1.addScript(new MeshRotate());
        e_cube_2.addScript(new MeshRotate());
        e_cube_3.addScript(new MeshRotate());
        e_cube_4.addScript(new MeshRotate());
        e_cube_5.addScript(new MeshRotate());
    
        e_camera.addComponent(CameraComponent, new CameraComponent());

        e_player.addChildEntity(e_camera);
        const playerMoveScript = new PlayerMovement();
        e_player.addScript(playerMoveScript);
        (e_player.getScript("PlayerMovement") as PlayerMovement).flashlight = e_flashlight;
        e_camera.addScript(new CameraController());


        const lookAtScript = new LookAtPlayer(e_player.getGlobalTransform());
        lookAtScript.player = e_player;
        //e_skull.addScript(lookAtScript);
    
        e_sun.addComponent(LightComponent, new LightComponent(0, vec3.fromValues(1.0, 1.0, 1.0), 1.0, true)); // default light
        e_redlight.addComponent(LightComponent, new LightComponent(1, vec3.fromValues(1.0, 0.0, 0.0), 4.0));
        e_greenlight.addComponent(LightComponent, new LightComponent(2, vec3.fromValues(0.0, 1.0, 0.0), 3.0));
        e_bluelight.addComponent(LightComponent, new LightComponent(1, vec3.fromValues(0.0, 0.3, 1.0), 2.0));
        e_purplelight.addComponent(LightComponent, new LightComponent(1, vec3.fromValues(0.5, 0.0, 1.0), 4.0));
        e_yellowlight.addComponent(LightComponent, new LightComponent(2, vec3.fromValues(1.0, 1.0, 0.0), 3.0));
        e_whitelight.addComponent(LightComponent, new LightComponent(1, vec3.fromValues(1.0, 1.0, 1.0), 1.0));
        e_flashlight.addComponent(LightComponent, new LightComponent(2, vec3.fromValues(1.0, 1.0, 1.0), 3.0));
        e_whitePtlight.addComponent(LightComponent, new LightComponent(1, vec3.fromValues(1.0, 1.0, 1.0), 1.0));
        e_skullLight.addComponent(LightComponent, new LightComponent(1, vec3.fromValues(0.5, 0.0, 1.0), 10.0));
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