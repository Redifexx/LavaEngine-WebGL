import { vec3 } from "gl-matrix";
import { TransformComponent, Transform } from "../components/transform-component";
import { Input } from "../engine/input";
import { LavaEngine } from "../engine/lava-engine";
import { Entity } from "../gameobjects/entity";
import { ScriptableBehavior } from "../gameobjects/scriptable-behavior";
import { getQuatForward, getQuatRight } from "../gl-utils";

export class PlayerMovement extends ScriptableBehavior
{
    playerTransform: Transform;
    velocityY = 0.0;
    groundHeight = 0.0;
    flashlight: Entity | null;
    movementVelocity = vec3.create();
    speed = 0.0;
    moveSpeed = 1.3;
    walkSpeed = 0.3;
    airSpeed = 0.3;
    isMoving: boolean;

    constructor()
    {
        super("PlayerMovement");
    }

    override Start(): void
    {
        this.playerTransform = this.parentEntity!.getComponentOrThrow(TransformComponent).transform;
        this.isMoving = false;
    }

    override Update(): void
    {
        // Gravity
        this.velocityY += -15 * LavaEngine.deltaTime;
        this.playerTransform.position[1] += this.velocityY * LavaEngine.deltaTime;
        if (this.playerTransform.position[1] <= this.groundHeight)
        {
            this.playerTransform.position[1] = this.groundHeight;
            this.velocityY = 0;
        }

        if (LavaEngine.isPointerLock)
        {
            this.SpeedCheck();

            const acceleration = vec3.create();
            
            this.isMoving = false;

            if (Input.GetKeyHeld("w"))
            {
                vec3.add(acceleration, acceleration, getQuatForward(this.playerTransform.rotation));
                this.isMoving = true;
            }
            if (Input.GetKeyHeld("s"))
            {
                const backward = vec3.create();
                vec3.scale(backward, getQuatForward(this.playerTransform.rotation), -1);
                vec3.add(acceleration, acceleration, backward);
                this.isMoving = true;
            }
            if (Input.GetKeyHeld("d"))
            {
                vec3.add(acceleration, acceleration, getQuatRight(this.playerTransform.rotation));
                this.isMoving = true;
            }
            if (Input.GetKeyHeld("a"))
            {
                const left = vec3.create();
                vec3.scale(left, getQuatRight(this.playerTransform.rotation), -1);
                vec3.add(acceleration, acceleration, left);
                this.isMoving = true;
            }

            if (Input.GetKeyPressed("escape"))
            {
                document.exitPointerLock();
                LavaEngine.isPointerLock = false;
            }

            if (Input.GetKeyPressed("space"))
            {
                if (this.playerTransform.position[1] === this.groundHeight) {
                    this.velocityY = 5.0;
                }
            }

            if (Input.GetKeyPressed("f"))
            {
                if (this.flashlight)
                {
                    this.flashlight.setActive(!this.flashlight.getActive());
                }
            }


            // SPEED CONTROL FOR DIAGONAL MOVEMENT
            if (vec3.length(acceleration) > 0)
            {
                vec3.normalize(acceleration, acceleration);
                vec3.scale(acceleration, acceleration, this.speed * LavaEngine.deltaTime);
                vec3.add(this.movementVelocity, this.movementVelocity, acceleration);
            }

            // apply velocity
            vec3.add(this.playerTransform.position, this.playerTransform.position, this.movementVelocity);

            // drag
            vec3.scale(this.movementVelocity, this.movementVelocity, 0.9);
            if (vec3.length(this.movementVelocity) < 0.001)
            {
                vec3.set(this.movementVelocity, 0, 0, 0);
            }
        }
    }

    SpeedCheck()
    {
        if (this.playerTransform.position[1] !== this.groundHeight && this.speed !== this.airSpeed && Input.GetKeyReleased('w'))
        {
            this.speed = this.airSpeed;
        }
        else if (this.playerTransform.position[1] === this.groundHeight)
        {
            if (Input.GetKeyHeld("shiftleft") && this.speed !== this.walkSpeed)
            {
                this.speed = this.walkSpeed;
            }
            else if (this.speed !== this.moveSpeed)
            {
                this.speed = this.moveSpeed;
            }
        }
    }

}