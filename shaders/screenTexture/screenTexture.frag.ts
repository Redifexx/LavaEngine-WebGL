export const screenTextureFragSdrSourceCode = `#version 300 es
precision mediump float;

out vec4 FragColor;

in vec2 TexCoords;

uniform sampler2D screenTexture;
uniform vec2 screenSize;

vec3 ACESFilm(vec3 x)
{
    // ACES approximation by Narkowicz
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;

    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

void main()
{
    float gamma = 2.2;
    vec3 result = texture(screenTexture, TexCoords).rgb;

    vec3 mapped = ACESFilm(result * 1.0);
    mapped = pow(mapped, vec3(1.0 / gamma));

    FragColor = vec4(mapped, 1.0);

    //float d = texture(screenTexture, TexCoords).r;
    //FragColor = vec4(vec3(d), 1.0);
}`;