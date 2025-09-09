export const skyboxFragSdrSourceCode = `#version 300 es
precision mediump float;

out vec4 fragmentColor;

in vec3 fragmentTexCoord;

uniform samplerCube skybox;

void main()
{
    fragmentColor = texture(skybox, fragmentTexCoord);
}`;