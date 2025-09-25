import { quat, vec3 } from "gl-matrix";
import { TransformComponent, Transform } from "../components/transform-component";
import { Input } from "../engine/input";
import { LavaEngine } from "../engine/lava-engine";
import { Entity } from "../gameobjects/entity";
import { ScriptableBehavior } from "../gameobjects/scriptable-behavior";
import { eulerToQuatWorld, getQuatForward, getQuatRight, getQuatUp } from "../gl-utils";

export class CameraFlightController extends ScriptableBehavior
{
    yaw: number;
    pitch: number;
    sensitivity: number;
    isMoving: boolean;
    speed = 0.0;
    normalSpeed = 2.0;
    fastSpeed = 5.0;
    movementVelocity = vec3.create();

    constructor(s: number = 0.1)
    {
        super("CameraFlightController");
        this.sensitivity = s;
    }

    override Start(): void
    {
        this.pitch = 0;
        this.yaw = 0;
        this.isMoving = false;
    }

    override Update(): void
    {
        const curTransform = this.parentEntity!.getGlobalTransform();
        if (LavaEngine.isPointerLock)
        {
            this.SpeedCheck();
            const acceleration = vec3.create();
            this.isMoving = false;

            if (Input.GetKeyHeld("w"))
            {
                vec3.add(acceleration, acceleration, getQuatForward(curTransform.rotation));
                this.isMoving = true;
            }
            if (Input.GetKeyHeld("s"))
            {
                const backward = vec3.create();
                vec3.scale(backward, getQuatForward(curTransform.rotation), -1);
                vec3.add(acceleration, acceleration, backward);
                this.isMoving = true;
            }
            if (Input.GetKeyHeld("d"))
            {
                vec3.add(acceleration, acceleration, getQuatRight(curTransform.rotation));
                this.isMoving = true;
            }
            if (Input.GetKeyHeld("a"))
            {
                const left = vec3.create();
                vec3.scale(left, getQuatRight(curTransform.rotation), -1);
                vec3.add(acceleration, acceleration, left);
                this.isMoving = true;
            }
            if (Input.GetKeyHeld("e"))
            {
                vec3.add(acceleration, acceleration, vec3.fromValues(0.0, 1.0, 0.0));
                this.isMoving = true;
            }
            if (Input.GetKeyHeld("q"))
            {
                const down = vec3.create();
                vec3.scale(down, vec3.fromValues(0.0, 1.0, 0.0), -1);
                vec3.add(acceleration, acceleration, down);
                this.isMoving = true;
            }

            // SPEED CONTROL FOR DIAGONAL MOVEMENT
            if (vec3.length(acceleration) > 0)
            {
                vec3.normalize(acceleration, acceleration);
                vec3.scale(acceleration, acceleration, this.speed * LavaEngine.deltaTime);
                vec3.add(this.movementVelocity, this.movementVelocity, acceleration);
            }

            // apply velocity
            vec3.add(this.parentEntity!.transformComponent.transform.position, curTransform.position, this.movementVelocity);

            // drag
            vec3.scale(this.movementVelocity, this.movementVelocity, 0.9);
            if (vec3.length(this.movementVelocity) < 0.001)
            {
                vec3.set(this.movementVelocity, 0, 0, 0);
            }

            if (Input.GetKeyPressed("escape"))
            {
                document.exitPointerLock();
                LavaEngine.isPointerLock = false;
            }

            let xOffset: number = Input.GetMouseMovementX();
            xOffset *= this.sensitivity;

            let yOffset: number = Input.GetMouseMovementY();
            yOffset *= this.sensitivity;

            this.yaw -= xOffset;
            this.pitch -= yOffset;

            this.pitch = Math.max(-89, Math.min(89, this.pitch));
            
            const transformYawPitch = vec3.fromValues(this.pitch, this.yaw, 0);

            const yawPitchQuat = eulerToQuatWorld(transformYawPitch);

            // yaw on player
            quat.copy(
                this.parentEntity!.transformComponent.transform.rotation,
                yawPitchQuat
            );
        }
    }
    
    override FixedUpdate(): void {/*empty*/}

    SpeedCheck()
    {
        if (Input.GetKeyHeld("shiftleft") && this.speed !== this.fastSpeed)
        {
            this.speed = this.fastSpeed;
        }
        else if (this.speed !== this.normalSpeed)
        {
            this.speed = this.normalSpeed;
        }
    }
}