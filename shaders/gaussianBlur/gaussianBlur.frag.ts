export const gaussianBlurFragSdrSourceCode = `#version 300 es
precision mediump float;

out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D bloomTexture;
uniform sampler2D viewDepthTexture;
uniform bool horizontal;
uniform float near;
uniform float far;

const int MAX_RADIUS = 10;

uniform float radiusNear;
uniform float radiusFar;
uniform vec2 texelSize;

void main()
{
    float radius = 4.0;

    vec3 result = vec3(0.0);
    float totalWeight = 0.0;

    vec2 tex_offset = texelSize;

    for (int i = -MAX_RADIUS; i <= MAX_RADIUS; ++i)
    {
        if (abs(float(i)) > radius) continue;

        float weight = exp(-float(i*i) / (2.0 * float(MAX_RADIUS * MAX_RADIUS)));
        vec2 offset = horizontal ? vec2(tex_offset.x * float(i), 0.0) : vec2(0.0, tex_offset.y * float(i));
        result += texture(bloomTexture, TexCoords + offset).rgb * weight;
        totalWeight += weight;
    }
    //FragColor = vec4(result / totalWeight, 1.0);
    FragColor = texture(bloomTexture, TexCoords);
}`;