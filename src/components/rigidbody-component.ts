import { vec3 } from "gl-matrix";
import { Component } from "../gameobjects/component";
import { LavaEngine } from "../engine/lava-engine";
import { ColliderComponent } from "./collider-component";
import { showError } from "../gl-utils";
import { Entity } from "../gameobjects/entity";
import * as Ammo from "ammojs-typed";


export class RigidbodyComponent extends Component
{
    static typeId: symbol = Symbol.for("RigidbodyComponent");

    mass: number;
    localInertia: any;
    body: any;
    isKinematic: boolean;

    constructor(e: Entity, mass: number = 1.0, isKinematic: boolean = false)
    {
        super();
        let localInertia = vec3.fromValues(0.0, 0.0, 0.0);
        if (e.getComponentOrThrow(ColliderComponent) === undefined)
        {
            showError("Missing collider component!!!");
            return;
        }

        this.isKinematic = isKinematic;

        const shape = e.getComponentOrThrow(ColliderComponent)!.shape;
        
        const parentTransform = e.getGlobalTransform();
        const ammo = LavaEngine.physics.Ammo;

        // setup transform
        const transform = new ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new ammo.btVector3(parentTransform.position[0], parentTransform.position[1], parentTransform.position[2]));

        // motion state setup
        const motionState = new ammo.btDefaultMotionState(transform);

        this.mass = mass;

        const newlocalInertia = new ammo.btVector3(localInertia[0], localInertia[1], localInertia[2]);
        shape.calculateLocalInertia(mass, newlocalInertia);
        this.localInertia = newlocalInertia;

        const rbInfo = new ammo.btRigidBodyConstructionInfo(
            this.mass,
            motionState,
            shape,
            this.localInertia
        );

        const body = new ammo.btRigidBody(rbInfo);
        this.body = body;

        e.ammoPosition = new ammo.btVector3();
        e.ammoQuat = new ammo.btQuaternion();
        e.ammoMotionState = new ammo.btDefaultMotionState();

        LavaEngine.physics.World.addRigidBody(body);
    }
}