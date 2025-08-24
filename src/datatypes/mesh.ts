import { mat4, quat, vec3 } from "gl-matrix";
import { TransformComponent } from "../components/transform-component";
import { createStaticIndexBuffer, createStaticVertexBuffer, showError } from "../gl-utils";
import { Material } from "./material";

export class Mesh
{
    gl: WebGL2RenderingContext;
    vertices: Float32Array<ArrayBuffer>;
    indices: Uint16Array<ArrayBuffer>;
    vertexBuffer: WebGLBuffer | null;
    indexBuffer: WebGLBuffer | null;
    vertexArrayObject: WebGLVertexArrayObject;
    material: Material;

    constructor(gl: WebGL2RenderingContext,
        meshVertices: Float32Array<ArrayBuffer>,
        meshIndices: Uint16Array<ArrayBuffer>) 
    {
        this.gl = gl;
        this.vertices = meshVertices;
        this.indices = meshIndices;
        this.vertexBuffer = createStaticVertexBuffer(gl, this.vertices);
        this.indexBuffer = createStaticIndexBuffer(gl, this.indices);
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

        this.gl.enableVertexAttribArray(this.material.posAttrib);
        this.gl.enableVertexAttribArray(this.material.texAttrib);
        this.gl.enableVertexAttribArray(this.material.normAttrib);

        // Interleaved format: (x, y, z, u, v, xn, yn, zn) (all f32)
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.vertexAttribPointer(
            this.material.posAttrib, 3, this.gl.FLOAT, false,
            8 * Float32Array.BYTES_PER_ELEMENT, 0
        );
        this.gl.vertexAttribPointer(
            this.material.texAttrib, 2, this.gl.FLOAT, false,
            8 * Float32Array.BYTES_PER_ELEMENT,
            3 * Float32Array.BYTES_PER_ELEMENT
        );
        this.gl.vertexAttribPointer(
            this.material.normAttrib, 3, this.gl.FLOAT, false,
            8 * Float32Array.BYTES_PER_ELEMENT,
            5 * Float32Array.BYTES_PER_ELEMENT
        );
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.gl.bindVertexArray(null);

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
    }

    draw(transform: TransformComponent)
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

        this.gl.uniformMatrix4fv(this.material.modelMatrixUniformLocation, false, modelMatrix);

        this.material.bindTextures();

        this.gl.bindVertexArray(this.vertexArrayObject);
        this.gl.drawElements(this.gl.TRIANGLES, this.indices.length, this.gl.UNSIGNED_SHORT, 0);
        this.gl.bindVertexArray(null);
    }
}