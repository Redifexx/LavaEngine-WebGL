export const fragmentShaderSourceCode = `#version 300 es
precision highp float;

in vec3 FragPos;
in vec2 TexCoords;
in mat3 TBN;
in vec3 Normal;
in vec4 FragPosLightSpace;

in float outViewDepth;

layout(location = 0) out vec4 outputColor;
layout(location = 1) out float SkyMask;
layout(location = 2) out vec4 BrightColor;
layout(location = 3) out float ViewDepth;

uniform vec3 viewPosition;
uniform sampler2D tex0;
uniform sampler2D tex1;
uniform sampler2D tex2;
uniform sampler2D tex3;
uniform sampler2D shadowMap;
uniform samplerCube skybox;

uniform float near;
uniform float far;

// LIGHT DEFINITION
struct DirectionalLight
{
    vec3 color;
    float intensity;
    vec3 direction;
};

struct PointLight
{
    vec3 color;
    float intensity;
    vec3 position;
};

struct SpotLight
{
    vec3 color;
    float intensity;
    vec3 position;
    vec3 direction;
    float innerCutOff;
    float outerCutOff;
};

struct Material
{
    //diffuse
    vec3 diffuseTint;

    //specular
    float specularFactor;
    
    //emission
    vec3 emissiveTint;
    float emissiveFactor;

    //environment
    float roughnessFactor;
};



// Uniform arrays for light

const int MAX_POINT_LIGHTS = 16;
const int MAX_DIRECTIONAL_LIGHTS = 16;
const int MAX_SPOT_LIGHTS = 16;

uniform int numPointLights;
uniform PointLight ptLights[MAX_POINT_LIGHTS]; // MAX

uniform int numDirLights;
uniform DirectionalLight dirLights[MAX_DIRECTIONAL_LIGHTS]; // MAX

uniform int numSpotLights;
uniform SpotLight spotLights[MAX_SPOT_LIGHTS]; // MAX

uniform Material material;

float fresnelFactor(float cosTheta, float F0)
{
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

float ShadowCalculation(vec4 fragPosLightSpace, out vec3 coords, vec3 norm, vec3 lightDir)
{
    // perspective divide
    vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
    projCoords = projCoords * 0.5 + 0.5;
    coords = projCoords;

    float closestDepth = texture(shadowMap, projCoords.xy).r;
    float currentDepth = projCoords.z;

    float bias = max(0.005 * (1.0 - dot(norm, lightDir)), 0.0005);
    float shadow = 0.0;

    if(projCoords.z > 1.0) return 0.0;

    vec2 texelSize = 1.0 / vec2(textureSize(shadowMap, 0)); // optimize

    for(int x = -1; x <= 1; ++x)
    {
        for(int y = -1; y <= 1; ++y)
        {   
            float pcfDepth = texture(shadowMap, projCoords.xy + vec2(x, y) * texelSize).r;
            shadow += currentDepth - bias > pcfDepth ? 1.0 : 0.0;
        }
    }
    
    shadow /= 9.0;

    return shadow;    
}

float LinearizeDepth(float depth)
{
    float z = depth * 2.0 - 1.0; // back to NDC 
    return (2.0 * near * far) / (far + near - z * (far - near));	
}


vec3 PointLightResult(PointLight light, vec3 norm, vec3 diffuseTex, vec3 specularTex, vec3 emissiveTex, vec3 viewDir, vec3 I, vec3 R, vec3 envSpecular, float cosTheta, float F0, float reflectivity)
{
    vec3 lightDir = normalize(light.position - FragPos);

    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = (diff * diffuseTex * light.color * material.diffuseTint);

    // Specular (Phong)
    vec3 halfwayDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(norm, halfwayDir), 0.0), 8.0);
    vec3 specularLight = light.color * spec * specularTex * material.specularFactor;

    vec3 specular = specularLight + envSpecular * reflectivity * (1.0 - material.roughnessFactor);

    // Light Falloff
    float distance = length(light.position - FragPos);
    float attenuation = 1.0 / (1.0 + 0.1 * distance + 0.01 * distance * distance); //possible optimazation

    vec3 result = ((attenuation * light.intensity * (diffuse + specular)));

    return result;
}

vec3 DirectionalLightResult(DirectionalLight light, vec3 norm, vec3 diffuseTex, vec3 specularTex, vec3 emissiveTex, vec3 viewDir, vec3 I, vec3 R, vec3 envSpecular, float cosTheta, float F0, float reflectivity)
{
    vec3 lightDir = normalize(-light.direction);

    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = diff * diffuseTex * light.color * material.diffuseTint;

    // Specular (Phong)
    vec3 halfwayDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(norm, halfwayDir), 0.0), 8.0);
    vec3 specularLight = light.color * spec * specularTex * material.specularFactor;

    vec3 specular = specularLight + envSpecular * reflectivity * (1.0 - material.roughnessFactor);

    vec3 lightCoords;
    float shadow = ShadowCalculation(FragPosLightSpace, lightCoords, norm, lightDir); 
    float dist = length(FragPos - viewPosition); 
    float fade = smoothstep(30.0*0.8, 30.0, dist); // fade near edges
    shadow *= (1.0 - fade);

    vec3 result = ((light.intensity * (diffuse + specular)) * (1.0 - shadow));
    return result;
}


vec3 SpotLightResult(SpotLight light, vec3 norm, vec3 diffuseTex, vec3 specularTex, vec3 emissiveTex, vec3 viewDir, vec3 I, vec3 R, vec3 envSpecular, float cosTheta, float F0, float reflectivity)
{
    vec3 lightDir = normalize(light.position - FragPos);
    vec3 result = vec3(0.0);

    //Diffuse
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = diff * diffuseTex * light.color * material.diffuseTint;

    // Specular (Phong)
    vec3 halfwayDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(norm, halfwayDir), 0.0), 8.0);
    vec3 specularLight = light.color * spec * specularTex * material.specularFactor;

    vec3 specular = specularLight + envSpecular * reflectivity * (1.0 - material.roughnessFactor);

    float theta = dot(lightDir, normalize(-light.direction));
    float epsilon = light.innerCutOff - light.outerCutOff;
    float intensity = clamp((theta - light.outerCutOff) / epsilon, 0.0, 1.0);

    // Light Falloff
    float distance = length(light.position - FragPos);
    float attenuation = 1.0 / (1.0 + 0.09 * distance + 0.032 * (distance * distance));

    //Softness intensity
    diffuse *= intensity;
    specular *= intensity;

    result = ((attenuation * light.intensity * (diffuse + specular)));

    return result;
}


void main()
{
    ViewDepth = outViewDepth;
    SkyMask = 0.0;
    vec2 dx = dFdx(TexCoords);
    vec2 dy = dFdy(TexCoords);

    // normal map
    vec3 normalMap = textureGrad(tex2, TexCoords, dx, dy).rgb;
    normalMap = normalMap * 2.0 - 1.0;
    vec3 norm = normalize(TBN * normalMap);

    // sample textures
    vec3 diffuseTex = textureGrad(tex0, TexCoords, dx, dy).rgb;
    vec3 specularTex = textureGrad(tex1, TexCoords, dx, dy).rgb;
    vec3 emissiveTex = textureGrad(tex3, TexCoords, dx, dy).rgb;

    vec3 viewDir = normalize(viewPosition - FragPos);
    vec3 I = -viewDir;
    vec3 R = reflect(I, norm);
    vec3 envSpecular = texture(skybox, R).rgb * material.specularFactor * specularTex;
    float cosTheta = max(dot(viewDir, norm), 0.0);
    float F0 = 0.04;
    float reflectivity = fresnelFactor(cosTheta, F0);

    vec3 result = vec3(0.0);
    vec3 ambient = vec3(1.0) * 0.04 * diffuseTex;
    // compute emission

    // inputs (linear space)
    //vec3 emissiveColor = texture(emissiveTex, TexCoords).rgb; // base color (0..inf)
    float emissiveFactor = material.emissiveFactor;   // scalar intensity

    // radiance
    vec3 radiance = emissiveTex * emissiveFactor * material.emissiveTint;

    // compute a perceptual luminance (linear)
    float lum = dot(radiance, vec3(0.2126, 0.7152, 0.0722));

    // choose thresholds (tweak these)
    float whiteStart = 1.0;  // when luminance starts adding white
    float whiteFull  = 8.0; // full white contribution by this luminance

    // amount [0..1] of white to add
    float t = clamp((lum - whiteStart) / (whiteFull - whiteStart), 0.0, 1.0);

    // optional curve to shape the transition (smoothstep or pow)
    t = smoothstep(0.0, 1.0, t);

    // how much white energy to add (scale to taste)
    float whiteScale = mix(0.0, lum * 0.8, t); // eg. add up to 0.8 * lum as white

    vec3 finalEmissive = radiance + vec3(whiteScale);

    vec3 emissive = emissiveTex * material.emissiveTint * material.emissiveFactor;
    result += ambient;
    result += finalEmissive;

    for (int i = 0; i < MAX_POINT_LIGHTS; i++)
    {
        if (i >= numPointLights) break;
        result += PointLightResult(ptLights[i], norm, diffuseTex, specularTex, emissiveTex, viewDir, I, R, envSpecular, cosTheta, F0, reflectivity);
    }

    for (int i = 0; i < MAX_DIRECTIONAL_LIGHTS; i++)
    {
        if (i >= numDirLights) break;
        result += DirectionalLightResult(dirLights[i], norm, diffuseTex, specularTex, emissiveTex, viewDir, I, R, envSpecular, cosTheta, F0, reflectivity);
    }

    for (int i = 0; i < MAX_SPOT_LIGHTS; i++)
    {
        if (i >= numSpotLights) break;
        result += SpotLightResult(spotLights[i], norm, diffuseTex, specularTex, emissiveTex, viewDir, I, R, envSpecular, cosTheta, F0, reflectivity);
    }
    
    //float gamma = 2.2;
    //outputColor = vec4(pow(result, vec3(1.0/gamma)), 1.0);
    //outputColor = vec4(vec3(result.z), 1.0);
    outputColor = vec4(result, 1.0);

    //float brightness = dot(outputColor.rgb, vec3(0.2126, 0.7152, 0.0722));

    // remove at some point, no threshold makes this a wasted textures
    float brightness = max(max(outputColor.r, outputColor.g), outputColor.b);
    if (brightness > 0.0)
    {   
        BrightColor = vec4(outputColor.rgb, 1.0);
    }
    else
    {
        BrightColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
}`;