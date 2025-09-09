import { glMatrix, vec3 } from "gl-matrix";
import { Component } from "../gameobjects/component";

export class Transform 
{
    position: vec3 = vec3.create();
    rotation: vec3 = vec3.create();
    scale: vec3 = vec3.create();
    private forward: vec3 = vec3.create();
    private up: vec3 = vec3.create();
    private right: vec3 = vec3.create();

    GetForward()
    {
        const yaw: number = glMatrix.toRadian(this.rotation[1]);
        const pitch: number = glMatrix.toRadian(this.rotation[0]);
        
        this.forward[0] = Math.cos(pitch) * Math.sin(yaw); 
        this.forward[1] = Math.sin(pitch);
        this.forward[2] = -Math.cos(pitch) * Math.cos(yaw);
        vec3.normalize(this.forward, this.forward);
        return this.forward;
    }

    GetRight()
    {
        vec3.cross(this.right, this.GetForward(), [0, 1, 0]); // world up
        vec3.normalize(this.right, this.right);
        return this.right;
    }

    GetUp()
    {
        this.GetRight();
        vec3.cross(this.up, this.right, this.forward);
        vec3.normalize(this.up, this.up);
        return this.up;
    }
}

export class TransformComponent extends Component
{
    static typeId: symbol = Symbol.for("TransformComponent");
    transform: Transform = new Transform();

    constructor(
        pos: vec3,
        rot: vec3,
        scale: vec3,
    )
    {
        super();
        this.transform.position = pos;
        this.transform.rotation = rot;
        this.transform.scale = scale;
    }
}