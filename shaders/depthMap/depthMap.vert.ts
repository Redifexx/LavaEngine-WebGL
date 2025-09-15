export const depthMapVertSdrSourceCode = `#version 300 es
precision mediump float;

in vec3 aPos;

uniform mat4 lightSpaceMatrix;
uniform mat4 modelMatrix;

void main()
{
    gl_Position = lightSpaceMatrix * modelMatrix * vec4(aPos, 1.0);
}`;