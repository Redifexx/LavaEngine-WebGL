export const vertexShaderSourceCode = `#version 300 es
precision mediump float;

in vec3 vertexPosition;
in vec2 vertexTexCoord;
in vec3 vertexNormal;

out vec3 FragPos;
out vec3 Normal;
out vec2 TexCoords;
out vec4 FragPosLightSpace;

uniform mat4 modelMatrix;
uniform mat4 viewProjMatrix;
uniform mat4 lightSpaceMatrix;

void main()
{
    FragPos = vec3(modelMatrix * vec4(vertexPosition, 1.0));
    Normal = (transpose(inverse(mat3(modelMatrix))) * vertexNormal);
    TexCoords = vertexTexCoord;
    FragPosLightSpace = lightSpaceMatrix * vec4(FragPos, 1.0);

    gl_Position = viewProjMatrix * vec4(FragPos, 1.0);
}`;