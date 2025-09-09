import { vec3 } from "gl-matrix";
import { TransformComponent, Transform } from "../components/transform-component";
import { Input } from "../engine/input";
import { LavaEngine } from "../engine/lava-engine";
import { Entity } from "../gameobjects/entity";
import { ScriptableBehavior } from "../gameobjects/scriptable-behavior";

export class CameraController extends ScriptableBehavior
{
    yaw: number;
    pitch: number;
    sensitivity: number;

    constructor(s: number = 0.1)
    {
        super("CameraController");
        this.sensitivity = s;
    }

    override Start(): void
    {
        this.pitch = this.parentEntity!.getComponentOrThrow(TransformComponent).transform.rotation[0];
    }

    override Update(): void
    {
        if (LavaEngine.isPointerLock)
        {
            let xOffset: number = Input.GetMouseMovementX();
            xOffset *= this.sensitivity;

            let yOffset: number = Input.GetMouseMovementY();
            yOffset *= this.sensitivity;

            //YAW
            let transformRotation = this.parentEntity!.parentEntity!.getComponentOrThrow(TransformComponent).transform.rotation;
            transformRotation[1] += xOffset;
            if (transformRotation[1] >= 360 || transformRotation[1] <= -360)
            {
                transformRotation[1] = 0;
            }

            this.pitch -= yOffset;

            if (this.pitch > 89.0)
            {
                this.pitch = 89.0;
            }
            if (this.pitch < -89.0)
            {
                this.pitch = -89.0;
            }

            this.parentEntity!.getComponentOrThrow(TransformComponent).transform.rotation[0] = this.pitch;
        }
    }

}