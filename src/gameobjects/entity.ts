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
    scripts: Map<string, ScriptableBehavior> = new Map();
    isActive: boolean;

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
        this.isActive = true;
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

    addScript<T extends ScriptableBehavior>(script: T): T
    {
        script.parentEntity = this as Entity;
        this.scripts.set(script.name, script);
        return script;
    }

    getScript<T extends ScriptableBehavior>(name: string): T | undefined {
        return this.scripts.get(name) as T | undefined;
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
        const localPos = transformComponent.transform.position;

        if (this.parentEntity) {
            const parentPos = this.parentEntity.getGlobalPosition();
            const parentScale = this.parentEntity.getGlobalTransform().scale;
            const scaledLocal = vec3.create();
            vec3.multiply(scaledLocal, localPos, parentScale);
            const result = vec3.create();
            vec3.add(result, parentPos, scaledLocal);

            /* NEED TO FIX
            const parentRot = this.parentEntity.getGlobalRotationQuat();

            const rotatedLocal = vec3.create();
            if (vec3.length(localPos) > 0.0001) {
                vec3.transformQuat(rotatedLocal, scaledLocal, parentRot);
            } else {
                vec3.copy(rotatedLocal, scaledLocal); 
            }
            
            const result = vec3.create();
            vec3.add(result, parentPos, rotatedLocal);
            */
           
            if (this.name === "Camera" && Input.GetKeyHeld("e"))
            {
                console.log(result);
            }
            return result;
        }

        return vec3.clone(localPos);
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

    getActive(): boolean
    {
        let globalActive = true;
        if (this.parentEntity)
        {
            globalActive = this.parentEntity.getActive();
        }
        return (this.isActive && globalActive);
    }

    setActive(b: boolean)
    {
        this.isActive = b;
        this.scene.updateEntity(this);
    }

    hasComponent<T extends Component>(type: ComponentConstructor<T>): boolean
    {
        return this.components.has(type.typeId);
    }
}