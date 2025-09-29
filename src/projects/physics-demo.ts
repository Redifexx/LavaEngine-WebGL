import { glMatrix, vec3 } from "gl-matrix";
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
import { CameraFlightController } from "../scripts/cameraFlightController";
import { ColliderComponent, ColliderType } from "../components/collider-component";
import { RigidbodyComponent } from "../components/rigidbody-component";
import { PlayerRBMovement } from "../scripts/playerRBMovement";
import { LavaEngine } from "../engine/lava-engine";
import { BallSpawn } from "../scripts/ballSpawn";

export class PhysicsDemo extends Project
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
            "textures/grass/grass_diff.png",
            "textures/grass/grass_spec.png",
            "textures/grass/grass_norm.png",
            null, 0.5, 0.9
        );

        const mat_wood = new Material(sdr_standard);
        mat_wood.setAllTextures(
            "textures/wood/wood_diff.png",
            "textures/wood/wood_spec.png",
            "textures/wood/wood_norm.png",
            null, 0.5, 0.9
        );

        const mat_diamond = new Material(sdr_standard);
        mat_diamond.setAllTextures(
            "textures/rock/rock_diff.jpg",
            "textures/rock/rock_spec.jpg",
            "textures/rock/rock_norm.jpg",
            null,
            1.0, 0.9, null, null
        );

        // Place Cubes
        const e_plane = this.MAIN_SCENE.importModel(
            `Plane`,
            vec3.fromValues(0.0, 0.0, 0.0), 
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(1.0, 1.0, 1.0),
            mat_grass, "./models/big_plane.json"
        );
        const col_plane = new ColliderComponent(ColliderType.BOX, vec3.fromValues(50.0, 1.0, 50.0), vec3.fromValues(0.0, -1.0, 0.0));
        e_plane.addComponent(ColliderComponent, col_plane);

        const rb_plane = new RigidbodyComponent(e_plane, 0, false, 0.6);
        e_plane.addComponent(RigidbodyComponent, rb_plane);

        // Place Cubes
        const e_wall_1 = this.MAIN_SCENE.importModel(
            `Wall1`,
            vec3.fromValues(20.0, 5.0, 0.0), 
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(1.0, 20.0, 5.0),
            mat_grass, "./models/cube.json"
        );
        const col_wall_1 = new ColliderComponent(ColliderType.BOX, vec3.fromValues(1.0, 5.0, 20.0), vec3.fromValues(0.0, 0.0, 0.0));
        e_wall_1.addComponent(ColliderComponent, col_wall_1);

        const rb_wall_1 = new RigidbodyComponent(e_wall_1, 0, false, 0.6);
        e_wall_1.addComponent(RigidbodyComponent, rb_wall_1);

        const e_wall_2 = this.MAIN_SCENE.importModel(
            `Wall2`,
            vec3.fromValues(-20.0, 5.0, 0.0), 
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(1.0, 20.0, 5.0),
            mat_grass, "./models/cube.json"
        );
        const col_wall_2 = new ColliderComponent(ColliderType.BOX, vec3.fromValues(1.0, 5.0, 20.0), vec3.fromValues(0.0, 0.0, 0.0));
        e_wall_2.addComponent(ColliderComponent, col_wall_2);

        const rb_wall_2 = new RigidbodyComponent(e_wall_2, 0, false, 0.6);
        e_wall_2.addComponent(RigidbodyComponent, rb_wall_2);


        const e_wall_3 = this.MAIN_SCENE.importModel(
            `Wall3`,
            vec3.fromValues(0.0, 5.0, 20.0), 
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(20.0, 1.0, 5.0),
            mat_grass, "./models/cube.json"
        );
        const col_wall_3 = new ColliderComponent(ColliderType.BOX, vec3.fromValues(20.0, 5.0, 1.0), vec3.fromValues(0.0, 0.0, 0.0));
        e_wall_3.addComponent(ColliderComponent, col_wall_3);

        const rb_wall_3 = new RigidbodyComponent(e_wall_3, 0, false, 0.6);
        e_wall_3.addComponent(RigidbodyComponent, rb_wall_3);

        
        const e_wall_4 = this.MAIN_SCENE.importModel(
            `Wall4`,
            vec3.fromValues(0.0, 5.0, -20.0), 
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(20.0, 1.0, 5.0),
            mat_grass, "./models/cube.json"
        );
        const col_wall_4 = new ColliderComponent(ColliderType.BOX, vec3.fromValues(20.0, 5.0, 1.0), vec3.fromValues(0.0, 0.0, 0.0));
        e_wall_4.addComponent(ColliderComponent, col_wall_4);

        const rb_wall_4 = new RigidbodyComponent(e_wall_4, 0, false, 0.6);
        e_wall_4.addComponent(RigidbodyComponent, rb_wall_4);
        

        const e_camera = this.MAIN_SCENE.addEntity(
            "Camera",
            vec3.fromValues(0.0, 1.6, 0.0),
            vec3.fromValues(0.0, 0.0, 0.0)
        );

        const e_player = this.MAIN_SCENE.addEntity(
            "Player",
            vec3.fromValues(0.0, 10.0, 10.0),
            vec3.fromValues(0.0, 0.0, 0.0)
        );
        e_player.addChildEntity(e_camera);

        const col_player = new ColliderComponent(ColliderType.CAPSULE, null, null, 2.0, 0.5);
        e_player.addComponent(ColliderComponent, col_player);

        const rb_player = new RigidbodyComponent(e_player, 1.0, false);
        e_player.addComponent(RigidbodyComponent, rb_player);


        const e_skybox = this.MAIN_SCENE.addEntity("Skybox", vec3.fromValues(0.0, 0.0, 0.0));
        const e_sun = this.MAIN_SCENE.addEntity(
            "Sun",
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(-60.0, 5.0, 0.0)
        );

        /*
        const e_cubes: Entity[] = [];
        for (let i = 3; i < 250; i++)
        {
            for (let j = 0; j < 1; j++)
            {
                const cube = this.MAIN_SCENE.importModel(
                    `Cube`,
                    vec3.fromValues(0.0, i * 3.0, 0),
                    vec3.fromValues(0.0, 0.0, 0.0),
                    vec3.fromValues(1.0, 1.0, 1.0),
                    mat_diamond, "./models/sphere.json"
                );

                const col_cube = new ColliderComponent(ColliderType.SPHERE, vec3.fromValues(0.5, 0.5, 0.5));
                cube.addComponent(ColliderComponent, col_cube);

                const rb_cube = new RigidbodyComponent(cube, 0.1);
                cube.addComponent(RigidbodyComponent, rb_cube);

                e_cubes.push(cube);
            }
        }
        */

        // Create models from meshs (make modelcomponent house materials)
        const mod_skybox = new Model("./models/cube.json", mat_skybox, null);
        
        e_skybox.addComponent(ModelComponent, new ModelComponent(mod_skybox, false));
    
        e_camera.addComponent(CameraComponent, new CameraComponent());

        e_camera.addScript(new CameraController());
        e_player.addScript(new PlayerRBMovement());
        e_player.addScript(new BallSpawn(mat_diamond));

        LavaEngine.physics.World.setGravity(new LavaEngine.physics.Ammo.btVector3(0, -20, 0));

    
        e_sun.addComponent(LightComponent, new LightComponent(0, vec3.fromValues(1.0, 1.0, 1.0), 0.2, true)); // default light
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

    override FixedUpdate(): void
    {
        this.MAIN_SCENE.FixedUpdate();
    }
}