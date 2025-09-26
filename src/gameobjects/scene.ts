import { mat4, quat, vec3, vec4 } from "gl-matrix";
import { Entity } from "./entity";
import { ModelComponent } from "../components/model-component";
import { TransformComponent, Transform } from "../components/transform-component";
import { LightComponent, LightType } from "../components/light-component";
import { eulerToDirection, getQuatForward, getQuatUp, showError } from "../gl-utils";
import { Material } from "../datatypes/material";
import { Camera } from "../datatypes/camera";
import { CameraComponent } from "../components/camera-component";
import { LavaEngine } from "../engine/lava-engine";
import { Model } from "../datatypes/model";
import { RigidbodyComponent } from "../components/rigidbody-component";
import { ColliderComponent } from "../components/collider-component";
import type * as Ammo from "ammojs-typed";


export class Scene 
{
    gl: WebGL2RenderingContext;
    entities: Entity[] = [];
    physicsEntities: Entity[] = [];
    entityMap: Map<string, Entity> = new Map();
    mainCamera: CameraComponent | null;
    skybox: WebGLTexture | null = null;

    // efficient rendering
    modelsByMaterial: Map<Material, ModelComponent[]> = new Map();
    private lightList: LightComponent[] = [];

    constructor(gl: WebGL2RenderingContext)
    {
        this.gl = gl;
    }

    destroy()
    {
        for (const e of this.entities)
        {
            if (e) e.destroy();
        }

        for (const e of this.physicsEntities)
        {
            if (e) e.destroy();
        }

        this.entityMap.clear();

        if (this.skybox) this.gl.deleteTexture(this.skybox);

        for (const l of this.lightList)
        {
            if (l) l.destroy();
        }

        for (const [material, modelArray] of this.modelsByMaterial.entries()) {
            for (const model of modelArray) {
                if (model) model.destroy();
            }
            if (material) material.destroy();
        }

    }

    addEntity(
        name: string,
        pos: vec3 = vec3.fromValues(0.0, 0.0, 0.0),
        rotation: vec3 = vec3.fromValues(0.0, 0.0, 0.0),
        scale: vec3 = vec3.fromValues(1.0, 1.0, 1.0),
    )
    {
        const newEntity = new Entity(this.entities.length, name, this, pos, rotation, scale);
        this.entities.push(newEntity);
        this.entityMap.set(name, newEntity);
        this.updateEntity(newEntity);

        return newEntity;
    }

    importModel(
        name: string,
        pos: vec3 = vec3.fromValues(0.0, 0.0, 0.0),
        rotation: vec3 = vec3.fromValues(0.0, 0.0, 0.0),
        scale: vec3 = vec3.fromValues(1.0, 1.0, 1.0),
        material: Material = LavaEngine.defaultMaterial,
        model: string = "models/cube.json",
        posCorrection: vec3 = vec3.fromValues(0.0, 0.0, 0.0),
        rotationCorrection: vec3 = vec3.fromValues(-90.0, 0.0, 0.0),
        scaleCorrection: vec3 = vec3.fromValues(1.0, 1.0, 1.0),
    )
    {
        // Entity
        const newEntity = this.addEntity(name, pos, rotation, scale);
        const childEntity = this.addEntity(`${name}Mesh`, posCorrection, rotationCorrection, scaleCorrection);
        newEntity.addChildEntity(childEntity);

        // Model
        const newModel = new Model(model, material, null);

        childEntity.addComponent(ModelComponent, new ModelComponent(newModel));

        return newEntity;
    }

    /*
    addModel(
        url: string,
        name: string | null = null,
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
        */

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

            if (newEntity.hasComponent(RigidbodyComponent))
            {
                this.physicsEntities.push(newEntity);
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
        this.gl.clearColor(0.478, 0.365, 0.298, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.viewport(0, 0, width, height);
        let currentShaderProgram: WebGLProgram | null = null;

        // --- RENDER SCENE ---
        for (const [material, models] of this.modelsByMaterial.entries())
        {

            this.useProgram(currentShaderProgram, material.shader.shaderProgram);

            // bind depth map for shadow
            this.gl.activeTexture(this.gl.TEXTURE5);
            this.gl.bindTexture(this.gl.TEXTURE_2D, LavaEngine.depthMap);
            this.gl.uniform1i(this.gl.getUniformLocation(material.shader.shaderProgram, "shadowMap"), 5);

            this.setLights(material.shader.shaderProgram, this.lightList);
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
                material.viewMatrixUniformLocation!,
                material.projMatrixUniformLocation!,
                material.viewPosMatrixUniformLocation!,
                this.mainCamera.parentEntity.getGlobalTransform(),
                this.gl
            );
                
            for (const modelComp of models)
            {
                modelComp.model.draw(modelComp.parentEntity.getGlobalTransform());
            }
        }

    }

    
    renderSkybox(width: number, height: number)
    {
        let currentShaderProgram: WebGLProgram | null = null;

        // --- RENDER SKYBOX ---
        for (const [material, models] of this.modelsByMaterial.entries()) {
            if (!material.isCubemap) continue;

            this.gl.depthMask(false);
            this.gl.cullFace(this.gl.FRONT); // render inside of cube
            this.gl.depthFunc(this.gl.LEQUAL);

            this.useProgram(currentShaderProgram, material.shader.shaderProgram);

            this.gl.uniform1f(material.nearCamUniformLocation, this.mainCamera!.nearPlane);
            this.gl.uniform1f(material.farCamUniformLocation, this.mainCamera!.farPlane);

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
    }
    
    renderShadow(currentShaderProgram: WebGLProgram)
    {
        
        // Gather all the scene light information for shader
        this.lightList.length = 0;
        for (let i = 0; i < this.entities.length; i++)
        {
            if (this.entities[i].hasComponent(LightComponent) && this.entities[i].getActive())
            {
                this.lightList.push(this.entities[i].getComponentOrThrow(LightComponent));
            }
        }

        this.gl.useProgram(currentShaderProgram);
        this.setLights(currentShaderProgram, this.lightList, true);

        // --- RENDER REST OF SCENE ---
        for (const [material, models] of this.modelsByMaterial.entries())
        {
            for (const modelComp of models)
            {
                if (modelComp.hasShadows)
                {
                    const oldMat = modelComp.model.material;
                    modelComp.model.setMaterial(LavaEngine.shadowMat!);
                    modelComp.model.draw(modelComp.parentEntity.getGlobalTransform(), true);
                    modelComp.model.setMaterial(oldMat);
                }
            }
        }
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

    setLights(program: WebGLProgram, lights: LightComponent[], shadowPass: boolean = false)
    {
        let numPoint = 0;
        let numDir = 0;
        let numSpot = 0;

        // rotation (-360 to 360) to a noramlized direction
        for (let i = 0; i < lights.length; i++)
        {   
            const light = lights[i];
            if (!shadowPass)
            {
                if (light.lightType === LightType.POINT)
                {
                    const base = `ptLights[${numPoint}]`
                    this.gl.uniform3fv(this.gl.getUniformLocation(program, base + ".position"), light.parentEntity.getGlobalPosition());
                    this.gl.uniform3fv(this.gl.getUniformLocation(program, base + ".color"), light.color);
                    this.gl.uniform1f(this.gl.getUniformLocation(program, base + ".intensity"), light.intensity);
                    numPoint++;
                }
                else if (light.lightType === LightType.DIRECTIONAL)
                {
                    const base = `dirLights[${numDir}]`;
                    const lightTransform = light.parentEntity.getGlobalTransform();
                    const lightDirection = getQuatForward(lightTransform.rotation);
                    this.gl.uniform3fv(this.gl.getUniformLocation(program, base + ".direction"), lightDirection);
                    this.gl.uniform3fv(this.gl.getUniformLocation(program, base + ".color"), light.color);
                    this.gl.uniform1f(this.gl.getUniformLocation(program, base + ".intensity"), light.intensity);
                    numDir++;
                }
                else if (light.lightType === LightType.SPOT)
                {
                    const base = `spotLights[${numSpot}]`;
                    const lightTransform = light.parentEntity.getGlobalTransform();
                    const lightDirection = getQuatForward(lightTransform.rotation);
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

            if (light.hasShadows)
            {
                if (light.lightType === LightType.DIRECTIONAL)
                {
                    
                    const nearPlane = 5.0;
                    const farPlane = 500.0;

                    const lightTransform = light.parentEntity.getGlobalTransform();
                    const lightDirection = getQuatForward(lightTransform.rotation);

                    const lightPos = vec3.create();
                    const cameraPos = this.mainCamera!.parentEntity!.getGlobalPosition();
                    vec3.scaleAndAdd(lightPos, cameraPos, lightDirection, -20.0);

                    let lightView = mat4.create();
                    mat4.lookAt(
                        lightView,
                        lightPos,
                        cameraPos,
                        vec3.fromValues(0.0, 1.0, 0.0)
                    );

                    const radius = 30.0;

                    let lightProjection = mat4.create();
                    mat4.ortho(
                        lightProjection,
                        -radius, radius, -radius, radius,
                        nearPlane, farPlane
                    );

                    const lightSpaceMatrix = mat4.create();
                    mat4.multiply(lightSpaceMatrix, lightProjection, lightView);
                    this.gl.uniformMatrix4fv(this.gl.getUniformLocation(program, "lightSpaceMatrix"), false, lightSpaceMatrix);
                }
                /*
                else if (light.lightType === LightType.SPOT)
                {
                    const nearPlane = 0.1;
                    const farPlane = 50.0;

                    const lightTransform = light.parentEntity.getGlobalTransform();
                    const lightDirection = getQuatForward(lightTransform.rotation);
                    const lightPos = lightTransform.position;
                    const lightTarget = vec3.create();

                    vec3.scaleAndAdd(lightTarget, lightPos, lightDirection, 1.0);

                    let lightView = mat4.create();
                    mat4.lookAt(
                        lightView,
                        lightPos,
                        lightTarget,
                        vec3.fromValues(0.0, 1.0, 0.0)
                    );

                    const radius = 30.0;

                    let lightProjection = mat4.create();
                    mat4.perspective(
                        lightProjection,
                        light.outerCutOff,
                        LavaEngine.internalWidth / LavaEngine.internalHeight,
                        nearPlane, farPlane
                    );

                    const lightSpaceMatrix = mat4.create();
                    mat4.multiply(lightSpaceMatrix, lightProjection, lightView);
                    this.gl.uniformMatrix4fv(this.gl.getUniformLocation(program, "lightSpaceMatrix"), false, lightSpaceMatrix);
                }
                    */
            }
        }
    }

    setMainCamera(camera: CameraComponent)
    {
        this.mainCamera = camera;
    }

    computeLightSpaceMatrix(lightDir: vec3) {
        const near = this.mainCamera!.nearPlane;
        const far = this.mainCamera!.farPlane;
        const fov = this.mainCamera!.fieldOfView * Math.PI / 180;
        const aspect = LavaEngine.canvasWidth / LavaEngine.canvasHeight;

        const tanFov = Math.tan(fov / 2);
        const nh = near * tanFov;
        const nw = nh * aspect;
        const fh = far * tanFov;
        const fw = fh * aspect;

        const forward = vec3.create();
        vec3.normalize(forward, getQuatForward(this.mainCamera!.parentEntity!.getGlobalRotation())); // assuming camera.forward is normalized

        const right = vec3.create();
        vec3.cross(right, forward, getQuatUp(this.mainCamera!.parentEntity!.getGlobalRotation()));
        vec3.normalize(right, right);

        const up = vec3.create();
        vec3.cross(up, right, forward);

        const camPos = this.mainCamera!.parentEntity!.getGlobalPosition();

        // Near plane center
        const nc = vec3.create();
        vec3.scaleAndAdd(nc, camPos, forward, near);
        // Far plane center
        const fc = vec3.create();
        vec3.scaleAndAdd(fc, camPos, forward, far);

        // Frustum corners
        const corners: vec3[] = [];

        // Near plane
        corners.push(vec3.fromValues(nc[0] - right[0]*nw + up[0]*nh, nc[1] - right[1]*nw + up[1]*nh, nc[2] - right[2]*nw + up[2]*nh));
        corners.push(vec3.fromValues(nc[0] + right[0]*nw + up[0]*nh, nc[1] + right[1]*nw + up[1]*nh, nc[2] + right[2]*nw + up[2]*nh));
        corners.push(vec3.fromValues(nc[0] + right[0]*nw - up[0]*nh, nc[1] + right[1]*nw - up[1]*nh, nc[2] + right[2]*nw - up[2]*nh));
        corners.push(vec3.fromValues(nc[0] - right[0]*nw - up[0]*nh, nc[1] - right[1]*nw - up[1]*nh, nc[2] - right[2]*nw - up[2]*nh));

        // Far plane
        corners.push(vec3.fromValues(fc[0] - right[0]*fw + up[0]*fh, fc[1] - right[1]*fw + up[1]*fh, fc[2] - right[2]*fw + up[2]*fh));
        corners.push(vec3.fromValues(fc[0] + right[0]*fw + up[0]*fh, fc[1] + right[1]*fw + up[1]*fh, fc[2] + right[2]*fw + up[2]*fh));
        corners.push(vec3.fromValues(fc[0] + right[0]*fw - up[0]*fh, fc[1] + right[1]*fw - up[1]*fh, fc[2] + right[2]*fw - up[2]*fh));
        corners.push(vec3.fromValues(fc[0] - right[0]*fw - up[0]*fh, fc[1] - right[1]*fw - up[1]*fh, fc[2] - right[2]*fw - up[2]*fh));

        const lightPos = vec3.create();
        const center = vec3.create();
        vec3.add(center, camPos, forward);
        vec3.scaleAndAdd(lightPos, center, lightDir, -50.0);

        const lightView = mat4.create();
        const lightTarget = center;
        const lightUp = vec3.fromValues(0, 1, 0);
        mat4.lookAt(lightView, lightPos, lightTarget, lightUp);

        let min = vec3.fromValues(Infinity, Infinity, Infinity);
        let max = vec3.fromValues(-Infinity, -Infinity, -Infinity);

        for (const corner of corners)
        {
            const cLS = vec3.create();
            vec3.transformMat4(cLS, corner, lightView);
            vec3.min(min, min, cLS);
            vec3.max(max, max, cLS);
        }

        const worldUnitsPerTexelX = (max[0] - min[0]) / LavaEngine.shadowMapResolution;
        const worldUnitsPerTexelY = (max[1] - min[1]) / LavaEngine.shadowMapResolution;

        min[0] = Math.floor(min[0] / worldUnitsPerTexelX) * worldUnitsPerTexelX;
        min[1] = Math.floor(min[1] / worldUnitsPerTexelY) * worldUnitsPerTexelY;
        max[0] = Math.floor(max[0] / worldUnitsPerTexelX) * worldUnitsPerTexelX;
        max[1] = Math.floor(max[1] / worldUnitsPerTexelY) * worldUnitsPerTexelY;

        const lightProj = mat4.create();
        const depthRange = max[2] - min[2];
        const zPadding = depthRange * 0.1;
        mat4.ortho(lightProj, min[0], max[0], min[1], max[1], -max[2] - zPadding, -min[2] + zPadding);

        const lightSpaceMatrix = mat4.create();
        mat4.multiply(lightSpaceMatrix, lightProj, lightView);

        // Stabilize by snapping to nearest texel
        const shadowMapResolution = LavaEngine.shadowMapResolution; // or whatever your shadow map size is
        const shadowOrigin = vec4.fromValues(0, 0, 0, 1);
        vec4.transformMat4(shadowOrigin, shadowOrigin, lightSpaceMatrix);

        // Convert to texel space
        shadowOrigin[0] = Math.floor(shadowOrigin[0] * shadowMapResolution) / shadowMapResolution;
        shadowOrigin[1] = Math.floor(shadowOrigin[1] * shadowMapResolution) / shadowMapResolution;

        // Apply the offset
        const offset = vec3.fromValues(shadowOrigin[0], shadowOrigin[1], 0);
        mat4.translate(lightSpaceMatrix, lightSpaceMatrix, offset);

        return lightSpaceMatrix;
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

        for (const e of this.physicsEntities)
        {
            const rb = e.getComponentOrThrow(RigidbodyComponent);
            const alpha = LavaEngine.alpha;
        
            if (!rb.isKinematic)
            {
                const p0 = e.physics.prevPos;
                const p1 = e.physics.currPos;
                const q0 = e.physics.prevRot;
                const q1 = e.physics.currRot;

                const nq0 = quat.fromValues(q0.x(), q0.y(), q0.z(), q0.w());
                const nq1 = quat.fromValues(q1.x(), q1.y(), q1.z(), q1.w());
                const tq = quat.create();
                quat.slerp(tq, nq0, nq1, alpha);

                const x = p0.x() + (p1.x() - p0.x()) * alpha;
                const y = p0.y() + (p1.y() - p0.y()) * alpha;
                const z = p0.z() + (p1.z() - p0.z()) * alpha;

                /*
                const newPos = vec3.fromValues(x, y, z);
                const newRot: quat = quat.fromValues(
                    tq[0] * rb.rotMask[0],
                    tq[1] * rb.rotMask[1],
                    tq[2] * rb.rotMask[2],
                    tq[3]);
                    */

                const newPos = vec3.fromValues(p1.x(), p1.y(), p1.z());
                const newRot: quat = quat.fromValues(
                    nq1[0] * rb.rotMask[0],
                    nq1[1] * rb.rotMask[1],
                    nq1[2] * rb.rotMask[2],
                    nq1[3]);
                e.transformComponent.transform.position = newPos;
                e.transformComponent.transform.rotation = newRot;
            }
        }
    }

    FixedUpdate()
    {
        for (const e of this.entities)
        {
            for (const s of e.scripts.values())
            {
                s.FixedUpdate();
            }
        }

        for (const e of this.physicsEntities)
        {
            const rb = e.getComponentOrThrow(RigidbodyComponent);
            const curBody = rb.body;

            const curPos = e.transformComponent.transform.position;
            const curRot = e.transformComponent.transform.rotation;
                

            if (rb.isKinematic)
            {              
                quat.invert(e.diffRot, e.lastRot);
                quat.multiply(e.diffRot, e.diffRot, curRot);
                const angle = 2 * Math.acos(Math.min(1, Math.max(-1, e.diffRot[3])));
                let hasMoved = false;


                if (vec3.distance(curPos, e.lastPos) > 0.01)
                {
                    //console.log(vec3.distance(curPos, e.lastPos));
                    hasMoved = true;
                }

                if (hasMoved)
                {
                    e.ammoPosition.setX(curPos[0]);
                    e.ammoPosition.setY(curPos[1]);
                    e.ammoPosition.setZ(curPos[2]);

                    e.ammoQuat.setX(curRot[0] * rb.rotMask[0]);
                    e.ammoQuat.setY(curRot[1] * rb.rotMask[1]);
                    e.ammoQuat.setZ(curRot[2] * rb.rotMask[2]);
                    e.ammoQuat.setW(curRot[3]);

                    e.ammoTransform.setOrigin(e.ammoPosition);
                    e.ammoTransform.setRotation(e.ammoQuat);
                    e.ammoMotionState.setWorldTransform(e.ammoTransform);
                    rb.body.setMotionState(e.ammoMotionState);
                }
                e.lastPos = vec3.clone(curPos);
                e.lastRot = quat.clone(curRot);
            }

            
            if (!rb.isKinematic)
            {
                const motionState = curBody.getMotionState();
                motionState.getWorldTransform(e.ammoTransform);

                e.physics.prevPos.setValue(
                    e.physics.currPos.x(), e.physics.currPos.y(), e.physics.currPos.z()
                );

                e.physics.prevRot.setValue(
                    e.physics.currRot.x() * rb.rotMask[0],
                    e.physics.currRot.y() * rb.rotMask[1],
                    e.physics.currRot.z() * rb.rotMask[2],
                    e.physics.currRot.w()
                );

                const position = e.ammoTransform.getOrigin();
                const rotation = e.ammoTransform.getRotation();

                e.physics.currPos.setValue(
                    position.x(), position.y(), position.z()
                );

                e.physics.currRot.setValue(
                    rotation.x() * rb.rotMask[0],
                    rotation.y() * rb.rotMask[1],
                    rotation.z() * rb.rotMask[2],
                    rotation.w()
                );
            }
        }
    }

}