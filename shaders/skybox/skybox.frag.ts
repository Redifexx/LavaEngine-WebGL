export const skyboxFragSdrSourceCode = `#version 300 es
precision mediump float;

layout(location = 0) out vec4 fragmentColor;
layout(location = 1) out float SkyMask;

in vec3 fragmentTexCoord;

uniform samplerCube skybox;


void main()
{
    fragmentColor = texture(skybox, fragmentTexCoord);
    SkyMask = 1.0;
}`;