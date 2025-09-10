import { vec3 } from "gl-matrix";
import { Entity } from "./entity";
import { ModelComponent } from "../components/model-component";
import { TransformComponent, Transform } from "../components/transform-component";
import { LightComponent, LightType } from "../components/light-component";
import { eulerToDirection, showError } from "../gl-utils";
import { Material } from "../datatypes/material";
import { Camera } from "../datatypes/camera";
import { CameraComponent } from "../components/camera-component";
import { LavaEngine } from "../engine/lava-engine";


export class Scene 
{
    gl: WebGL2RenderingContext;
    entities: Entity[] = [];
    entityMap: Map<string, Entity> = new Map();
    mainCamera: CameraComponent | null;
    skybox: WebGLTexture | null = null;

    // efficient rendering
    modelsByMaterial: Map<Material, ModelComponent[]> = new Map();

    constructor(gl: WebGL2RenderingContext)
    {
        this.gl = gl;
    }

    addEntity(
        name: string,
        pos: vec3 = vec3.fromValues(0.0, 0.0, 0.0),
        rotation: vec3 = vec3.fromValues(0.0, 0.0, 0.0),
        scale: vec3 = vec3.fromValues(1.0, 1.0, 1.0)
    )
    {
        const newEntity = new Entity(this.entities.length, name, this, pos, rotation, scale);
        this.entities.push(newEntity);
        this.entityMap.set(name, newEntity);
        this.updateEntity(newEntity);
        return newEntity;
    }

    getEntityByName(name: string): Entity | undefined
    {
        return this.entityMap.get(name);
    }

    updateEntity(newEntity: Entity)
    {
        if (newEntity.getActive())
        {
            if (newEntity.hasComponent(ModelComponent))
            {
                const curModelComponent = newEntity.getComponentOrThrow(ModelComponent);
                const material = curModelComponent.model.material;

                if (material.isCubemap) console.log("HAS CUBEMAP");

                if (!this.modelsByMaterial.has(material))
                {
                    this.modelsByMaterial.set(material, []);
                }

                const list = this.modelsByMaterial.get(material);
                if (!list?.includes(curModelComponent))
                {
                    list?.push(curModelComponent);
                }
            }

            if (newEntity.hasComponent(CameraComponent) && !this.mainCamera)
            {
                this.mainCamera = newEntity.getComponentOrThrow(CameraComponent);
            }
        }
        else
        {
            if (newEntity.hasComponent(ModelComponent))
            {
                const curModelComponent = newEntity.getComponentOrThrow(ModelComponent);
                const material = curModelComponent.model.material;

                if (this.modelsByMaterial.has(material))
                {
                    const list = this.modelsByMaterial.get(material);
                    const index = list?.indexOf(curModelComponent);

                    if (index !== -1)
                    {
                        list?.splice(index!, 1);
                    }

                    if (list?.length === 0)
                    {
                        this.modelsByMaterial.delete(material);
                    }
                }
            }

            if (newEntity.hasComponent(CameraComponent) && this.mainCamera === newEntity.getComponentOrThrow(CameraComponent))
            {
                this.mainCamera = null;
                showError("MISSING CAMERA");
            }
        }
    }

    render(width: number, height: number)
    {
        LavaEngine.BindFramebuffer(LavaEngine.screenFramebuffer!); // custom frame buffer
        this.gl.clearColor(0.478, 0.365, 0.298, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.viewport(0, 0, width, height);
        let currentShaderProgram: WebGLProgram | null = null;

        // Gather all the scene light information for shader
        const lightList: LightComponent[] = [];
        for (let i = 0; i < this.entities.length; i++)
        {
            if (this.entities[i].hasComponent(LightComponent) && this.entities[i].getActive())
            {
                lightList.push(this.entities[i].getComponentOrThrow(LightComponent));
            }
        }

        // --- RENDER SKYBOX FIRST ---
        for (const [material, models] of this.modelsByMaterial.entries()) {
            if (!material.isCubemap) continue;

            console.log("CUBEMAP");

            this.gl.depthMask(false);
            this.gl.cullFace(this.gl.FRONT); // render inside of cube
            this.gl.depthFunc(this.gl.LEQUAL);

            this.useProgram(currentShaderProgram, material.shader.shaderProgram);

            if (this.mainCamera === null)
            {
                console.log("NO CAMERA ATTACHED");
            }
            
            this.mainCamera?.camera.drawSky(
                this.mainCamera.cameraType,
                this.mainCamera.fieldOfView,
                width,
                height,
                this.mainCamera.nearPlane,
                this.mainCamera.farPlane,
                material.viewMatrixUniformLocation!,
                material.projMatrixUniformLocation!,
                this.mainCamera.parentEntity.getGlobalTransform(),
                this.gl
            );
            for (const modelComp of models)
            {
                modelComp.model.draw(modelComp.parentEntity.getGlobalTransform());
            }
            this.gl.cullFace(this.gl.BACK);
            this.gl.depthFunc(this.gl.LESS);
            this.gl.depthMask(true);
        }

        // --- RENDER REST OF SCENE ---
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
                material.viewProjMatrixUniformLocation!,
                material.viewPosMatrixUniformLocation!,
                this.mainCamera.parentEntity.getGlobalTransform(),
                this.gl
            );
                
            for (const modelComp of models)
            {
                modelComp.model.draw(modelComp.parentEntity.getGlobalTransform());
            }
        }

        // To Screen Quad
        LavaEngine.RenderScreenTexture();
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
                this.gl.uniform3fv(this.gl.getUniformLocation(program, base + ".position"), light.parentEntity.getGlobalTransform().position);
                this.gl.uniform3fv(this.gl.getUniformLocation(program, base + ".color"), light.color);
                this.gl.uniform1f(this.gl.getUniformLocation(program, base + ".intensity"), light.intensity);
                numPoint++;
            }
            else if (light.lightType === LightType.DIRECTIONAL)
            {
                const base = `dirLights[${numDir}]`;
                const lightDirection = eulerToDirection(light.parentEntity.getGlobalTransform().rotation[0], light.parentEntity.getGlobalTransform().rotation[1], light.parentEntity.getGlobalTransform().rotation[2]);
                this.gl.uniform3fv(this.gl.getUniformLocation(program, base + ".direction"), lightDirection);
                this.gl.uniform3fv(this.gl.getUniformLocation(program, base + ".color"), light.color);
                this.gl.uniform1f(this.gl.getUniformLocation(program, base + ".intensity"), light.intensity);
                numDir++;
            }
            else if (light.lightType === LightType.SPOT)
            {
                const base = `spotLights[${numSpot}]`;
                const lightDirection = eulerToDirection(light.parentEntity.getGlobalTransform().rotation[0], light.parentEntity.getGlobalTransform().rotation[1], light.parentEntity.getGlobalTransform().rotation[2]);
                this.gl.uniform3fv(this.gl.getUniformLocation(program, base + ".position"), light.parentEntity.getGlobalTransform().position);
                this.gl.uniform3fv(this.gl.getUniformLocation(program, base + ".direction"), lightDirection);
                this.gl.uniform3fv(this.gl.getUniformLocation(program, base + ".color"), light.color);
                this.gl.uniform1f(this.gl.getUniformLocation(program, base + ".intensity"), light.intensity);
                this.gl.uniform1f(this.gl.getUniformLocation(program, base + ".innerCutOff"), light.innerCutOff);
                this.gl.uniform1f(this.gl.getUniformLocation(program, base + ".outerCutOff"), light.outerCutOff);
                numSpot++;
            }
            this.gl.uniform1i(this.gl.getUniformLocation(program, "numPointLights"), numPoint);
            this.gl.uniform1i(this.gl.getUniformLocation(program, "numDirLights"), numDir);
            this.gl.uniform1i(this.gl.getUniformLocation(program, "numSpotLights"), numSpot);

        }
    }

    setMainCamera(camera: CameraComponent)
    {
        this.mainCamera = camera;
    }

    Start()
    {
        for (const e of this.entities)
        {
            for (const s of e.scripts.values())
            {
                s.Start();
            }
        }
    }

    Update()
    {
        for (const e of this.entities)
        {
            for (const s of e.scripts.values())
            {
                s.Update();
            }
        }
    }
}