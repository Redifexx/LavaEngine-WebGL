export const gaussianBlurFragSdrSourceCode = `#version 300 es
precision mediump float;

out vec4 FragColor;
in vec2 TexCoords;
in float viewDepth;

uniform sampler2D bloomTexture;
uniform bool horizontal;
uniform float near;
uniform float far;


void main()
{
    int uRadius = 2;
    float uScale = 2.0;
    vec3 result = vec3(0.0);

    vec2 tex_offset = uScale / vec2(textureSize(bloomTexture, 0));
    float totalWeight = 0.0;

    for (int i = -uRadius; i <= uRadius; ++i) {
        float w = exp(-float(i*i) / (2.0 * float(uRadius*uRadius))); // gaussian weight
        vec2 offset = horizontal ? vec2(tex_offset.x * float(i), 0.0)
                                 : vec2(0.0, tex_offset.y * float(i));
        result += texture(bloomTexture, TexCoords + offset).rgb * w;
        totalWeight += w;
    }

    FragColor = vec4(result / totalWeight, 1.0);
}`;