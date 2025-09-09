import { glMatrix, vec3 } from "gl-matrix";
import { Component } from "../gameobjects/component";

export enum LightType
{
    DIRECTIONAL,
    POINT,
    SPOT
}

export class LightComponent extends Component
{
    static typeId: symbol = Symbol.for("LightComponent");

    lightType: number;
    color: vec3;
    intensity: number;
    innerCutOff: number;
    outerCutOff: number;
    hasShadows: boolean;

    constructor(
        lightType: number = LightType.DIRECTIONAL,
        color: vec3 = vec3.fromValues(1.0, 1.0, 1.0),
        intensity: number = 1.0,
        innerCutOff: number = Math.cos(glMatrix.toRadian(12.5)),
        outerCutOff: number = Math.cos(glMatrix.toRadian(30.5)),
        hasShadows: boolean = false
    )
    {
        super();
        this.lightType = lightType;
        this.color = color;
        this.intensity = intensity;
        this.hasShadows = hasShadows;
        this.innerCutOff = innerCutOff;
        this.outerCutOff = outerCutOff;
    }
}