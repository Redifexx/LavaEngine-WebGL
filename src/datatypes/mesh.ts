import { mat4, quat, vec2, vec3 } from "gl-matrix";
import { Transform, TransformComponent } from "../components/transform-component";
import { createStaticIndexBuffer, createStaticVertexBuffer, showError } from "../gl-utils";
import { Material } from "./material";

export class Vertex
{
    position: vec3;
    normal: vec3;
    texCoords: vec2;
    tangent: vec3;
    bitTangent: vec3;
}

export class Mesh
{
    gl: WebGL2RenderingContext;

    vertices: Float32Array<ArrayBuffer>;
    indices: Uint16Array<ArrayBuffer> | null;

    vertexBuffer: WebGLBuffer | null;
    indexBuffer: WebGLBuffer | null;
    vertexArrayObject: WebGLVertexArrayObject;
    material: Material;

    constructor(gl: WebGL2RenderingContext,
        meshVertices: Float32Array<ArrayBuffer>,
        meshIndices: Uint16Array<ArrayBuffer> | null = null) 
    {
        this.gl = gl;
        this.vertices = meshVertices;
        this.vertexBuffer = createStaticVertexBuffer(gl, this.vertices);
        if (meshIndices)
        {
            this.indices = meshIndices;
            this.indexBuffer = createStaticIndexBuffer(gl, this.indices);
        }
    }

    setVAO()
    {
        this.vertexArrayObject = this.gl.createVertexArray();
        if (!this.vertexArrayObject)
        {
            showError('Failed to create VAO');
            return null;
        }

        this.gl.bindVertexArray(this.vertexArrayObject);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);


        // Interleaved format: (x, y, z, u, v, xn, yn, zn) (all f32)
        if (this.material.posAttrib >= 0)
        {
            this.gl.enableVertexAttribArray(this.material.posAttrib);
            this.gl.vertexAttribPointer(
                this.material.posAttrib, 3, this.gl.FLOAT, false,
                8 * Float32Array.BYTES_PER_ELEMENT, 0
            );
        }
        else
        {
            console.log("no pos attrib");
        }
        
        
        if (!this.material.isCubemap)
        {
            if (this.material.texAttrib >= 0)
            {
                this.gl.enableVertexAttribArray(this.material.texAttrib);
                this.gl.vertexAttribPointer(
                this.material.texAttrib, 2, this.gl.FLOAT, false,
                8 * Float32Array.BYTES_PER_ELEMENT,
                3 * Float32Array.BYTES_PER_ELEMENT
                );
            }

            if (this.material.normAttrib >= 0)
            {
                this.gl.enableVertexAttribArray(this.material.normAttrib);
                this.gl.vertexAttribPointer(
                    this.material.normAttrib, 3, this.gl.FLOAT, false,
                    8 * Float32Array.BYTES_PER_ELEMENT,
                    5 * Float32Array.BYTES_PER_ELEMENT
                );
            }
        }

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

        if (this.indices)
        {
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        }

        this.gl.bindVertexArray(null);

        if (this.indices)
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);

        
    }

    draw(transform: Transform, uniformLocation: WebGLUniformLocation, depthOnly: boolean)
    {
        const modelMatrix = mat4.create();

        const rotationQuat = quat.create();
        quat.fromEuler(rotationQuat, transform.rotation[0], transform.rotation[1], transform.rotation[2]);
        
        mat4.fromRotationTranslationScale(
            modelMatrix,
            rotationQuat,
            transform.position,
            transform.scale
        );

        this.gl.uniformMatrix4fv(uniformLocation, false, modelMatrix);

        if (!depthOnly)
        {
            this.material.bindTextures();
        }

        this.gl.bindVertexArray(this.vertexArrayObject);
        if (this.indices)
        {
            this.gl.drawElements(this.gl.TRIANGLES, this.indices.length, this.gl.UNSIGNED_SHORT, 0);
        }
        else
        {
            this.gl.drawArrays(this.gl.TRIANGLES, 0, this.vertices.length);
        }
        this.gl.bindVertexArray(null);
    }

    clone(): Mesh {
        // deep copy the data so it's not shared :)
        if (this.indices)
        {
            return new Mesh(this.gl,
            new Float32Array(this.vertices),
            new Uint16Array(this.indices)
            );
        }
        else
        {
            return new Mesh(this.gl,
            new Float32Array(this.vertices)
        );
        }
    }
}