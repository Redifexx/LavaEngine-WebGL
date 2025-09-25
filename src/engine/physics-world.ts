import * as Ammo from 'ammojs-typed';
import { LavaEngine } from './lava-engine';

export const Lava = {
    physics: {
        ammo: null as any
    }
};

export class PhysicsWorld
{
    World: any;
    Ammo: any;
    gravity = -9.81;

    async Init()
    {
        // Await the factory to get the Ammo module
        if (!Lava.physics.ammo) {
            Lava.physics.ammo = await (Ammo as any)();
        }
        this.Ammo = Lava.physics.ammo;

        const collisionConfig = new Lava.physics.ammo.btDefaultCollisionConfiguration();
        const dispatcher      = new Lava.physics.ammo.btCollisionDispatcher(collisionConfig);
        const broadphase      = new Lava.physics.ammo.btDbvtBroadphase(); // or interface you prefer
        const solver          = new Lava.physics.ammo.btSequentialImpulseConstraintSolver();

        const dynamicsWorld = new Lava.physics.ammo.btDiscreteDynamicsWorld(
            dispatcher, broadphase, solver, collisionConfig
        );
        dynamicsWorld.setGravity(new Lava.physics.ammo.btVector3(0, this.gravity, 0));

        this.World = dynamicsWorld;
        this.Ammo = Lava.physics.ammo;

        // Now it's safe to log or use this.World
        console.log("Ammo World Ready", this.World);
    }

    CreateTransform() {
        const ts = new Lava.physics.ammo.btTransform();
        ts.setIdentity();
        return ts;
    }

}