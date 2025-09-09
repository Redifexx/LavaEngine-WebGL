import { Model } from "../datatypes/model";
import { Component } from "../gameobjects/component";


export class ModelComponent extends Component
{
    static typeId: symbol = Symbol.for("ModelComponent");

    model: Model;

    constructor(model: Model)
    {
        super();
        this.model = model;
    }
}