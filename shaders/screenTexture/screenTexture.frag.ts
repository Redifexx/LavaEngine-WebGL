export const screenTextureFragSdrSourceCode = `#version 300 es
precision mediump float;

out vec4 FragColor;

in vec2 TexCoords;

uniform sampler2D screenTexture;
uniform vec2 screenSize;

void main()
{
    vec2 uInverseResolution = vec2(1.0/screenSize[0], 1.0/screenSize[1]);
    vec3 rgbNW = texture(screenTexture, TexCoords + vec2(-1.0, -1.0) * uInverseResolution).rgb;
    vec3 rgbNE = texture(screenTexture, TexCoords + vec2( 1.0, -1.0) * uInverseResolution).rgb;
    vec3 rgbSW = texture(screenTexture, TexCoords + vec2(-1.0,  1.0) * uInverseResolution).rgb;
    vec3 rgbSE = texture(screenTexture, TexCoords + vec2( 1.0,  1.0) * uInverseResolution).rgb;
    vec3 rgbM  = texture(screenTexture, TexCoords).rgb;

    // Luma (perceived brightness)
    float lumaNW = dot(rgbNW, vec3(0.299, 0.587, 0.114));
    float lumaNE = dot(rgbNE, vec3(0.299, 0.587, 0.114));
    float lumaSW = dot(rgbSW, vec3(0.299, 0.587, 0.114));
    float lumaSE = dot(rgbSE, vec3(0.299, 0.587, 0.114));
    float lumaM  = dot(rgbM , vec3(0.299, 0.587, 0.114));

    float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
    float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));

    vec2 dir;
    dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));
    dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));

    float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) * 0.25 * 0.5, 0.01);
    float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);

    dir = clamp(dir * rcpDirMin, vec2(-8.0), vec2(8.0)) * uInverseResolution;

    vec3 rgbA = 0.5 * (
        texture(screenTexture, TexCoords + dir * (1.0/3.0 - 0.5)).rgb +
        texture(screenTexture, TexCoords + dir * (2.0/3.0 - 0.5)).rgb);
    vec3 rgbB = rgbA * 0.5 + 0.25 * (
        texture(screenTexture, TexCoords + dir * -0.5).rgb +
        texture(screenTexture, TexCoords + dir * 0.5).rgb);

    float lumaB = dot(rgbB, vec3(0.299, 0.587, 0.114));
    //FragColor = (lumaB < lumaMin || lumaB > lumaMax) ? vec4(rgbA, 1.0) : vec4(rgbB, 1.0);
    //FragColor = texture(screenTexture, TexCoords);
    FragColor = texture(screenTexture, TexCoords);
}`;