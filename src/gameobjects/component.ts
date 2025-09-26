import { Entity } from "./entity";

export abstract class Component
{
    static typeId: symbol;
    parentEntity: Entity;
    destroy(): void {}
}

export interface ComponentConstructor<T extends Component> {
    new (...args: any[]): T;
    typeId: symbol;
}