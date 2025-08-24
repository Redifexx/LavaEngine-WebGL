import { vec3 } from "gl-matrix";
import { Entity } from "./entity";
import { ModelComponent } from "../components/model-component";
import { TransformComponent } from "../components/transform-component";
import { LightComponent, LightType } from "../components/light-component";
import { eulerToDirection } from "../gl-utils";
import { Material } from "../datatypes/material";
import { Camera } from "../datatypes/camera";
import { CameraComponent } from "../components/camera-component";


export class Scene 
{
    gl: WebGL2RenderingContext;
    entities: Entity[] = [];
    mainCamera: CameraComponent | null;

    // efficient rendering
    modelsByMaterial: Map<Material, ModelComponent[]> = new Map();

    constructor(gl: WebGL2RenderingContext)
    {
        this.gl = gl;
    }

    addEntity(
        pos: vec3 = vec3.fromValues(0.0, 0.0, 0.0),
        rotation: vec3 = vec3.fromValues(0.0, 0.0, 0.0),
        scale: vec3 = vec3.fromValues(1.0, 1.0, 1.0)
    )
    {
        const newEntity = new Entity(this.entities.length, this, pos, rotation, scale);
        this.entities.push(newEntity);
        this.updateEntity(newEntity);
        return newEntity;
    }

    updateEntity(newEntity: Entity)
    {
        console.log("cam update");
        for (let i = 0; i < this.entities.length; i++)
        {
            if (this.entities[i] === newEntity)
            {
                console.log("main cam " + this.mainCamera);
                if (newEntity.hasComponent(ModelComponent))
                {
                    console.log("cam false");
                    const curModelComponent = newEntity.getComponentOrThrow(ModelComponent);
                    const material = curModelComponent.model.material;
                    if (!this.modelsByMaterial.has(material))
                    {
                        this.modelsByMaterial.set(material, []);
                    }
                    this.modelsByMaterial.get(material)!.push(curModelComponent);
                }
                console.log("cam RIGHT HERE-> " + newEntity.hasComponent(CameraComponent));
                if (newEntity.hasComponent(CameraComponent) && !this.mainCamera)
                {
                    console.log("MAIN CAM");
                    this.mainCamera = newEntity.getComponentOrThrow(CameraComponent);
                }
            }
        }
    }

    render(width: number, height: number)
    {
        this.gl.clearColor(0.643, 0.98, 1.00, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.viewport(0, 0, width, height);
        let currentShaderProgram: WebGLProgram | null = null;

        // Gather all the scene light information for shader
        const lightList: LightComponent[] = [];
        for (let i = 0; i < this.entities.length; i++)
        {
            if (this.entities[i].hasComponent(LightComponent))
            {
                lightList.push(this.entities[i].getComponentOrThrow(LightComponent));
            }
        }

        for (const [material, models] of this.modelsByMaterial.entries())
        {
            this.useProgram(currentShaderProgram, material.shader.shaderProgram);
            this.setLights(material.shader.shaderProgram, lightList);
            if (this.mainCamera === null)
            {
                console.log("NO CAMERA ATTACHED");
            }
            
            this.mainCamera?.camera.draw(
                this.mainCamera.cameraType,
                this.mainCamera.fieldOfView,
                width,
                height,
                this.mainCamera.nearPlane,
                this.mainCamera.farPlane,
                material.viewProjMatrixUniformLocation,
                material.viewPosMatrixUniformLocation,
                this.mainCamera.parentEntity.getGlobalPosition(),
                this.gl
            );
                
            for (const modelComp of models)
            {
                modelComp.model.draw(modelComp.parentEntity.getComponentOrThrow(TransformComponent));
            }
        }

        console.log("finished frame");
    }

    useProgram(currentProgram: WebGLProgram | null, program: WebGLProgram)
    {
        if (!currentProgram)
        {
            currentProgram = program;
            this.gl.useProgram(currentProgram);
            return;
        }

        if (currentProgram !== program)
        {
            this.gl.useProgram(program);
            currentProgram = program;
        }
    }

    setLights(program: WebGLProgram, lights: LightComponent[])
    {
        let numPoint = 0;
        let numDir = 0;
        let numSpot = 0;

        // rotation (-360 to 360) to a noramlized direction
        for (let i = 0; i < lights.length; i++)
        {
            const light = lights[i];

            if (light.lightType === LightType.POINT)
            {
                const base = `ptLights[${numPoint}]`;
                this.gl.uniform3fv(this.gl.getUniformLocation(program, base + ".position"), light.parentEntity.getComponentOrThrow(TransformComponent).position);
                this.gl.uniform3fv(this.gl.getUniformLocation(program, base + ".color"), light.color);
                this.gl.uniform1f(this.gl.getUniformLocation(program, base + ".intensity"), light.intensity);
                numPoint++;
            }
            else if (light.lightType === LightType.DIRECTIONAL)
            {
                const base = `dirLights[${numDir}]`;
                const lightDirection = eulerToDirection(light.parentEntity.getComponentOrThrow(TransformComponent).rotation[0], light.parentEntity.getComponentOrThrow(TransformComponent).rotation[1], light.parentEntity.getComponentOrThrow(TransformComponent).rotation[2]);
                this.gl.uniform3fv(this.gl.getUniformLocation(program, base + ".direction"), lightDirection);
                this.gl.uniform3fv(this.gl.getUniformLocation(program, base + ".color"), light.color);
                this.gl.uniform1f(this.gl.getUniformLocation(program, base + ".intensity"), light.intensity);
                numDir++;
            }
            else if (light.lightType === LightType.SPOT)
            {
                const base = `spotLights[${numSpot}]`;
                const lightDirection = eulerToDirection(light.parentEntity.getComponentOrThrow(TransformComponent).rotation[0], light.parentEntity.getComponentOrThrow(TransformComponent).rotation[1], light.parentEntity.getComponentOrThrow(TransformComponent).rotation[2]);
                this.gl.uniform3fv(this.gl.getUniformLocation(program, base + ".position"), light.parentEntity.getComponentOrThrow(TransformComponent).position);
                this.gl.uniform3fv(this.gl.getUniformLocation(program, base + ".direction"), light.parentEntity.getComponentOrThrow(TransformComponent).rotation);
                this.gl.uniform3fv(this.gl.getUniformLocation(program, base + ".color"), light.color);
                this.gl.uniform1f(this.gl.getUniformLocation(program, base + ".intensity"), light.intensity);
                this.gl.uniform1f(this.gl.getUniformLocation(program, base + ".innerCutOff"), light.innerCutOff);
                this.gl.uniform1f(this.gl.getUniformLocation(program, base + ".outerCutOff"), light.outerCutOff);
            }
        }
    }

    setMainCamera(camera: CameraComponent)
    {
        this.mainCamera = camera;
    }
}