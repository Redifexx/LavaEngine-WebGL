import { TransformComponent } from "../components/transform-component";
import { Component } from "./component"

export class Entity
{
    id: number;
    transformComponent: TransformComponent = new TransformComponent();
    components: Map<Function, Component> = new Map();
    constructor(eID: number = 0) {
        this.id = eID;
    }
}