export const skyboxFragSdrSourceCode = `#version 300 es
precision mediump float;

layout(location = 0) out vec4 fragmentColor;
layout(location = 1) out float SkyMask;
layout(location = 2) out vec4 BrightColor;

in vec3 fragmentTexCoord;

uniform samplerCube skybox;


void main()
{
    fragmentColor = texture(skybox, fragmentTexCoord);
    SkyMask = 1.0;

    float brightness = dot(vec3(fragmentColor), vec3(0.2126, 0.7152, 0.0722));
    if (brightness > 0.0)
    {   
        BrightColor = fragmentColor;
    }
    else
    {
        BrightColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
}`;