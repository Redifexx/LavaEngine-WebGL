import { vec3 } from "gl-matrix";
import { TransformComponent } from "../components/transform-component";
import { Component, ComponentConstructor } from "./component"
import { Scene } from "./scene";

export class Entity
{
    id: number;
    scene: Scene;
    transformComponent: TransformComponent;
    components: Map<symbol, Component> = new Map();

    parentEntity: Entity | null;
    childEntities: Entity[] = [];
    constructor(
        eID: number = 0,
        scene: Scene,
        pos: vec3,
        rotation: vec3,
        scale: vec3
    ) {
        this.scene = scene;
        this.id = eID;
        this.transformComponent = new TransformComponent(pos, rotation, scale);
        this.addComponent(TransformComponent, this.transformComponent);
    }

    addChildEntity(childEntity: Entity)
    {
        this.childEntities.push(childEntity);
    }

    addComponent<T extends Component>(componentClass: ComponentConstructor<T>, component: T)
    {
        component.parentEntity = this;
        this.components.set(componentClass.typeId, component);
        this.scene.updateEntity(this);
    }

    getComponent<T extends Component>(type: ComponentConstructor<T>): T | undefined
    {
        return this.components.get(type.typeId) as T | undefined;
    }

    getComponentOrThrow<T extends Component>(type: ComponentConstructor<T>): T
    {
        const component = this.getComponent(type);
        if (!component) {
            throw new Error(`Component ${type.name} not found on entity`);
        }
        return component;
    }

   getGlobalPosition(): vec3
   {
        const transform = this.getComponentOrThrow(TransformComponent);

        if (this.parentEntity) {
            const parentPos = this.parentEntity.getGlobalPosition();
            const result = vec3.create();
            vec3.add(result, transform.position, parentPos);
            return result;
        }

        // return a copy, not the internal reference
        return vec3.clone(transform.position);
    }

    hasComponent<T extends Component>(type: ComponentConstructor<T>): boolean
    {
        return this.components.has(type.typeId);
    }
}