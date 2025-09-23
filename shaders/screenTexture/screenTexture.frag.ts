export const screenTextureFragSdrSourceCode = `#version 300 es
precision mediump float;

out vec4 FragColor;

in vec2 TexCoords;

uniform sampler2D screenTexture;
uniform sampler2D depthTexture;
uniform sampler2D skyMask;
uniform sampler2D bloomTexture;
uniform vec2 screenSize;

uniform float far;
uniform float near;

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
    vec3 bloomedOut = mix(result, bloom, 0.03);

    float linearDepth = LinearizeDepth(texture(depthTexture, TexCoords).r);
    linearDepth = min(linearDepth, far - 1.0);

    vec3 mapped = ACESFilm(bloomedOut * 4.0);
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
    
    float density = 0.0;   // tweak for effect 0.6
    if (linearDepth > fogStart) {
        float t = (linearDepth - fogStart) / (fogEnd - fogStart);
        t = clamp(t, 0.0, 1.0);
        fog = 1.0 - exp(-t * density);
    }

    fog *= (1.0 - isSky);

    float fade = smoothstep(far * 0.9, far, linearDepth);
    fog = mix(fog, 1.0, fade * (1.0 - isSky));

    FragColor = vec4(mix(final, vec3(0.851, 0.855, 0.863), fog), 1.0);
    //FragColor = vec4(bloom, 1.0);
    //FragColor = vec4(texture(screenTexture, TexCoords).rgb, 1.0);
}`;