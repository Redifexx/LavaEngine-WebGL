import { TransformComponent } from "../components/transform-component";
import { Material } from "./material";
import { Mesh } from "./mesh";

export class Model
{
    meshCollection: Mesh[] = [];
    material: Material; 


    constructor(
        material: Material,
        mesh: Mesh
    )
    {
        this.setMaterial(material);
        this.addMesh(mesh);
    }

    setMaterial(material: Material)
    {
        this.material = material;
        for(let i = 0; i < this.meshCollection.length; i++)
        {
            this.meshCollection[i].setVAO();
        }
    }

    addMesh(mesh: Mesh)
    {
        mesh.material = this.material;
        mesh.setVAO();
        this.meshCollection.push(mesh);
    }
    
    draw(transform: TransformComponent)
    {
        for(let i = 0; i < this.meshCollection.length; i++)
        {
            this.meshCollection[i].draw(transform);
        }
    }
}