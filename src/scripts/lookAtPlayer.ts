import { mat3, mat4, quat, vec3 } from "gl-matrix";
import { TransformComponent, Transform } from "../components/transform-component";
import { Input } from "../engine/input";
import { LavaEngine } from "../engine/lava-engine";
import { ScriptableBehavior } from "../gameobjects/scriptable-behavior";
import { PlayerMovement } from "./playerMovement";
import { Entity } from "../gameobjects/entity";
import { getQuatForward } from "../gl-utils";

export class LookAtPlayer extends ScriptableBehavior
{
    playerTransform: Transform;
    player: Entity;
    totalTime: number = 0;
    isMoving = false;
    eye: vec3;
    target: vec3;

    constructor(playerTransform: Transform)
    {
        super("LookAtPlayer");
        this.playerTransform = playerTransform;
    }

    override Start(): void
    {
        this.eye = this.parentEntity!.getGlobalPosition();
        this.target = this.player.getGlobalTransform().position;
    }

    override Update(): void
    {
        this.eye = this.parentEntity!.getGlobalPosition();
        vec3.add(this.eye, this.eye, vec3.fromValues(0, -2.0, 0));

        this.target = this.player.getGlobalPosition();

        const targetQuat = this.lookAtQuat(this.eye, this.target);

        // SLERP rotation
        const currentQuat = this.parentEntity!.getComponentOrThrow(TransformComponent).transform.rotation;
        const slerpSpeed = 5; // adjust this for faster/slower rotation
        quat.slerp(currentQuat, currentQuat, targetQuat, slerpSpeed * LavaEngine.deltaTime);

        const vecDiff = vec3.create();
        vec3.subtract(vecDiff, this.target, this.eye);
        const distance = vec3.length(vecDiff);

        if (distance > 0.1)
        {
            const moveSpeed = 0;            
            const forwardDir = getQuatForward(this.parentEntity!.getGlobalRotation()); 
            const step = vec3.scale(vec3.create(), forwardDir, moveSpeed * LavaEngine.deltaTime);

            // Add to position
            const transform = this.parentEntity!.getComponentOrThrow(TransformComponent).transform;
            vec3.add(transform.position, transform.position, step);
        }

    }

    lookAtQuat(eye: vec3, target: vec3, up: vec3 = [0, 1, 0]): quat {
        const forward = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), target, eye));
        const right   = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), up, forward));
        const realUp  = vec3.cross(vec3.create(), forward, right);

        const m = mat3.fromValues(
            right[0],  right[1],  right[2],
            realUp[0], realUp[1], realUp[2],
            forward[0],forward[1],forward[2]  // +Z forward
        );

        const q = quat.create();
        quat.fromMat3(q, m);
        return q;
    }

}