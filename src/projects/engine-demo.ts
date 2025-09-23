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
import { Entity } from "../gameobjects/entity";

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

        // Setup Materials
        // Create shader to render material with
        const sdr_standard = new Shader(this.GL_CONTEXT, vertexShaderSourceCode, fragmentShaderSourceCode);
        const sdr_skybox = new Shader(this.GL_CONTEXT, skyboxVertSdrSourceCode, skyboxFragSdrSourceCode);

        // Create material to render model with
        const mat_skybox = new Material(sdr_skybox, true);
        this.MAIN_SCENE.skybox = mat_skybox.getTex(0);

        const mat_grass = new Material(sdr_standard);
        mat_grass.setAllTextures(
            "textures/mud/mud_diff.png",
            "textures/mud/mud_spec.png",
            "textures/mud/mud_norm.png",
            null, 0.5, 0.9
        );

        const mat_wood = new Material(sdr_standard);
        mat_wood.setAllTextures(
            "textures/wood/wood_diff.png",
            "textures/wood/wood_spec.png",
            "textures/wood/wood_norm.png",
            null, 0.5, 0.9
        );
        
        const mat_stone = new Material(sdr_standard);
        mat_stone.setAllTextures("textures/stone.png");
    
        const mat_brick = new Material(sdr_standard);
        mat_brick.setAllTextures("textures/brick.png");

        const mat_tiles = new Material(sdr_standard);
        mat_tiles.setAllTextures(
            "textures/tiles_diff.jpg",
            "textures/tiles_spec.png",
            "textures/tiles_norm.jpg",
            "textures/tiles_emis.jpg",
            0.5, 0.9, 50.0
        );

        const mat_skull = new Material(sdr_standard);
        mat_skull.setAllTextures(
            "textures/skull/skull_diff.png",
            "textures/skull/skull_spec.png",
            "textures/skull/skull_norm.png",
            "textures/skull/skull_emis.png",
            1.0, 0.2, 2.0
        );

        const mat_flash = new Material(sdr_standard);
        mat_flash.setAllTextures(
            "textures/flashlight/flashlight_diff.png",
            "textures/flashlight/flashlight_spec.png",
            "textures/flashlight/flashlight_norm.png",
            "textures/flashlight/flashlight_emis.png",
            1.0, 0.5, 2.0
        );

        const mat_farm = new Material(sdr_standard);
        mat_farm.setAllTextures(
            "textures/farm/farm_diff.png",
            "textures/farm/farm_spec.png",
            "textures/farm/farm_norm.png",
            null, 1.0, 0.9
        );

        const mat_oldstone = new Material(sdr_standard);
        mat_oldstone.setAllTextures(
            "textures/oldstone/oldstone_diff.png",
            "textures/oldstone/oldstone_spec.png",
            "textures/oldstone/oldstone_norm.png",
            null, 1.0, 0.5
        );

        const mat_emis_red = new Material(sdr_standard);
        mat_emis_red.setAllTextures(
            null,
            null,
            null,
            "textures/default_diffuse.png", 0.0, 1.0, 20.0,
            vec3.fromValues(1.0, 0.0, 0.0)
        );

        const mat_emis_green = new Material(sdr_standard);
        mat_emis_green.setAllTextures(
            null,
            null,
            null,
            "textures/default_diffuse.png", 0.0, 1.0, 20.0,
            vec3.fromValues(0.0, 1.0, 0.0)
        );

        const mat_emis_blue = new Material(sdr_standard);
        mat_emis_blue.setAllTextures(
            null,
            null,
            null,
            "textures/default_diffuse.png", 0.0, 1.0, 20.0,
            vec3.fromValues(0.0, 0.0, 1.0)
        );

        const mat_emis_white = new Material(sdr_standard);
        mat_emis_white.setAllTextures(
            null,
            null,
            null,
            "textures/default_diffuse.png", 0.0, 1.0, 20.0,
            vec3.fromValues(1.0, 1.0, 1.0)
        );


        // Place Entities

        const e_planes: Entity[] = new Array(9);
        const e_planes_mesh: Entity[] = new Array(9);

        for (let i = 0; i < 3; i++)
        {
            const z = -100 + (i * 100);
            for (let j = 0; j < 3; j++)
            {
                const index = i * 3 + j;
                const x = -100 + (j * 100);

                e_planes[index] = this.MAIN_SCENE.importModel(
                    `Plane${index}`,
                    vec3.fromValues(x, 0.0, z), 
                    vec3.fromValues(0.0, 0.0, 0.0),
                    vec3.fromValues(1.0, 1.0, 1.0),
                    mat_grass, "models/big_plane.json"
                );
            }
        }

        const e_farm = this.MAIN_SCENE.importModel(
            "Farm",
            vec3.fromValues(30.0, 3.6, -20.0),
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(1.0, 1.0, 1.0),
            mat_farm, "models/farm.json"
        );

        const e_player = this.MAIN_SCENE.addEntity("Player", vec3.fromValues(0.0, 0.0, 0.0));
        const e_camera = this.MAIN_SCENE.addEntity("Camera", vec3.fromValues(0.0, 2.0, 0.0));
        const e_skybox = this.MAIN_SCENE.addEntity("Skybox", vec3.fromValues(0.0, 0.0, 0.0));
        const e_sun = this.MAIN_SCENE.addEntity(
            "Sun",
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(-60.0, 5.0, 0.0)
        );

        const e_redlight = this.MAIN_SCENE.addEntity(
            "RedLight",
            vec3.fromValues(0.0, 0.0, 0.0)
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

        const e_flashlight_obj = this.MAIN_SCENE.importModel(
            "FlashLightObj",
            vec3.fromValues(0.5, -0.5, -1.0),
            vec3.fromValues(5.0, 5.0, 0.0),
            vec3.fromValues(1.0, 1.0, 1.0),
            mat_flash, "models/flashlight.json",
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(0.0, 180.0, 90.0),
            vec3.fromValues(0.05, 0.05, 0.05)
        );

        const e_flashlight = this.MAIN_SCENE.addEntity(
            "FlashLight",
            vec3.fromValues(0.0, 0.0, 5.0),
            vec3.fromValues(0.0, 180.0, 0.0)
        );

        e_flashlight_obj.getChildEntity("FlashLightObjMesh")!.addChildEntity(e_flashlight);
        e_flashlight.setActive(false);

        const e_cube_1 = this.MAIN_SCENE.importModel(
            "Cube1",
            vec3.fromValues(10.0, 1.0, -10.0),
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(1.0, 1.0, 1.0),
            mat_wood, "models/cube.json"
        );

        const e_cube_2 = this.MAIN_SCENE.importModel(
            "Cube2",
            vec3.fromValues(4.0, 0.2, 3.0),
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(0.2, 0.2, 0.2),
            mat_stone, "models/cube.json"
        );

        const e_cube_3 = this.MAIN_SCENE.importModel(
            "Cube3",
            vec3.fromValues(3.0, 0.4, -2.5),
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(0.4, 0.4, 0.4),
            mat_wood, "models/cube.json"
        );

        const e_cube_4 = this.MAIN_SCENE.importModel(
            "Cube4",
            vec3.fromValues(-5.0, 0.7, 2.0),
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(0.7, 0.7, 0.7),
            mat_brick, "models/cube.json"
        );

        const e_cube_5 = this.MAIN_SCENE.importModel(
            "Cube5",
            vec3.fromValues(0.0, 2.0, 10.0), 
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(1.5, 1.5, 1.5),
            mat_tiles, "models/cube.json"
        );

        const e_skull = this.MAIN_SCENE.importModel(
            "Skull",
            vec3.fromValues(15.0, 2.0, 0.0), 
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(1.0, 1.0, 1.0),
            mat_skull, "models/skull.json",
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(0.0, 0.0, 0.0)
        );

        const e_sphere_white = this.MAIN_SCENE.importModel(
            "Sphere",
            vec3.fromValues(-20.0, 0.0, -12.0), 
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(0.5, 0.5, 0.5),
            mat_emis_white, "models/sphere.json"
        );
        //e_sphere_white.addChildEntity(e_redlight);

        const e_sphere_red = this.MAIN_SCENE.importModel(
            "Sphere",
            vec3.fromValues(-20.0, 0.0, -6.0), 
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(0.5, 0.5, 0.5),
            mat_emis_red, "models/sphere.json"
        );
        //e_sphere_red.addChildEntity(e_redlight);

        const e_sphere_green = this.MAIN_SCENE.importModel(
            "Sphere",
            vec3.fromValues(-20.0, 0.0, 0.0), 
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(0.5, 0.5, 0.5),
            mat_emis_green, "models/sphere.json"
        );
        //e_sphere_green.addChildEntity(e_redlight);

        const e_sphere_blue = this.MAIN_SCENE.importModel(
            "Sphere",
            vec3.fromValues(-20.0, 0.0, 6.0), 
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(0.5, 0.5, 0.5),
            mat_emis_blue, "models/sphere.json"
        );
        //e_sphere_blue.addChildEntity(e_redlight);

        const e_pole = this.MAIN_SCENE.importModel(
            "Pole",
            vec3.fromValues(-50.0, 0.0, 50.0),
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(2.0, 2.0, 2.0),
            mat_wood, "models/POWERPOLES.json",
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(0.0, 0.0, 0.0)
        );

        const e_tunnel = this.MAIN_SCENE.importModel(
            "Tunnel",
            vec3.fromValues(0.0, 4.0, -50.0), 
            vec3.fromValues(0.0, 180.0, 0.0),
            vec3.fromValues(0.7, 0.7, 0.7),
            mat_oldstone, "models/Tunnel.json"
        );

    
        // Create models from meshs (make modelcomponent house materials)
        const mod_skybox = new Model("models/cube.json", mat_skybox, null);
        
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
        e_skull.addScript(lookAtScript);
    
        e_sun.addComponent(LightComponent, new LightComponent(0, vec3.fromValues(1.0, 1.0, 1.0), 1.0, true)); // default light
        e_redlight.addComponent(LightComponent, new LightComponent(1, vec3.fromValues(1.0, 1.0, 1.0), 2.0));
        //e_greenlight.addComponent(LightComponent, new LightComponent(2, vec3.fromValues(0.0, 1.0, 0.0), 0.0));
        //e_bluelight.addComponent(LightComponent, new LightComponent(1, vec3.fromValues(0.0, 0.3, 1.0), 0.0));
        //e_purplelight.addComponent(LightComponent, new LightComponent(1, vec3.fromValues(0.5, 0.0, 1.0), 0.0));
        //e_yellowlight.addComponent(LightComponent, new LightComponent(2, vec3.fromValues(1.0, 1.0, 0.0), 0.0));
        //e_whitelight.addComponent(LightComponent, new LightComponent(1, vec3.fromValues(1.0, 1.0, 1.0), 0.0));
        e_flashlight.addComponent(LightComponent, new LightComponent(2, vec3.fromValues(1.0, 1.0, 0.5), 1.0));
        //e_whitePtlight.addComponent(LightComponent, new LightComponent(1, vec3.fromValues(1.0, 0.0, 1.0), 0.0));
        //e_skullLight.addComponent(LightComponent, new LightComponent(1, vec3.fromValues(0.5, 0.0, 1.0), 0.0));
        e_camera.addChildEntity(e_flashlight_obj);
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