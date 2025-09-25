import { quat, vec3 } from "gl-matrix";
import { TransformComponent, Transform } from "../components/transform-component";
import { Input } from "../engine/input";
import { LavaEngine } from "../engine/lava-engine";
import { Entity } from "../gameobjects/entity";
import { ScriptableBehavior } from "../gameobjects/scriptable-behavior";
import { eulerToQuatWorld } from "../gl-utils";

export class Script extends ScriptableBehavior
{
    constructor()
    {
        super("Script");
    }

    override Start(): void
    {
    }

    override Update(): void
    {
    }
    
    override FixedUpdate(): void {/*empty*/}

}