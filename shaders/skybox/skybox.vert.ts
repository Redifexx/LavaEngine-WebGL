export const skyboxVertSdrSourceCode = `#version 300 es
precision mediump float;

in vec3 aPos;

out vec3 fragmentTexCoord;

uniform mat4 projMatrix;
uniform mat4 viewMatrix;

void main()
{
    fragmentTexCoord = aPos;
    mat4 viewNoTranslation = mat4(mat3(viewMatrix));
    vec4 pos = projMatrix * viewNoTranslation * vec4(aPos, 1.0);
    gl_Position = pos.xyww;
}`;