import { Model } from "../datatypes/model";
import { Component } from "../gameobjects/component";


export class ModelComponent extends Component
{
    static typeId: symbol = Symbol.for("ModelComponent");

    model: Model;
    hasShadows: boolean;

    constructor(model: Model, hasShadows: boolean = true)
    {
        super();
        this.model = model;
        this.hasShadows = hasShadows;
    }
}