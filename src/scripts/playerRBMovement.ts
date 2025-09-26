import { vec3 } from "gl-matrix";
import { TransformComponent, Transform } from "../components/transform-component";
import { Input } from "../engine/input";
import { LavaEngine } from "../engine/lava-engine";
import { Entity } from "../gameobjects/entity";
import { ScriptableBehavior } from "../gameobjects/scriptable-behavior";
import { getQuatForward, getQuatRight } from "../gl-utils";
import { RigidbodyComponent } from "../components/rigidbody-component";

export class PlayerRBMovement extends ScriptableBehavior
{
    playerTransform: Transform;
    velocityY = 0.0;
    groundHeight = 0.0;
    movementVelocity = vec3.create();
    speed = 0.0;
    moveSpeed = 1.3;
    walkSpeed = 0.3;
    airSpeed = 0.3;
    isMoving: boolean;
    rigidbody: any;

    constructor()
    {
        super("PlayerRBMovement");
    }

    override Start(): void
    {
        this.playerTransform = this.parentEntity!.getComponentOrThrow(TransformComponent).transform;
        this.rigidbody = this.parentEntity!.getComponentOrThrow(RigidbodyComponent).body;
        this.isMoving = false;
    }

    override Update(): void
    {
        
    }

    override FixedUpdate(): void {
        if (LavaEngine.isPointerLock)
        {
            this.SpeedCheck();

            const acceleration = vec3.create();
            
            this.isMoving = false;

            if (Input.GetKeyHeld("w"))
            {
                vec3.add(acceleration, acceleration, getQuatForward(this.playerTransform.rotation));
                this.isMoving = true;
            }
            if (Input.GetKeyHeld("s"))
            {
                const backward = vec3.create();
                vec3.scale(backward, getQuatForward(this.playerTransform.rotation), -1);
                vec3.add(acceleration, acceleration, backward);
                this.isMoving = true;
            }
            if (Input.GetKeyHeld("d"))
            {
                vec3.add(acceleration, acceleration, getQuatRight(this.playerTransform.rotation));
                this.isMoving = true;
            }
            if (Input.GetKeyHeld("a"))
            {
                const left = vec3.create();
                vec3.scale(left, getQuatRight(this.playerTransform.rotation), -1);
                vec3.add(acceleration, acceleration, left);
                this.isMoving = true;
            }

            if (Input.GetKeyPressed("escape"))
            {
                document.exitPointerLock();
                LavaEngine.isPointerLock = false;
            }

            if (Input.GetKeyPressed("space"))
            {
                const onGround = this.GroundCheck();
                if (onGround) {
                    const jumpImpulse = new LavaEngine.physics.Ammo.btVector3(0, 5.0, 0);
                    this.rigidbody.applyCentralImpulse(jumpImpulse);
                    LavaEngine.physics.Ammo.destroy(jumpImpulse);
                }
            }

            // --- Movement force ---
            if (vec3.length(acceleration) > 0.1) {
                vec3.normalize(acceleration, acceleration);
                vec3.scale(acceleration, acceleration, this.speed);
                const impulse = new LavaEngine.physics.Ammo.btVector3(acceleration[0], 0, acceleration[2]);
                this.parentEntity!.getComponentOrThrow(RigidbodyComponent).body.applyCentralForce(impulse);
                LavaEngine.physics.Ammo.destroy(impulse);
            }
        }
    }

    SpeedCheck()
    {
        const onGround = this.GroundCheck();
        if (!onGround && this.speed !== this.airSpeed)
        {
            this.speed = this.airSpeed;
        }
        else if (onGround) {
            if (Input.GetKeyHeld("shiftleft")) {
                this.speed = this.walkSpeed;
            } else {
                this.speed = this.moveSpeed;
            }
        }
    }

    GroundCheck(): boolean
    {
        /*
        const Ammo = LavaEngine.physics.Ammo;
        const trans = new Ammo.btTransform();
        this.rigidbody.getMotionState().getWorldTransform(trans);
        const origin = trans.getOrigin();

        // Cast a short ray straight down
        const from = new Ammo.btVector3(origin.x(), origin.y(), origin.z());
        const to   = new Ammo.btVector3(origin.x(), origin.y() - 1.1, origin.z());
        const ray  = new Ammo.ClosestRayResultCallback(from, to);

        LavaEngine.physics.World.rayTest(from, to, ray);
        const hit = ray.hasHit();
        
        if (hit) console.log("isGrounded");
        */
        return true;
    }

}