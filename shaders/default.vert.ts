export const vertexShaderSourceCode = `#version 300 es
precision highp float;

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
     // World position
    vec4 worldPos = modelMatrix * vec4(vertexPosition, 1.0);
    FragPos = worldPos.xyz;

    // Correct normal transform
    Normal = normalize(mat3(transpose(inverse(modelMatrix))) * vertexNormal);

    TexCoords = vertexTexCoord;

    // Position in light’s clip space
    FragPosLightSpace = lightSpaceMatrix * worldPos;

    // Final clip-space position for the camera
    gl_Position = viewProjMatrix * worldPos;
}`;