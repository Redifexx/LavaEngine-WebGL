import { vec3 } from "gl-matrix";
import { Component } from "../gameobjects/component";

export class TransformComponent extends Component
{
    static typeId: symbol = Symbol.for("TransformComponent");
    position: vec3;
    rotation: vec3; // switch to quaternion
    scale: vec3;

    constructor(
        pos: vec3,
        rot: vec3,
        scale: vec3,
    )
    {
        super();
        this.position = pos;
        this.rotation = rot;
        this.scale = scale;
    }
}