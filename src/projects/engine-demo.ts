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

        const e_player = this.MAIN_SCENE.addEntity("Player", vec3.fromValues(0.0, 0.0, 0.0));
        const e_camera = this.MAIN_SCENE.addEntity("Camera", vec3.fromValues(0.0, 2.0, 0.0));
        const e_sun = this.MAIN_SCENE.addEntity(
            "Sun",
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(-60.0, -20.0, -40.0)
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

        // Create meshs from vert/ind
        const msh_plane = new Mesh(this.GL_CONTEXT, PLANE_VERTICES, PLANE_INDICES);
        const msh_cube = new Mesh(this.GL_CONTEXT, CUBE_VERTICES, CUBE_INDICES);

        // Create shader to render material with
        const sdr_standard = new Shader(this.GL_CONTEXT, vertexShaderSourceCode, fragmentShaderSourceCode);

        // Create material to render model with
        const mat_grass = new Material(sdr_standard);
        mat_grass.setTex(0, loadTexture(this.GL_CONTEXT, "textures/grass.png"));
        
        const mat_stone = new Material(sdr_standard);
        mat_stone.setTex(0, loadTexture(this.GL_CONTEXT, "textures/stone.png")); 
    
        const mat_brick = new Material(sdr_standard);
        mat_brick.setTex(0, loadTexture(this.GL_CONTEXT, "textures/brick.png")); 

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
        e_player.addScript(PlayerMovement);
    
        e_sun.addComponent(LightComponent, new LightComponent()); // default light
    }

    override Start(): void
    {
        this.Setup();
        // Every script start
        this.MAIN_SCENE.Start();
    }

    override Update(): void
    {
        this.MAIN_SCENE.Update();
    }

}