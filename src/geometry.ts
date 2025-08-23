// Vertex buffer format: XYZ RGB (interleaved)

import { mat4, quat, vec3 } from "gl-matrix";
import { showError } from "./gl-utils";

export const COLOR_WHITE = vec3.fromValues(1.0, 1.0, 1.0);
export const COLOR_GREY = vec3.fromValues(0.5, 0.5, 0.5);
export const COLOR_BLACK = vec3.fromValues(0.0, 0.0, 0.0);
export const COLOR_RED = vec3.fromValues(1.0, 0.5, 0.5);
export const COLOR_GREEN = vec3.fromValues(0.5, 1.0, 0.5);
export const COLOR_BLUE = vec3.fromValues(0.5, 0.5, 1.0);

//
// Cube geometry
export const CUBE_VERTICES = new Float32Array([
    // Front face: pos, texCoords, Normals
    -1.0, -1.0, 1.0,    0.0, 0.0,   0.0, 0.0, 1.0,
    1.0, -1.0, 1.0,     1.0, 0.0,   0.0, 0.0, 1.0,
    1.0, 1.0, 1.0,      1.0, 1.0,   0.0, 0.0, 1.0,
    -1.0, 1.0, 1.0,     0.0, 1.0,   0.0, 0.0, 1.0,

    // Back face
    -1.0, -1.0, -1.0,   0.0, 0.0,   0.0, 0.0, -1.0,
    -1.0, 1.0, -1.0,    1.0, 0.0,   0.0, 0.0, -1.0,
    1.0, 1.0, -1.0,     1.0, 1.0,   0.0, 0.0, -1.0,
    1.0, -1.0, -1.0,    0.0, 1.0,   0.0, 0.0, -1.0,

    // Top face
    -1.0, 1.0, -1.0,    0.0, 0.0,   0.0, 1.0, 0.0,
    -1.0, 1.0, 1.0,     1.0, 0.0,   0.0, 1.0, 0.0,
    1.0, 1.0, 1.0,      1.0, 1.0,   0.0, 1.0, 0.0,
    1.0, 1.0, -1.0,     0.0, 1.0,   0.0, 1.0, 0.0,

    // Bottom face
    -1.0, -1.0, -1.0,   0.0, 0.0,   0.0, -1.0, 0.0,
    1.0, -1.0, -1.0,    1.0, 0.0,   0.0, -1.0, 0.0,
    1.0, -1.0, 1.0,     1.0, 1.0,   0.0, -1.0, 0.0,
    -1.0, -1.0, 1.0,    0.0, 1.0,   0.0, -1.0, 0.0,

    // Right face
    1.0, -1.0, -1.0,    0.0, 0.0,   1.0, 0.0, 0.0,
    1.0, 1.0, -1.0,     1.0, 0.0,   1.0, 0.0, 0.0,
    1.0, 1.0, 1.0,      1.0, 1.0,   1.0, 0.0, 0.0,
    1.0, -1.0, 1.0,     0.0, 1.0,   1.0, 0.0, 0.0,

    // Left face
    -1.0, -1.0, -1.0,   0.0, 0.0,   -1.0, 0.0, 0.0,
    -1.0, -1.0, 1.0,    1.0, 0.0,   -1.0, 0.0, 0.0,
    -1.0, 1.0, 1.0,     1.0, 1.0,   -1.0, 0.0, 0.0,
    -1.0, 1.0, -1.0,    0.0, 1.0,   -1.0, 0.0, 0.0,
]);

export const CUBE_INDICES = new Uint16Array([
    0,  1,  2,
    0,  2,  3,    // front
    4,  5,  6,
    4,  6,  7,    // back
    8,  9,  10,
    8,  10, 11,   // top
    12, 13, 14,
    12, 14, 15,   // bottom
    16, 17, 18,
    16, 18, 19,   // right
    20, 21, 22,
    20, 22, 23,  // left
]);

// Plane Geometry
export const PLANE_VERTICES = new Float32Array([
    // Top face
    -1.0, 0.0, -1.0,    0.0, 0.0,   0.0, 1.0, 0.0,
    -1.0, 0.0, 1.0,     25.0, 0.0,   0.0, 1.0, 0.0,
    1.0, 0.0, 1.0,      25.0, 25.0,   0.0, 1.0, 0.0,
    1.0, 0.0, -1.0,     0.0, 25.0,   0.0, 1.0, 0.0,
]);

export const PLANE_INDICES = new Uint16Array([
    0,  1,  2,
    0,  2,  3,   // top
]);


export function create3dInterleavedVao(
    gl: WebGL2RenderingContext,
    vertexBuffer: WebGLBuffer, indexBuffer: WebGLBuffer,
    posAttrib: number, texAttrib: number, normAttrib: number
) {
    const vao = gl.createVertexArray();
    if (!vao)
    {
        showError('Failed to create VAO');
        return null;
    }

    gl.bindVertexArray(vao);

    gl.enableVertexAttribArray(posAttrib);
    gl.enableVertexAttribArray(texAttrib);
    gl.enableVertexAttribArray(normAttrib);

    // Interleaved format: (x, y, z, u, v, xn, yn, zn) (all f32)
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(
        posAttrib, 3, gl.FLOAT, false,
        8 * Float32Array.BYTES_PER_ELEMENT, 0
    );
    gl.vertexAttribPointer(
        texAttrib, 2, gl.FLOAT, false,
        8 * Float32Array.BYTES_PER_ELEMENT,
        3 * Float32Array.BYTES_PER_ELEMENT
    );
    gl.vertexAttribPointer(
        normAttrib, 3, gl.FLOAT, false,
        8 * Float32Array.BYTES_PER_ELEMENT,
        5 * Float32Array.BYTES_PER_ELEMENT
    );
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bindVertexArray(null);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return vao;
}

export class Shape {
    private matWorld = mat4.create();
    private scaleVec = vec3.create();
    private rotation = quat.create();

    constructor(
        private pos: vec3,
        private scale: number,
        private rotationAxis: vec3,
        private rotationAngle: number,
        private color: vec3,
        private albedoMap: WebGLTexture | null,
        public readonly vao: WebGLVertexArrayObject,
        public readonly numIndices: number) {}

    draw(gl: WebGL2RenderingContext,
        matWorldUniform: WebGLUniformLocation,
        diffuseColorUniform: WebGLUniformLocation,
        albedoMapUniform: WebGLUniformLocation
    )
    {
        quat.setAxisAngle(this.rotation, this.rotationAxis, this.rotationAngle);
        vec3.set(this.scaleVec, this.scale, this.scale, this.scale);

        mat4.fromRotationTranslationScale(
            this.matWorld,
            this.rotation,
            this.pos,
            this.scaleVec
        );

        gl.uniformMatrix4fv(matWorldUniform, false, this.matWorld);
        gl.uniform3fv(diffuseColorUniform, this.color);
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.albedoMap);
        gl.uniform1i(albedoMapUniform, 0);

        gl.bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, this.numIndices, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }
}