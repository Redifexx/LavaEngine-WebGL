export const vertexShaderSourceCode = `#version 300 es
precision mediump float;

in vec3 vertexPosition;
in vec2 vertexTexCoord;
in vec3 vertexNormal;

out vec3 fragmentPosition;
out vec2 fragmentTexCoord;
out vec3 fragmentNormal;

uniform mat4 modelMatrix;
uniform mat4 viewProjMatrix;

void main()
{
    gl_Position = viewProjMatrix * modelMatrix * vec4(vertexPosition, 1.0);
    
    fragmentPosition = vec3(modelMatrix * vec4(vertexPosition, 1.0));
    fragmentTexCoord = vertexTexCoord;
    fragmentNormal = mat3(transpose(inverse(modelMatrix))) * vertexNormal;
}`;