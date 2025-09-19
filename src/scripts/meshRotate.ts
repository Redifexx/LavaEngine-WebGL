import { vec3 } from "gl-matrix";
import { TransformComponent, Transform } from "../components/transform-component";
import { Input } from "../engine/input";
import { LavaEngine } from "../engine/lava-engine";
import { ScriptableBehavior } from "../gameobjects/scriptable-behavior";

export class MeshRotate extends ScriptableBehavior
{
    objTransform: Transform;
    totalTime: number = 0;
    isMoving = false;

    constructor()
    {
        super("MeshRotate");
    }

    override Start(): void
    {
        this.objTransform = this.parentEntity!.getComponentOrThrow(TransformComponent).transform;
        this.objTransform.position[1] += 0;
    }

    override Update(): void
    {
        if (this.isMoving)
        {
            this.totalTime += LavaEngine.deltaTime;
            this.objTransform.position[1] += 0.005 * Math.sin(this.totalTime);
            this.objTransform.Rotate(vec3.fromValues(0, 50 * LavaEngine.deltaTime, 0));
            //this.objTransform.rotation[1] += 50 * LavaEngine.deltaTime;
            if (this.objTransform.rotation[1] >= 360)
            {
                //this.objTransform.rotation[1] = 0;
            }
        }
        
        if (Input.GetKeyPressed("r"))
        {
            this.isMoving = !this.isMoving;
        }
    }
}