export const screenTextureFragSdrSourceCode = `#version 300 es
precision mediump float;

out vec4 FragColor;

in vec2 TexCoords;

uniform sampler2D screenTexture;
uniform sampler2D depthTexture;
uniform sampler2D skyMask;
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
    vec3 mapped = ACESFilm(result * 1.0);
    mapped = pow(mapped, vec3(1.0 / gamma));

    float linearDepth = LinearizeDepth(texture(depthTexture, TexCoords).r);
    linearDepth = min(linearDepth, far - 1.0);

    // Fog
    
    float fogStart = 20.0;     
    float fogEnd = far * 0.7;
    float fog = 0.0;
    
    float density = 0.6;   // tweak for effect
    if (linearDepth > fogStart) {
        float t = (linearDepth - fogStart) / (fogEnd - fogStart);
        t = clamp(t, 0.0, 1.0);
        fog = 1.0 - exp(-t * density);
    }

    fog *= (1.0 - isSky);

    float fade = smoothstep(far * 0.9, far, linearDepth);
    fog = mix(fog, 1.0, fade * (1.0 - isSky));

    FragColor = vec4(mix(mapped, vec3(0.851, 0.855, 0.863), fog), 1.0);
}`;