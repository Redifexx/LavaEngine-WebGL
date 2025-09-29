import { vec3 } from "gl-matrix";
import { Component } from "../gameobjects/component";
import { LavaEngine } from "../engine/lava-engine";

export enum ColliderType
{
    BOX,
    SPHERE,
    CAPSULE,
    CYLINDER,
    CONE,
    CONVEXHULL
}

export class ColliderComponent extends Component
{
    static typeId: symbol = Symbol.for("ColliderComponent");

    scale: vec3;
    offset: vec3;
    height: number;
    radius: number;
    shape: any;
    
    constructor(col: ColliderType, scale: vec3 | null = null, offset: vec3 | null = null, height: number | null = null, radius: number | null = null)
    {
        super();

        if (!scale)
        {
            scale = vec3.fromValues(1.0, 1.0, 1.0);
        }

        if (!offset)
        {
            offset = vec3.fromValues(0.0, 0.0, 0.0);
        }

        if (!height)
        {
            height = 2.0;
        }

        if (!radius)
        {
            radius = 1.0;
        }


        const ammo = LavaEngine.physics.Ammo;

        const halfExtents = new ammo.btVector3(scale[0] + offset[0], scale[1] + offset[1], scale[2] + offset[2]);
        let shape: any;
        switch (col)
        {
            case ColliderType.BOX:
                shape = new ammo.btBoxShape(halfExtents);
                break;
            case ColliderType.SPHERE:
                shape = new ammo.btSphereShape(radius);
                break;
            case ColliderType.CAPSULE:
                shape = new ammo.btCapsuleShape(radius, height);
                break;
            case ColliderType.CYLINDER:
                shape = new ammo.btCylinderShape(new ammo.btVector3(radius, height / 2.0, radius));
                break;
            case ColliderType.CONE:
                shape = new ammo.btConeShape(radius, height);
                break;
            case ColliderType.CONVEXHULL:
                // todo
                break;
        }

        this.shape = shape;
    }
}