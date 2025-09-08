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

    constructor(e: Entity)
    {
        super(e);
    }

    override Start(): void
    {
        this.sensitivity = 0.1;
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
            this.parentEntity.parentEntity!.getComponentOrThrow(TransformComponent).transform.rotation[1] += xOffset;

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