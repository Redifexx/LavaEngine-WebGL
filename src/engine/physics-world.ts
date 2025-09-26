import Ammo from 'ammojs-typed';

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
            Lava.physics.ammo = await Ammo();
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
    }

    CreateTransform() {
        const ts = new Lava.physics.ammo.btTransform();
        ts.setIdentity();
        return ts;
    }

    destroy()
    {
        if (!this.World || !this.Ammo) return;

        const Ammo = this.Ammo;

        // 1. Remove and free all rigid bodies
        const numBodies = this.World.getNumCollisionObjects();
        for (let i = numBodies - 1; i >= 0; i--) {
            const obj = this.World.getCollisionObjectArray().at(i);
            this.World.removeCollisionObject(obj);

            // If you created motion states or shapes for this body,
            // free those too
            const body = Ammo.castObject(obj, Ammo.btRigidBody);
            if (body) {
                const motionState = body.getMotionState();
                if (motionState) Ammo.destroy(motionState);

                const shape = body.getCollisionShape();
                if (shape) Ammo.destroy(shape);
            }
            Ammo.destroy(obj);
        }

        // 2. Free world components
        const solver     = this.World.getConstraintSolver();
        const broadphase = this.World.getBroadphase();
        const dispatcher = this.World.getDispatcher();
        const config     = dispatcher.getCollisionConfiguration();

        Ammo.destroy(this.World);
        Ammo.destroy(solver);
        Ammo.destroy(broadphase);
        Ammo.destroy(dispatcher);
        Ammo.destroy(config);

        // 3. Null out references so GC can clean JS side
        this.World = null;
        this.Ammo  = null;
    }

}