import { mat4, vec3 } from "gl-matrix";
import { TransformComponent } from "../components/transform-component";
import { create3dInterleavedVao } from "../geometry";
import { createStaticIndexBuffer, createStaticVertexBuffer, showError } from "../gl-utils";
import { MaterialData } from "./material-data";

export class Mesh
{
    gl: WebGL2RenderingContext;
    vertices: Float32Array<ArrayBuffer>;
    indices: Uint16Array<ArrayBuffer>;
    vertexBuffer: WebGLBuffer | null;
    indexBuffer: WebGLBuffer | null;
    vertexArrayObject: WebGLVertexArrayObject;
    materialData: MaterialData;

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

        this.gl.enableVertexAttribArray(this.materialData.posAttrib);
        this.gl.enableVertexAttribArray(this.materialData.texAttrib);
        this.gl.enableVertexAttribArray(this.materialData.normAttrib);

        // Interleaved format: (x, y, z, u, v, xn, yn, zn) (all f32)
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.vertexAttribPointer(
            this.materialData.posAttrib, 3, this.gl.FLOAT, false,
            8 * Float32Array.BYTES_PER_ELEMENT, 0
        );
        this.gl.vertexAttribPointer(
            this.materialData.texAttrib, 2, this.gl.FLOAT, false,
            8 * Float32Array.BYTES_PER_ELEMENT,
            3 * Float32Array.BYTES_PER_ELEMENT
        );
        this.gl.vertexAttribPointer(
            this.materialData.normAttrib, 3, this.gl.FLOAT, false,
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
        this.gl.useProgram(this.materialData.shaderData.shaderProgram);

        const modelMatrix = mat4.create();
        mat4.fromRotationTranslationScale(
            modelMatrix,
            transform.rotation,
            transform.position,
            transform.scale
        );

        this.gl.uniformMatrix4fv(this.materialData.modelMatrixUniformLocation, false, modelMatrix);

        this.materialData.bindTextures();

        this.gl.bindVertexArray(this.vertexArrayObject);

    }
}