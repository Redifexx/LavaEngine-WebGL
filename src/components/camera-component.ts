import { vec3 } from "gl-matrix";
import { Entity } from "../gameobjects/entity";
import { Component } from "../gameobjects/component";
import { Camera } from "../datatypes/camera";

export enum CameraType
{
    PERSPECTIVE,
    ORTHOGRAPHIC
}

export class CameraComponent extends Component
{
    static typeId: symbol = Symbol.for("CameraComponent");

    // Camera attributes
    camera: Camera;
    cameraType: CameraType;
    fieldOfView: number;
    nearPlane: number;
    farPlane: number;

    constructor(
        camera: Camera = new Camera(),
        cameraType: CameraType = CameraType.PERSPECTIVE,
        fieldOfView: number = 80.0,
        nearPlane: number = 0.01,
        farPlane: number = 100.0
    )
    {
        super();
        this.camera = camera;
        this.cameraType = cameraType;
        this.fieldOfView = fieldOfView;
        this.nearPlane = nearPlane;
        this.farPlane = farPlane;
    }
};