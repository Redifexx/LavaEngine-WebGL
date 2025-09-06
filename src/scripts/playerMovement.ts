import { TransformComponent } from "../components/transform-component";
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
        console.log("UPDATE");
        if (Input.GetKeyHeld("W"))
        {
            console.log("KEY HELD");
            this.parentEntity.getComponentOrThrow(TransformComponent).position[0] += 5.0 * LavaEngine.DELTA_TIME;
        }
    }

}