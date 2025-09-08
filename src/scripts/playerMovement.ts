import { vec3 } from "gl-matrix";
import { TransformComponent, Transform } from "../components/transform-component";
import { Input } from "../engine/input";
import { LavaEngine } from "../engine/lava-engine";
import { Entity } from "../gameobjects/entity";
import { ScriptableBehavior } from "../gameobjects/scriptable-behavior";

export class PlayerMovement extends ScriptableBehavior
{
    constructor(e: Entity)
    {
        super(e);
    }

    override Start(): void
    {

    }

    override Update(): void
    {
        if (Input.GetKeyHeld("w"))
        {
            const transform = this.parentEntity.getComponentOrThrow(TransformComponent).transform;
            const forward = transform.GetForward();
            const movement = vec3.create();

            vec3.scale(movement, forward, 5.0 * LavaEngine.deltaTime);

            vec3.add(transform.position, transform.position, movement);
        }
        if (Input.GetKeyHeld("s"))
        {
            const transform = this.parentEntity.getComponentOrThrow(TransformComponent).transform;
            const forward = transform.GetForward();
            const movement = vec3.create();

            vec3.scale(movement, forward, -5.0 * LavaEngine.deltaTime);

            vec3.add(transform.position, transform.position, movement);
        }
        if (Input.GetKeyHeld("d"))
        {
            const transform = this.parentEntity.getComponentOrThrow(TransformComponent).transform;
            const right = transform.GetRight();
            const movement = vec3.create();

            vec3.scale(movement, right, 5.0 * LavaEngine.deltaTime);

            vec3.add(transform.position, transform.position, movement);
        }
        if (Input.GetKeyHeld("a"))
        {
            const transform = this.parentEntity.getComponentOrThrow(TransformComponent).transform;
            const right = transform.GetRight();
            const movement = vec3.create();

            vec3.scale(movement, right, -5.0 * LavaEngine.deltaTime);

            vec3.add(transform.position, transform.position, movement);
        }
        if (Input.GetKeyHeld("k"))
        {
            const transform = this.parentEntity.getComponentOrThrow(TransformComponent).transform;
            transform.rotation[1] -= 200.0 * LavaEngine.deltaTime;
        }
        if (Input.GetKeyHeld("l"))
        {
            const transform = this.parentEntity.getComponentOrThrow(TransformComponent).transform;
            transform.rotation[1] += 200.0 * LavaEngine.deltaTime;
        }
    }

}