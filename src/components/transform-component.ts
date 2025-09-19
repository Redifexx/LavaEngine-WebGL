import { glMatrix, quat, vec3 } from "gl-matrix";
import { Component } from "../gameobjects/component";
import { eulerToQuatLocal, eulerToQuatWorld } from "../gl-utils";

export class Transform 
{
    position: vec3 = vec3.create();
    rotation: quat = quat.create();
    scale: vec3 = vec3.create();

    Rotate(rot: vec3)
    {
        const newQ = eulerToQuatWorld(rot);
        quat.multiply(this.rotation, this.rotation, newQ);
        quat.normalize(this.rotation, this.rotation);
    }

    RotateLocal(rot: vec3)
    {
        const newQ = eulerToQuatLocal(rot);
        quat.multiply(this.rotation, this.rotation, newQ);
        quat.normalize(this.rotation, this.rotation);
    }
}

export class TransformComponent extends Component
{
    static typeId: symbol = Symbol.for("TransformComponent");
    transform: Transform = new Transform();

    constructor(
        pos: vec3,
        rot: quat,
        scale: vec3,
    )
    {
        super();
        this.transform.position = pos;
        this.transform.rotation = rot;
        this.transform.scale = scale;
    }
}