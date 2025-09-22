export const copyVertSdrSourceCode = `#version 300 es
precision mediump float;

layout(location = 0) in vec2 vertexPosition;
layout(location = 1) in vec2 vertexTexCoord;

out vec2 TexCoords;

void main()
{
    TexCoords = vertexTexCoord;
    gl_Position = vec4(vertexPosition.x, vertexPosition.y, 0.0, 1.0);
}`;