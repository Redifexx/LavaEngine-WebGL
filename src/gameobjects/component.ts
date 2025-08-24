import { Entity } from "./entity";

export abstract class Component
{
    // every component type gets a unique bit ID
    static typeId: symbol;
    parentEntity: Entity;
}

export interface ComponentConstructor<T extends Component> {
    new (...args: any[]): T;
    typeId: symbol;
}