import { Entity } from "./entity";

export abstract class ScriptableBehavior
{
    name: string;
    parentEntity: Entity | null = null;

    constructor(n: string)
    {
        this.name = n;
    }

    public abstract Start(): void;
    public abstract Update(): void;
}