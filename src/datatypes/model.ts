import { Transform, TransformComponent } from "../components/transform-component";
import { LavaEngine } from "../engine/lava-engine";
import { Material } from "./material";
import { Mesh } from "./mesh";

export class Model
{
    meshCollection: Mesh[] = [];
    material: Material; 


    constructor(
        url: string | null,
        material: Material,
        mesh: Mesh | null
    )
    {
        this.setMaterial(material);

        if (!url)
        {
            let newMesh = mesh!.clone();
            this.addMesh(newMesh);
        }
        else
        {
            this.loadModel(url);
        }
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
        console.log("LOADING MODEL");
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
            // how many vertices the mesh has
            const vertexCount = meshData.vertices.length / 3;

            // 14 floats per vertex
            const meshVertices = new Float32Array(vertexCount * 14);

            for (let i = 0; i < vertexCount; i++) {
                const vOffset = i * 14;   // where this vertex starts in the Float32Array

                // position (x,y,z)
                meshVertices[vOffset + 0] = meshData.vertices[i * 3 + 0];
                meshVertices[vOffset + 1] = meshData.vertices[i * 3 + 1];
                meshVertices[vOffset + 2] = meshData.vertices[i * 3 + 2];

                // normal (xn,yn,zn)
                meshVertices[vOffset + 3] = meshData.normals[i * 3 + 0];
                meshVertices[vOffset + 4] = meshData.normals[i * 3 + 1];
                meshVertices[vOffset + 5] = meshData.normals[i * 3 + 2];

                // texcoords (u,v)
                // Assimp-style arrays often store [u0,v0,u1,v1,...], so step by 2
                meshVertices[vOffset + 6] = meshData.texturecoords[0][i * 2 + 0];
                meshVertices[vOffset + 7] = meshData.texturecoords[0][i * 2 + 1];

                // tangent (tx,ty,tz)
                meshVertices[vOffset + 8]  = meshData.tangents[i * 3 + 0];
                meshVertices[vOffset + 9]  = meshData.tangents[i * 3 + 1];
                meshVertices[vOffset + 10] = meshData.tangents[i * 3 + 2];

                // bitangent (bx,by,bz)
                meshVertices[vOffset + 11] = meshData.bitangents[i * 3 + 0];
                meshVertices[vOffset + 12] = meshData.bitangents[i * 3 + 1];
                meshVertices[vOffset + 13] = meshData.bitangents[i * 3 + 2];
            }

            // faces from many importers are often arrays of arrays—flatten if needed
            const indices = new Uint16Array(meshData.faces.flat());

            const mesh = new Mesh(LavaEngine.gl_context, meshVertices, indices);
            this.addMesh(mesh);

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