import { vec3 } from "gl-matrix";
import { TransformComponent, Transform } from "../components/transform-component";
import { Input } from "../engine/input";
import { LavaEngine } from "../engine/lava-engine";
import { ScriptableBehavior } from "../gameobjects/scriptable-behavior";
import { PlayerMovement } from "./playerMovement";
import { Entity } from "../gameobjects/entity";

export class LookAtPlayer extends ScriptableBehavior
{
    objTransform: Transform;
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
        this.objTransform = this.parentEntity!.getComponentOrThrow(TransformComponent).transform;
        this.eye = this.objTransform.position;
        this.target = this.player.getGlobalTransform().position;
    }

    override Update(): void
    {
        this.objTransform = this.parentEntity!.getComponentOrThrow(TransformComponent).transform;
        this.eye = this.objTransform.position;

        this.target = this.player.getGlobalTransform().position;

        console.log(this.target[0]);

        const forwardRot = this.lookAtEuler(this.target, this.eye);

        this.objTransform.rotation = vec3.fromValues(forwardRot[0], forwardRot[1] + 180, forwardRot[2]);

        if ((this.player.getScript("PlayerMovement")! as PlayerMovement).isMoving)
        {
            const moveSpeed = 5;                    // units per second
            const forwardDir = this.objTransform.GetForward(); 
            // or compute manually from rotation:
            // const forwardDir = eulerToDirection(
            //     forwardRot[0], forwardRot[1], forwardRot[2]);

            // Scale by speed and deltaTime (from your engine or LavaEngine.deltaTime)
            const step = vec3.scale(vec3.create(), forwardDir, -moveSpeed * LavaEngine.deltaTime);

            // Add to position
            vec3.add(this.objTransform.position, this.objTransform.position, step);
        }

    }

    lookAtVector(from: vec3, to: vec3): vec3 {
        const dir = vec3.create();
        vec3.subtract(dir, to, from);    // dir = to - from
        vec3.normalize(dir, dir);
        return dir;
    }

    lookAtEuler(from: vec3, to: vec3): vec3
    {
        const dir = this.lookAtVector(from, to);

        // yaw (around Y): atan2(x,z)
        const yaw   = Math.atan2(dir[0], dir[2]) * 180 / Math.PI;

        // pitch (around X): atan2(-y, horizontal length)
        const pitch = Math.atan2(-dir[1], Math.sqrt(dir[0] * dir[0] + dir[2] * dir[2])) * 180 / Math.PI;

        // roll is optional (0 if you don't want banking)
        const roll = 0 * 180 / Math.PI;
        
        let rot = vec3.fromValues(-pitch, yaw, roll);

        return rot;
    }

}