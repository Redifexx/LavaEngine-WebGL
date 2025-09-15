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
            this.meshCollection[i].material = this.material;
            this.meshCollection[i].setVAO();
        }
    }

    addMesh(mesh: Mesh)
    {
        mesh.material = this.material;
        mesh.setVAO();
        this.meshCollection.push(mesh);
    }

    // parse from json
    async loadModel(url: string)
    {
        let rootURL = '../../' + url;

        // Fetch the file
        const response = await fetch(rootURL);
        if (!response.ok) {
            throw new Error(`Failed to load model: ${response.status} ${response.statusText}`);
        }

         // Parse the JSON into a JavaScript object
        const modelData = await response.json(); // automatically parses JSON

        
        for (const meshData of modelData.meshes)
        {
            let mesh = new Mesh(meshData.vertices, meshData.faces);
        }

    }
    
    draw(transform: Transform, depthOnly: boolean = false, uniformLocation: WebGLUniformLocation = this.material.modelMatrixUniformLocation!)
    {
        for (const mesh of this.meshCollection)
        {
            mesh.draw(transform, uniformLocation, depthOnly);
        }
    }
}