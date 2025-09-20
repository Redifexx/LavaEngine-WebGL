export const vertexShaderSourceCode = `#version 300 es
precision highp float;

in vec3 aPos;
in vec3 aNormal;
in vec2 aTexCoord;
in vec3 aTangent;
in vec3 aBitangent;

out vec3 FragPos;
out vec2 TexCoords;
out mat3 TBN;
out vec3 Normal;
out vec4 FragPosLightSpace;

uniform mat4 modelMatrix;
uniform mat4 viewProjMatrix;
uniform mat4 lightSpaceMatrix;

void main()
{
     // World position
    vec4 worldPos = modelMatrix * vec4(aPos, 1.0);
    FragPos = worldPos.xyz;

    // Correct normal transform
    mat3 normalMatrix = mat3(transpose(inverse(modelMatrix)));
    vec3 N = normalize(normalMatrix * aNormal);
    vec3 T = normalize(normalMatrix * aTangent);
    vec3 B = normalize(normalMatrix * aBitangent);
    T = normalize(T - dot(T, N) * N);
    B = cross(N, T);


    mat3 TBN_ = mat3(T, B, N);
    TBN = TBN_;
    Normal = N;

    TexCoords = aTexCoord;

    // Position in light’s clip space
    FragPosLightSpace = lightSpaceMatrix * worldPos;

    // Final clip-space position for the camera
    gl_Position = viewProjMatrix * worldPos;
}`;