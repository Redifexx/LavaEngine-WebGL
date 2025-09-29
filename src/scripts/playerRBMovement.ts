import { quat, vec2, vec3 } from "gl-matrix";
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
    moveSpeed = 15.0;
    walkSpeed = 7.0;
    airSpeed = 5.0;
    isMoving: boolean;
    rigidbody: any;
    move: vec2;

    constructor()
    {
        super("PlayerRBMovement");
    }

    override Start(): void
    {
        this.playerTransform = this.parentEntity!.getComponentOrThrow(TransformComponent).transform;
        this.rigidbody = this.parentEntity!.getComponentOrThrow(RigidbodyComponent).body;
        //this.rigidbody.setActivationState(4);
        this.rigidbody.setAngularFactor(new LavaEngine.physics.Ammo.btVector3(0, 1, 0));
        this.rigidbody.setDamping(0.1, 0.1);
        this.rigidbody.setFriction(0.6); 
        this.isMoving = false;
        this.move = vec2.create();
        this.targetSpeed = 0.0;
    }

    override Update(): void
    {
        const Ammo = LavaEngine.physics.Ammo;
        if (LavaEngine.isPointerLock)
        {
            this.SpeedCheck();

            //console.log(this.speed, this.isMoving);
            if (Math.abs(this.speed - this.targetSpeed) > 0.01)
            {
                this.speed = lerp(this.speed, this.targetSpeed, 5 * LavaEngine.deltaTime);
            }

            this.GetMoveInput();
            
            this.isMoving = (vec2.length(this.move) > 0.01);

            const moveDir = vec3.create();
            // Forward
            let playerForward = getQuatForward(this.playerTransform.rotation);
            let playerRight = getQuatRight(this.playerTransform.rotation);
            vec3.scale(playerForward, playerForward, this.move[1]);
            vec3.scale(playerRight, playerRight, this.move[0]);
            vec3.add(moveDir, playerForward, playerRight);


            if (Input.GetKeyPressed("escape"))
            {
                document.exitPointerLock();
                LavaEngine.isPointerLock = false;
            }

            if (Input.GetKeyPressed("space"))
            {
                const onGround = this.GroundCheck();
                if (onGround) {
                    const jumpImpulse = new LavaEngine.physics.Ammo.btVector3(0, 7.0, 0);
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

            const rbBody = this.rigidbody;
            const velocity = rbBody.getLinearVelocity();
            const vel = vec3.fromValues(velocity.x(), velocity.y(), velocity.z());

            if (this.isMoving)
            {
                vec3.normalize(moveDir, moveDir); 
                const desired = vec3.scale([], moveDir, this.speed);
                const newVel = new Ammo.btVector3(desired[0], velocity.y(), desired[2]);
                rbBody.setLinearVelocity(newVel);
                Ammo.destroy(newVel);
            }
            else
            {
                this.targetSpeed = 0.0;
                const factor = 0.9;
                const stop = new LavaEngine.physics.Ammo.btVector3(velocity.x() * factor, velocity.y(), velocity.z() * factor);
                rbBody.setLinearVelocity(stop);
                LavaEngine.physics.Ammo.destroy(stop);
            }
            
            /*
            
            // --- Movement force ---
            if (vec3.length(moveDir) > 0.1) {
                vec3.normalize(moveDir, moveDir);
                vec3.scale(moveDir, moveDir, this.speed * 2);
                const impulse = new LavaEngine.physics.Ammo.btVector3(moveDir[0], 0, moveDir[2]);
                this.parentEntity!.getComponentOrThrow(RigidbodyComponent).body.applyCentralForce(impulse);
                LavaEngine.physics.Ammo.destroy(impulse);
            }
                

            const horizVel = Math.hypot(velocity.x(), velocity.z());
            const maxSpeed = this.speed * 3;

            if (this.isMoving) {
                // accelerate harder until we reach the cap
                const dot = vec3.dot(moveDir, vel);
                if (dot < 0) { // moving opposite to input
                    const stop = new LavaEngine.physics.Ammo.btVector3(0, velocity.y(), 0);
                    rbBody.setLinearVelocity(stop);
                    LavaEngine.physics.Ammo.destroy(stop);
                }
                const forceMag = (1 - horizVel / maxSpeed) * 50.0;
                const impulse = new LavaEngine.physics.Ammo.btVector3(
                    moveDir[0] * forceMag,
                    0,
                    moveDir[2] * forceMag
                );
                rbBody.applyCentralForce(impulse);
                LavaEngine.physics.Ammo.destroy(impulse);
            }
            else
            {
                const factor = 0.9;
                const stop = new LavaEngine.physics.Ammo.btVector3(velocity.x() * factor, velocity.y(), velocity.z() * factor);
                rbBody.setLinearVelocity(stop);
                LavaEngine.physics.Ammo.destroy(stop);
            }
                */

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
        else if (onGround && this.isMoving) {
            if (Input.GetKeyHeld("shiftleft")) {
                this.targetSpeed = this.walkSpeed;
            } else {
                this.targetSpeed = this.moveSpeed;
            }
        }
    }

    GetMoveInput()
    {
        this.move[0] = 0.0;
        this.move[1] = 0.0;
        if (Input.GetKeyHeld("w"))
        {
            this.move[1] = 1.0;
        }
        if (Input.GetKeyHeld("s"))
        {
            this.move[1] = -1.0;
        }
        if (Input.GetKeyHeld("d"))
        {
            this.move[0] = 1.0;
        }
        if (Input.GetKeyHeld("a"))
        {
            this.move[0] = -1.0;
        }
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