import { quat, vec3 } from "gl-matrix";
import { TransformComponent, Transform } from "../components/transform-component";
import { Input } from "../engine/input";
import { LavaEngine } from "../engine/lava-engine";
import { Entity } from "../gameobjects/entity";
import { ScriptableBehavior } from "../gameobjects/scriptable-behavior";
import { eulerToQuatWorld } from "../gl-utils";

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
        this.pitch = 0;
        this.yaw = 0;
    }

    override Update(): void
    {
        if (LavaEngine.isPointerLock)
        {
            let xOffset: number = Input.GetMouseMovementX();
            xOffset *= this.sensitivity;

            let yOffset: number = Input.GetMouseMovementY();
            yOffset *= this.sensitivity;

            this.yaw -= xOffset;
            this.pitch -= yOffset;

            this.pitch = Math.max(-89, Math.min(89, this.pitch));
            
            const transformYaw = vec3.fromValues(0, this.yaw, 0);
            const transformPitch = vec3.fromValues(this.pitch, 0, 0);

            const yawQuat = eulerToQuatWorld(transformYaw);
            const pitchQuat = eulerToQuatWorld(transformPitch);

            // yaw on player
            quat.copy(
                this.parentEntity!.parentEntity!.transformComponent.transform.rotation,
                yawQuat
            );

            // pitch on camera
            quat.copy(
                this.parentEntity!.transformComponent.transform.rotation,
                pitchQuat
            );
        }
    }

}