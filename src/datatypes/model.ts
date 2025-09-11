import { Transform, TransformComponent } from "../components/transform-component";
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
        let newMesh = mesh.clone();
        this.addMesh(newMesh);
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
    
    draw(transform: Transform, uniformLocation: WebGLUniformLocation = this.material.modelMatrixUniformLocation!, depthOnly: boolean = false)
    {
        for (const mesh of this.meshCollection)
        {
            mesh.draw(transform, uniformLocation, depthOnly);
        }
    }
}