import { quat, vec3 } from "gl-matrix";
import { TransformComponent, Transform } from "../components/transform-component";
import { Component, ComponentConstructor } from "./component"
import { Scene } from "./scene";
import { ScriptableBehavior } from "./scriptable-behavior";
import { Input } from "../engine/input";
import { eulerToQuat, quatToEuler } from "../gl-utils";

export class Entity
{
    id: number;
    name: string;
    scene: Scene;
    transformComponent: TransformComponent;
    components: Map<symbol, Component> = new Map();
    scripts = new Set<ScriptableBehavior>();

    parentEntity: Entity | null;
    childEntities: Entity[] = [];
    constructor(
        eID: number = 0,
        eName: string,
        scene: Scene,
        pos: vec3,
        rotation: vec3,
        scale: vec3
    ) {
        this.scene = scene;
        this.id = eID;
        this.name = eName;
        this.transformComponent = new TransformComponent(pos, rotation, scale);
        this.addComponent(TransformComponent, this.transformComponent);
    }

    addChildEntity(childEntity: Entity)
    {
        this.childEntities.push(childEntity);
        childEntity.parentEntity = this;
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

    addScript<T extends ScriptableBehavior>(ScriptClass: new (e: Entity) => T): T {
        const script = new ScriptClass(this);
        this.scripts.add(script);
        return script;
    }

    getGlobalTransform(): Transform
    {
        let newTransform: Transform = new Transform();
        newTransform.position = this.getGlobalPosition();
        newTransform.rotation = this.getGlobalRotation();
        newTransform.scale = this.transformComponent.transform.scale;
        return newTransform;
    }

   getGlobalPosition(): vec3
   {
        const transformComponent = this.getComponentOrThrow(TransformComponent);

        if (this.parentEntity) {
            const parentPos = this.parentEntity.getGlobalPosition();
            const result = vec3.create();
            vec3.add(result, transformComponent.transform.position, parentPos);
            if (this.name === "Camera" && Input.GetKeyHeld("e"))
            {
                console.log(result);
            }
            return result;
        }

        // return a copy, not the internal reference
        return vec3.clone(transformComponent.transform.position);
    }

    getGlobalRotation(): vec3
    {
        const transformComponent = this.getComponentOrThrow(TransformComponent);

        const localQuat = eulerToQuat(transformComponent.transform.rotation);

        if (this.parentEntity)
        {
            const parentQuat = this.parentEntity.getGlobalRotationQuat();
            const globalQuat = quat.create();
            quat.multiply(globalQuat, parentQuat, localQuat);

            const euler = quatToEuler(globalQuat);
            return euler;
        }
        return vec3.clone(transformComponent.transform.rotation);
    }

    getGlobalRotationQuat(): quat
    {
        const transformComponent = this.getComponentOrThrow(TransformComponent);
        const localQuat = eulerToQuat(transformComponent.transform.rotation);
        if (this.parentEntity)
        {
            const parentQuat = this.parentEntity.getGlobalRotationQuat();
            const globalQuat = quat.create();
            quat.multiply(globalQuat, parentQuat, localQuat);
            return globalQuat;
        }
        return localQuat;
    }

    hasComponent<T extends Component>(type: ComponentConstructor<T>): boolean
    {
        return this.components.has(type.typeId);
    }
}