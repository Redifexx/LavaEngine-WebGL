import { vec3 } from "gl-matrix";
import { TransformComponent, Transform } from "../components/transform-component";
import { Input } from "../engine/input";
import { LavaEngine } from "../engine/lava-engine";
import { Entity } from "../gameobjects/entity";
import { ScriptableBehavior } from "../gameobjects/scriptable-behavior";

export class PlayerMovement extends ScriptableBehavior
{
    playerTransform: Transform;
    velocityY = 0.0;
    groundHeight = 0.0;
    flashlight: Entity | null;

    constructor()
    {
        super("PlayerMovement");
    }

    override Start(): void
    {
        this.playerTransform = this.parentEntity!.getComponentOrThrow(TransformComponent).transform;
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
            if (Input.GetKeyHeld("w"))
            {
                const forward = this.playerTransform.GetForward();
                const movement = vec3.create();

                vec3.scale(movement, forward, 5.0 * LavaEngine.deltaTime);

                vec3.add(this.playerTransform.position, this.playerTransform.position, movement);
            }
            if (Input.GetKeyHeld("s"))
            {
                const forward = this.playerTransform.GetForward();
                const movement = vec3.create();

                vec3.scale(movement, forward, -5.0 * LavaEngine.deltaTime);

                vec3.add(this.playerTransform.position, this.playerTransform.position, movement);
            }
            if (Input.GetKeyHeld("d"))
            {
                const transform = this.parentEntity!.getComponentOrThrow(TransformComponent).transform;
                const right = transform.GetRight();
                const movement = vec3.create();

                vec3.scale(movement, right, 5.0 * LavaEngine.deltaTime);

                vec3.add(transform.position, transform.position, movement);
            }
            if (Input.GetKeyHeld("a"))
            {
                const transform = this.parentEntity!.getComponentOrThrow(TransformComponent).transform;
                const right = transform.GetRight();
                const movement = vec3.create();

                vec3.scale(movement, right, -5.0 * LavaEngine.deltaTime);

                vec3.add(transform.position, transform.position, movement);
            }
            if (Input.GetKeyHeld("k"))
            {
                const transform = this.parentEntity!.getComponentOrThrow(TransformComponent).transform;
                transform.rotation[1] -= 200.0 * LavaEngine.deltaTime;
            }
            if (Input.GetKeyHeld("l"))
            {
                const transform = this.parentEntity!.getComponentOrThrow(TransformComponent).transform;
                transform.rotation[1] += 200.0 * LavaEngine.deltaTime;
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
        }
    }

}