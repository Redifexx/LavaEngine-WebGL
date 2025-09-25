export const screenTextureFragSdrSourceCode = `#version 300 es
precision mediump float;

out vec4 FragColor;

in vec2 TexCoords;

uniform sampler2D screenTexture;
uniform sampler2D depthTexture;
uniform sampler2D skyMask;
uniform sampler2D bloomTexture;
uniform sampler2D avgLumTexture;
uniform vec2 screenSize;

uniform float far;
uniform float near;

uniform float deltaTime;
uniform float lastExposure;

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

float LinearizeDepth(float depth)
{
    float z = depth * 2.0 - 1.0; // back to NDC 
    return (2.0 * near * far) / (far + near - z * (far - near));	
}


void main()
{
    float isSky = texture(skyMask, TexCoords).r;

    float gamma = 2.2;
    vec3 result = texture(screenTexture, TexCoords).rgb;
    vec3 bloom = texture(bloomTexture, TexCoords).rgb;
    vec3 bloomedOut = mix(result, bloom, 0.05);
    //vec3 bloomedOut = result + bloom * 0.1;

    // chromastic abberation
    vec2 center = vec2(0.5);
    vec2 dir    = TexCoords - center;
    float dist  = length(dir);
    dir *= 1.0 + 0.1 * dist * dist;

    // tweak this constant for how strong the effect is
    float amount = 0.02 * dist;  
    amount *= smoothstep(0.2, 1.0, dist);

    vec3 col;
    col.r = texture(screenTexture, TexCoords + dir * amount).r;
    col.g = texture(screenTexture, TexCoords).g;
    col.b = texture(screenTexture, TexCoords - dir * amount).b;

    vec3 colDiff = col - result;

    float linearDepth = LinearizeDepth(texture(depthTexture, TexCoords).r);
    linearDepth = min(linearDepth, far - 1.0);

    //float lod = floor(log2(max(screenSize.x, screenSize.y)));
    //float avgLum = textureLod(avgLumTexture, vec2(0.5, 0.5), lod).r;

    //float target = 0.15 / max(avgLum, 1e-6);
    //float exposure = mix(lastExposure, target, 1.0 - exp(-deltaTime * 0.01));
    float exposure = lastExposure;


    
    vec3 mapped = ACESFilm(bloomedOut * 3.0 + (colDiff * 2.0));
    //vec3 mapped = vec3(1.0) - exp(-bloomedOut * 2.0);


    // saturation
    float saturation = 0.25;
    float avgColor = (mapped.r + mapped.g + mapped.b) / 3.0;
    
    float redOutput = mapped.r + ((mapped.r - avgColor) * saturation);
    float greenOutput = mapped.g + ((mapped.g - avgColor) * saturation);
    float blueOutput = mapped.b + ((mapped.b - avgColor) * saturation);
    
    vec3 saturated = vec3(redOutput, greenOutput, blueOutput);

    vec3 final = pow(saturated, vec3(1.0 / gamma));
    // Fog
    
    float fogStart = 20.0;     
    float fogEnd = far * 0.7;
    float fog = 0.0;
    
    float density = 1.0;   // tweak for effect 0.6
    if (linearDepth > fogStart) {
        float t = (linearDepth - fogStart) / (fogEnd - fogStart);
        t = clamp(t, 0.0, 1.0);
        fog = 1.0 - exp(-t * density);
    }

    fog *= (1.0 - isSky);

    float fade = smoothstep(far * 0.9, far, linearDepth);
    fog = mix(fog, 1.0, fade * (1.0 - isSky));

    // fog color here
    FragColor = vec4(mix(final, vec3(0.741, 0.749, 0.757), fog), 1.0);
    //FragColor = vec4(bloom, 1.0);
    //vec3 tex = texture(screenTexture, TexCoords).rgb;
    //FragColor = vec4(tex, 1.0);
    //FragColor = vec4(d, d, d, 1.0);
}`;