import { quat, vec3 } from "gl-matrix";
import { TransformComponent, Transform } from "../components/transform-component";
import { Input } from "../engine/input";
import { LavaEngine } from "../engine/lava-engine";
import { Entity } from "../gameobjects/entity";
import { ScriptableBehavior } from "../gameobjects/scriptable-behavior";

export class FlashlightFollow extends ScriptableBehavior
{
    flashlightTransform: Transform;
    camera: Entity;
    cameraTransform: Transform;

    positionLerp = 25.0;
    rotationLerp = 12.0;

    constructor(camera: Entity)
    {
        super("FlashlightFollow");
        this.camera = camera;
    }

    offset = vec3.fromValues(0.0, 0.0, 0.0);

    override Start(): void
    {
        this.flashlightTransform = this.parentEntity!.getComponentOrThrow(TransformComponent).transform;
        this.cameraTransform = this.camera.getGlobalTransform();
    }

    override Update(): void
    {
        this.cameraTransform = this.camera.getGlobalTransform();

        const targetPos = vec3.create();
        vec3.add(targetPos, this.cameraTransform.position, this.offset);

        vec3.lerp(
            this.flashlightTransform.position,
            this.flashlightTransform.position,
            targetPos,
            LavaEngine.deltaTime * this.positionLerp
        );

        const targetRot = quat.clone(this.cameraTransform.rotation);

       // Force into same hemisphere as current flashlight rotation
        if (quat.dot(this.flashlightTransform.rotation, targetRot) < 0) {
            // Flip target to avoid long path
            targetRot[0] = -targetRot[0];
            targetRot[1] = -targetRot[1];
            targetRot[2] = -targetRot[2];
            targetRot[3] = -targetRot[3];
        }

        quat.slerp(
            this.flashlightTransform.rotation,
            this.flashlightTransform.rotation,
            targetRot,
            LavaEngine.deltaTime * this.rotationLerp
        );
    }

}