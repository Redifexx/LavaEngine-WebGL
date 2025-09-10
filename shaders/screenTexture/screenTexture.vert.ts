export const screenTextureVertSdrSourceCode = `#version 300 es
precision mediump float;

in vec3 vertexPosition;
in vec2 vertexTexCoord;

out vec2 TexCoords;

void main()
{
    gl_Position = vec4(vertexPosition.x, vertexPosition.y, 0.0, 1.0);
    TexCoords = vertexTexCoord;
}`;