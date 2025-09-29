import { quat, vec2, vec3 } from "gl-matrix";
import { TransformComponent, Transform } from "../components/transform-component";
import { Input } from "../engine/input";
import { LavaEngine } from "../engine/lava-engine";
import { Entity } from "../gameobjects/entity";
import { ScriptableBehavior } from "../gameobjects/scriptable-behavior";
import { getQuatForward, getQuatRight, lerp } from "../gl-utils";
import { RigidbodyComponent } from "../components/rigidbody-component";
import { Lava } from "../engine/physics-world";
import { Material } from "../datatypes/material";
import { ColliderComponent, ColliderType } from "../components/collider-component";

export class BallSpawn extends ScriptableBehavior
{
    playerTransform: Transform;
    velocityY = 0.0;
    groundHeight = 0.0;
    movementVelocity = vec3.create();
    speed = 0.0;
    targetSpeed = 0.0;
    moveSpeed = 15.0;
    walkSpeed = 7.0;
    airSpeed = 5.0;
    isMoving: boolean;
    rigidbody: any;
    move: vec2;
    maxBalls: number = 100;
    ballList: Entity[];
    mat: Material;
    activeCount: number;

    constructor(mat: Material = LavaEngine.defaultMaterial)
    {
        super("BallSpawn");
        this.mat = mat;
    }

    override Start(): void
    {
        this.ballList = new Array(this.maxBalls);
        this.activeCount = 0;
        for (let i = 0; i < this.maxBalls; i++)
        {
            this.ballList[i] = LavaEngine.project.MAIN_SCENE.importModel(
                `Cube${i}`,
                vec3.fromValues(0.0, 5.0, 0.0),
                vec3.fromValues(0.0, 0.0, 0.0),
                vec3.fromValues(0.3, 0.3, 0.3),
                this.mat, "./models/sphere.json"
            );
            this.ballList[i].addComponent(ColliderComponent, new ColliderComponent(ColliderType.SPHERE, null, null, null, 0.3));
            this.ballList[i].addComponent(RigidbodyComponent, new RigidbodyComponent(this.ballList[i], 1.0));
            this.ballList[i].setActive(true);
        }
    }

    override Update(): void
    {
        const lookDir = vec3.create();
        // Forward
        const cam = this.parentEntity!.getChildEntity("Camera")!;
        let playerForward = getQuatForward(cam.getGlobalRotation());
        vec3.scale(playerForward, playerForward, 2.0);
        //vec3.normalize(playerForward, playerForward);

        if (Input.GetKeyPressed("f"))
        {
            if (this.activeCount < this.maxBalls)
            {
                const rb = this.ballList[this.activeCount].getComponentOrThrow(RigidbodyComponent).body;
                //this.ballList[this.activeCount].setActive(!this.ballList[this.activeCount].isActive);
                const curPos = cam.getGlobalPosition();
                const newPos = vec3.add([], curPos, playerForward);

                this.ballList[this.activeCount].setPhysicsPosition(newPos);

                const linVel = new LavaEngine.physics.Ammo.btVector3(0.0, 0.0, 0.0);
                rb.setLinearVelocity(linVel);
                LavaEngine.physics.Ammo.destroy(linVel);

                const ballDir = vec3.scale([], playerForward, 20.0);
                const jumpImpulse = new LavaEngine.physics.Ammo.btVector3(ballDir[0], ballDir[1], ballDir[2]);
                rb.applyCentralImpulse(jumpImpulse);
                LavaEngine.physics.Ammo.destroy(jumpImpulse);

                const velocity = rb.getLinearVelocity();
                const vel = vec3.fromValues(velocity.x(), velocity.y(), velocity.z());


                console.log("ball", newPos, vel, this.ballList[this.activeCount].isActive);
                this.activeCount++;
            }
            else
            {this.activeCount = 0}
        }
    }

    override FixedUpdate(): void
    {
    }


    GroundCheck(): boolean
    {
        
        const Ammo = LavaEngine.physics.Ammo;
        const trans = new Ammo.btTransform();
        this.rigidbody.getMotionState().getWorldTransform(trans);
        const origin = trans.getOrigin();

        // Cast a short ray straight down
        const from = new Ammo.btVector3(origin.x(), origin.y(), origin.z());
        const to   = new Ammo.btVector3(origin.x(), origin.y() - 2.1, origin.z());
        const ray  = new Ammo.ClosestRayResultCallback(from, to);

        LavaEngine.physics.World.rayTest(from, to, ray);
        const hit = ray.hasHit();

        Ammo.destroy(ray);
        Ammo.destroy(from);
        Ammo.destroy(to);
        Ammo.destroy(trans);

        //if (hit) console.log("isGrounded");
        
        return hit;
    }

}