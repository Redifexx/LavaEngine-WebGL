export const downsampleFragSdrSourceCode = `#version 300 es
precision mediump float;

out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D uInput;
uniform vec2 uTexelSize;

void main()
{
    vec2 srcTexelSize = uTexelSize;
    float x = srcTexelSize.x;
    float y = srcTexelSize.y;

    
    // Take 13 samples around current texel:
    // a - b - c
    // - j - k -
    // d - e - f
    // - l - m -
    // g - h - i
    // === ('e' is the current texel) ===

    float xp2 = TexCoords.x + 2.0 * x;
    float xn2 = TexCoords.x - 2.0 * x;
    float yp2 = TexCoords.y + 2.0 * y;
    float yn2 = TexCoords.y - 2.0 * y;
    
    vec3 a = texture(uInput, vec2(xn2, yp2)).rgb;
    vec3 b = texture(uInput, vec2(TexCoords.x,       yp2)).rgb;
    vec3 c = texture(uInput, vec2(xp2, yp2)).rgb;
    
    vec3 d = texture(uInput, vec2(xn2, TexCoords.y)).rgb;
    vec3 e = texture(uInput, vec2(TexCoords.x,       TexCoords.y)).rgb;
    vec3 f = texture(uInput, vec2(xp2, TexCoords.y)).rgb;

    vec3 g = texture(uInput, vec2(xn2, yn2)).rgb;
    vec3 h = texture(uInput, vec2(TexCoords.x,       yn2)).rgb;
    vec3 i = texture(uInput, vec2(xp2, yn2)).rgb;

    vec3 j = texture(uInput, vec2(TexCoords.x - x, TexCoords.y + y)).rgb;
    vec3 k = texture(uInput, vec2(TexCoords.x + x, TexCoords.y + y)).rgb;
    vec3 l = texture(uInput, vec2(TexCoords.x - x, TexCoords.y - y)).rgb;
    vec3 m = texture(uInput, vec2(TexCoords.x + x, TexCoords.y - y)).rgb;

    // Apply weighted distribution:
    // 0.5 + 0.125 + 0.125 + 0.125 + 0.125 = 1
    // a,b,d,e * 0.125
    // b,c,e,f * 0.125
    // d,e,g,h * 0.125
    // e,f,h,i * 0.125
    // j,k,l,m * 0.5
    // This shows 5 square areas that are being sampled. But some of them overlap,
    // so to have an energy preserving downsample we need to make some adjustments.
    // The weights are the distributed, so that the sum of j,k,l,m (e.g.)
    // contribute 0.5 to the final color output. The code below is written
    // to effectively yield this sum. We get:
    // 0.125*5 + 0.03125*4 + 0.0625*4 = 1

    vec3 downsample3 = e*0.125;
    downsample3 += (a+c+g+i)*0.03125;
    downsample3 += (b+d+f+h)*0.0625;
    downsample3 += (j+k+l+m)*0.125;

    FragColor = vec4(downsample3, 1.0);
}`;