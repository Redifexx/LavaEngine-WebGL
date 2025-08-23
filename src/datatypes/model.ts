import { TransformComponent } from "../components/transform-component";
import { MaterialData } from "./material-data";
import { Mesh } from "./mesh";
import { ShaderData } from "./shader-data";

export class Model
{
    meshCollection: Mesh[] = [];
    materialData: MaterialData; 


    constructor(
        materialData: MaterialData // must have
    )
    {
        this.setMaterial(materialData);
    }

    setMaterial(materialData: MaterialData)
    {
        this.materialData = materialData;
        for(let i = 0; i < this.meshCollection.length; i++)
        {
            this.meshCollection[i].setVAO();
        }
    }

    addMesh(mesh: Mesh)
    {
        mesh.materialData = this.materialData;
        mesh.setVAO();
        this.meshCollection.push(mesh);
    }
    
    draw(transform: TransformComponent)
    {
        for(let i = 0; i < this.meshCollection.length; i++)
        {
            this.draw(transform);
        }
    }
}