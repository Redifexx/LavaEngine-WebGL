export const downsampleFragSdrSourceCode = `#version 300 es
precision mediump float;

out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D uInput;
uniform vec2 uTexelSize;


void main()
{
    // Simple 4-tap box filter
    vec3 c  = texture(uInput, vTexCoord + uTexelSize * vec2(-0.5, -0.5)).rgb;
         c += texture(uInput, vTexCoord + uTexelSize * vec2( 0.5, -0.5)).rgb;
         c += texture(uInput, vTexCoord + uTexelSize * vec2(-0.5,  0.5)).rgb;
         c += texture(uInput, vTexCoord + uTexelSize * vec2( 0.5,  0.5)).rgb;

    FragColor = vec4(c * 0.25, 1.0);
}`;