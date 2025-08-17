export const vertexShaderSourceCode = `#version 300 es
precision mediump float;

in vec3 vertexPosition;
in vec2 vertexTexCoord;
in vec3 vertexNormal;

out vec3 fragmentPosition;
out vec2 fragmentTexCoord;
out vec3 fragmentNormal;

uniform mat4 matWorld;
uniform mat4 matViewProj;

void main()
{
    gl_Position = matViewProj * matWorld * vec4(vertexPosition, 1.0);
    
    fragmentPosition = vec3(matWorld * vec4(vertexPosition, 1.0));
    fragmentTexCoord = vertexTexCoord;
    fragmentNormal = mat3(transpose(inverse(matWorld))) * vertexNormal;
}`;