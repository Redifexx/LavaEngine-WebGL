import { quat, vec3 } from "gl-matrix";
import { TransformComponent, Transform } from "../components/transform-component";
import { Input } from "../engine/input";
import { LavaEngine } from "../engine/lava-engine";
import { Entity } from "../gameobjects/entity";
import { ScriptableBehavior } from "../gameobjects/scriptable-behavior";
import { getQuatForward, getQuatRight, lerp } from "../gl-utils";
import { RigidbodyComponent } from "../components/rigidbody-component";
import { Lava } from "../engine/physics-world";

export class PlayerRBMovement extends ScriptableBehavior
{
    playerTransform: Transform;
    velocityY = 0.0;
    groundHeight = 0.0;
    movementVelocity = vec3.create();
    speed = 0.0;
    targetSpeed = 0.0;
    moveSpeed = 20.0;
    walkSpeed = 100.0;
    airSpeed = 100.0;
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
        this.rigidbody.setActivationState(4);
        this.rigidbody.setAngularFactor(new LavaEngine.physics.Ammo.btVector3(0, 1, 0));
        this.rigidbody.setDamping(0.1, 0.1);
        this.rigidbody.setFriction(1.0);
        this.isMoving = false;
    }

    override Update(): void
    {
        if (LavaEngine.isPointerLock)
        {
            this.SpeedCheck();

            this.speed = lerp(this.moveSpeed, this.targetSpeed, 10 * LavaEngine.deltaTime);

            const moveDir = vec3.create();
            
            this.isMoving = false;

            if (Input.GetKeyHeld("w"))
            {
                vec3.add(moveDir, moveDir, getQuatForward(this.playerTransform.rotation));
                this.isMoving = true;
            }
            if (Input.GetKeyHeld("s"))
            {
                const backward = vec3.create();
                vec3.scale(backward, getQuatForward(this.playerTransform.rotation), -1);
                vec3.add(moveDir, moveDir, backward);
                this.isMoving = true;
            }
            if (Input.GetKeyHeld("d"))
            {
                vec3.add(moveDir, moveDir, getQuatRight(this.playerTransform.rotation));
                this.isMoving = true;
            }
            if (Input.GetKeyHeld("a"))
            {
                const left = vec3.create();
                vec3.scale(left, getQuatRight(this.playerTransform.rotation), -1);
                vec3.add(moveDir, moveDir, left);
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
                    const jumpImpulse = new LavaEngine.physics.Ammo.btVector3(0, 50.0, 0);
                    this.rigidbody.applyCentralImpulse(jumpImpulse);
                    LavaEngine.physics.Ammo.destroy(jumpImpulse);
                }
            }

            /*
            const rbBody = this.rigidbody; // Ammo.js rigidbody
            const velocity = rbBody.getLinearVelocity();

            // only consider horizontal movement
            const horizontalVel = vec3.fromValues(velocity.x(), 0, velocity.z());
            const horizontalSpeed = vec3.length(horizontalVel);

            const currentMoveSpeed = this.speed;
            const airMultiplier = 1.0; // or change depending on grounded

            if (horizontalSpeed < currentMoveSpeed) {
                vec3.normalize(moveDir, moveDir);
                vec3.scale(moveDir, moveDir, currentMoveSpeed * 10 * airMultiplier);

                const impulse = new LavaEngine.physics.Ammo.btVector3(moveDir[0], 0, moveDir[2]);
                rbBody.applyCentralForce(impulse);
                LavaEngine.physics.Ammo.destroy(impulse);
            }*/

            const rbBody = this.rigidbody; // Ammo.js rigidbody
            const velocity = rbBody.getLinearVelocity();
            
            
            // --- Movement force ---
            if (vec3.length(moveDir) > 0.1 && velocity.length() < this.speed) {
                vec3.normalize(moveDir, moveDir);
                vec3.scale(moveDir, moveDir, this.speed);
                const impulse = new LavaEngine.physics.Ammo.btVector3(moveDir[0], 0, moveDir[2]);
                this.parentEntity!.getComponentOrThrow(RigidbodyComponent).body.applyCentralForce(impulse);
                //console.log(this.parentEntity!.getComponentOrThrow(RigidbodyComponent).body);
                LavaEngine.physics.Ammo.destroy(impulse);
            }

            // Get current velocity

            // Clamp horizontal speed
            const horizontalVel = vec3.fromValues(velocity.x(), 0, velocity.z());
            const speed = vec3.length(horizontalVel);
        }
    }

    override FixedUpdate(): void {
    }

    SpeedCheck()
    {
        const onGround = this.GroundCheck();
        if (!onGround && this.speed !== this.airSpeed)
        {
            this.targetSpeed = this.airSpeed;
        }
        else if (onGround) {
            if (Input.GetKeyHeld("shiftleft")) {
                this.targetSpeed = this.walkSpeed;
            } else {
                this.targetSpeed = this.moveSpeed;
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