import { Entity } from "./entity";

export abstract class Component
{
    // every component type gets a unique bit ID
    static typeId: number;
    parentEntity: Entity;
}