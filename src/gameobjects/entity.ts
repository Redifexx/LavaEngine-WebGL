import { quat, vec3 } from "gl-matrix";
import { TransformComponent, Transform } from "../components/transform-component";
import { Component, ComponentConstructor } from "./component"
import { Scene } from "./scene";
import { ScriptableBehavior } from "./scriptable-behavior";
import { Input } from "../engine/input";
import { eulerToQuatWorld, quatToEuler } from "../gl-utils";

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
        this.transformComponent = new TransformComponent(pos, eulerToQuatWorld(rotation), scale);
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
        newTransform.scale = this.getGlobalScale();
        return newTransform;
    }

   getGlobalPosition(): vec3
   {
        const { position } = this.transformComponent.transform;
        let out = vec3.create();
        vec3.copy(out, position);

        if (this.parentEntity)
        {
            const parentPos = this.parentEntity.getGlobalPosition();
            const parentRot = this.parentEntity.getGlobalRotation();
            const parentScale = this.parentEntity.getGlobalScale();

            const scaled = vec3.create();
            vec3.multiply(scaled, position, parentScale);
            
            const rotated = vec3.create();
            vec3.transformQuat(rotated, scaled, parentRot);

            vec3.add(out, parentPos, rotated);
        }

        return out;
    }

    getGlobalRotation(): quat
    {
        const { rotation } = this.transformComponent.transform;
        let out = quat.create();
        quat.copy(out, rotation);

        if (this.parentEntity)
        {
            const parentRot = this.parentEntity.getGlobalRotation();
            quat.multiply(out, parentRot, rotation);
            quat.normalize(out, out);
        }

        return out;
    }

    getGlobalScale(): vec3
    {
        const { scale } = this.transformComponent.transform;
        let out = vec3.create();
        vec3.copy(out, scale);

        if (this.parentEntity)
        {
            const parentScale = this.parentEntity.getGlobalScale();
            vec3.multiply(out, parentScale, scale);
        }

        return out;
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