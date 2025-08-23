import { vec3 } from "gl-matrix";
import { Entity } from "../gameobjects/entity";

export class CameraComponent
{
    typeId = 1;

    // Camera attributes
    Position: vec3;
    Front: vec3;
    Up: vec3;
    Right: vec3;
    WorldUp: vec3;

    // Euler Angles
    Yaw: number;
    Pitch: number;

    // Camera Options
    MovementSpeed: number;
    MouseSensitivity: number;
    Zoom: number;
    SpeedMultiplier: number;

    constructor(
        parentEntity_: Entity,
        position = vec3.fromValues(0.0, 0.0, 0.0),
        up = vec3.fromValues(0.0, 1.0, 0.0),
        yaw = -90.0, pitch = 0.0)
    {
        this.Front = vec3.fromValues(0.0, 0.0, -1.0);
        this.Right = vec3.create();
        this.Up = vec3.create();
        this.MovementSpeed = 8.0;
        this.MouseSensitivity = 0.1;
        this.Zoom = 80.0;
        this.SpeedMultiplier = 2.0;
        this.Position = position;
        this.WorldUp = up;
        this.Yaw = yaw;
        this.Pitch = pitch;
    }
};