export const skyboxVertSdrSourceCode = `#version 300 es
precision mediump float;

in vec3 vertexPosition;

out vec3 fragmentTexCoord;

uniform mat4 projMatrix;
uniform mat4 viewMatrix;

void main()
{
    fragmentTexCoord = vertexPosition;
    mat4 viewNoTranslation = mat4(mat3(viewMatrix));
    vec4 pos = projMatrix * viewNoTranslation * vec4(vertexPosition, 1.0);
    gl_Position = pos.xyww;
}`;