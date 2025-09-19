import { mat4, quat, vec2, vec3 } from "gl-matrix";
import { Transform, TransformComponent } from "../components/transform-component";
import { createStaticIndexBuffer, createStaticVertexBuffer, showError } from "../gl-utils";
import { Material } from "./material";


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
        meshIndices: Uint16Array<ArrayBuffer> | null) 
    {
        this.gl = gl;

        this.vertices = meshVertices!;

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

        //console.log("SEETTING VAO" + this.material.posAttrib);
        // Interleaved format: (x, y, z, xn, yn, zn, u, v, tx, ty, tz, bx, by, bz) (all f32)
        if (this.material.posAttrib >= 0)
        {
            this.gl.enableVertexAttribArray(this.material.posAttrib);
            this.gl.vertexAttribPointer(
                this.material.posAttrib, 3, this.gl.FLOAT, false,
                14 * Float32Array.BYTES_PER_ELEMENT, 0
            );
        } 
        
        if (this.material.normAttrib >= 0)
        {
            this.gl.enableVertexAttribArray(this.material.normAttrib);
            this.gl.vertexAttribPointer(
                this.material.normAttrib, 3, this.gl.FLOAT, false,
                14 * Float32Array.BYTES_PER_ELEMENT,
                3 * Float32Array.BYTES_PER_ELEMENT
            );
        }

        if (this.material.texAttrib >= 0)
        {
            this.gl.enableVertexAttribArray(this.material.texAttrib);
            this.gl.vertexAttribPointer(
                this.material.texAttrib, 2, this.gl.FLOAT, false,
                14 * Float32Array.BYTES_PER_ELEMENT,
                6 * Float32Array.BYTES_PER_ELEMENT
            );
        }

        if (this.material.tanAttrib >= 0)
        {
            this.gl.enableVertexAttribArray(this.material.tanAttrib);
            this.gl.vertexAttribPointer(
                this.material.texAttrib, 3, this.gl.FLOAT, false,
                14 * Float32Array.BYTES_PER_ELEMENT,
                8 * Float32Array.BYTES_PER_ELEMENT
            );
        }

        if (this.material.bitAttrib >= 0)
        {
            this.gl.enableVertexAttribArray(this.material.bitAttrib);
            this.gl.vertexAttribPointer(
                this.material.texAttrib, 3, this.gl.FLOAT, false,
                14 * Float32Array.BYTES_PER_ELEMENT,
                11 * Float32Array.BYTES_PER_ELEMENT
            );
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

        mat4.fromRotationTranslationScale(
            modelMatrix,
            transform.rotation,
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
        const clonedIndices  = this.indices ? new Uint16Array(this.indices) : null;
        return new Mesh(
            this.gl,
            new Float32Array(this.vertices),
            clonedIndices
        );
    }

}