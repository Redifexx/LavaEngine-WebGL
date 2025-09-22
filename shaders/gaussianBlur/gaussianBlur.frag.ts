export const gaussianBlurFragSdrSourceCode = `#version 300 es
precision mediump float;

out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D bloomTexture;
uniform bool horizontal;

void main()
{
    vec3 result = vec3(0.0);

    float weight[5];
    weight[0] = 0.227027;
    weight[1] = 0.1945946;
    weight[2] = 0.1216216;
    weight[3] = 0.054054;
    weight[4] = 0.016216;
    
    vec2 tex_offset = 1.0 / vec2(textureSize(bloomTexture, 0));
    result = texture(bloomTexture, TexCoords).rgb * weight[0]; // current fragment's contribution
    
    if (horizontal)
    {
        for(int i = 1; i < 5; ++i)
        {
            result += texture(bloomTexture, TexCoords + vec2(tex_offset.x * float(i), 0.0)).rgb * weight[i];
            result += texture(bloomTexture, TexCoords - vec2(tex_offset.x * float(i), 0.0)).rgb * weight[i];
        }
    }
    else
    {
        for(int i = 1; i < 5; ++i)
        {
            result += texture(bloomTexture, TexCoords + vec2(0.0, tex_offset.y * float(i))).rgb * weight[i];
            result += texture(bloomTexture, TexCoords - vec2(0.0, tex_offset.y * float(i))).rgb * weight[i];
        }
    }
    FragColor = vec4(result, 1.0);
    //FragColor = vec4(1.0, 0.0, 1.0, 1.0);
}`;