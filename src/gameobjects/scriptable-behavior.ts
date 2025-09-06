import { Entity } from "./entity";

export abstract class ScriptableBehavior
{
    parentEntity: Entity;

    constructor(e: Entity)
    {
        this.parentEntity = e;
    }

    public abstract Start(): void;
    public abstract Update(): void;
}