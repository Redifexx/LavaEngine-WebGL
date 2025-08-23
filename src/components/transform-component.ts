import { vec3 } from "gl-matrix";
import { Component } from "../gameobjects/component";

export class TransformComponent extends Component
{
    typeId = 0;
    position: vec3 = vec3.fromValues(0.0, 0.0, 0.0);
    rotation: vec3 = vec3.fromValues(0.0, 0.0, 0.0); // switch to quaternion
    scale: vec3 = vec3.fromValues(1.0, 1.0, 1.0);
}