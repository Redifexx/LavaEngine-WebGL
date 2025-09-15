export const fragmentShaderSourceCode = `#version 300 es
precision mediump float;

in vec3 FragPos;
in vec3 Normal;
in vec2 TexCoords;
in vec4 FragPosLightSpace;

out vec4 outputColor;

uniform vec3 viewPosition;
uniform sampler2D tex0;
uniform sampler2D tex1;
uniform sampler2D tex2;
uniform sampler2D tex3;
uniform sampler2D shadowMap;
uniform samplerCube skybox;

uniform float nearPlane;
uniform float farPlane;

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

float ShadowCalculation(vec4 fragPosLightSpace, out vec3 coords)
{
    // perspective divide
    vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
    projCoords = projCoords * 0.5 + 0.5;
    coords = projCoords;
    

    float closestDepth = texture(shadowMap, projCoords.xy).r;
    float currentDepth = projCoords.z;
    float bias = 0.0001;
    //float shadow = currentDepth - bias > closestDepth ? 1.0 : 0.0;
    float shadow = 0.0;
    if(projCoords.z > 1.0)
        shadow = 0.0;

    vec2 texelSize = 1.0 / vec2(textureSize(shadowMap, 0));
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
    float z = depth * 2.0 - 1.0; // Back to NDC 
    return (2.0 * nearPlane * farPlane) / (farPlane + nearPlane - z * (farPlane - nearPlane));
}


vec3 PointLightResult(PointLight light)
{
    vec3 ambient = vec3(1.0) * 0.1 * vec3(texture(tex0, TexCoords));

    // Diffuse
    vec3 norm = normalize(Normal);
    vec3 lightDir = normalize(light.position - FragPos);

    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = (diff * vec3(texture(tex0, TexCoords)) * light.color * material.diffuseTint);

    // Specular (Phong)
    vec3 viewDir = normalize(viewPosition - FragPos);
    vec3 halfwayDir = normalize(lightDir + viewDir);

    float spec = pow(max(dot(Normal, halfwayDir), 0.0), 8.0);
    vec3 specularLight = (light.color) * (spec * vec3(texture(tex1, TexCoords))) * material.specularFactor;

    vec3 I = -viewDir;
    vec3 R = reflect(I, norm);
    vec3 envSpecular = texture(skybox, R).rgb * material.specularFactor * vec3(texture(tex1, TexCoords));

    float cosTheta = max(dot(viewDir, norm), 0.0);
    float F0 = 0.04;
    float reflectivity = fresnelFactor(cosTheta, F0);
    vec3 specular = specularLight + envSpecular * reflectivity * (1.0 - material.roughnessFactor);

    vec3 emissive = vec3(texture(tex3, TexCoords)) * material.emissiveTint * material.emissiveFactor;

    // Light Falloff
    float distance = length(light.position - FragPos);
    float attenuation = 1.0 / (1.0 + 0.1 * distance + 0.01 * distance * distance); //possible optimazation

    vec3 result = ((attenuation * light.intensity * (diffuse + specular)));

    return result + emissive;
}

vec3 DirectionalLightResult(DirectionalLight light)
{
    vec3 ambient = vec3(1.0) * 0.1 * vec3(texture(tex0, TexCoords));

    // Diffuse
    vec3 norm = normalize(Normal);
    vec3 lightDir = normalize(-light.direction);

    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = (diff * vec3(texture(tex0, TexCoords)) * light.color * material.diffuseTint);

    // Specular (Phong)
    vec3 viewDir = normalize(viewPosition - FragPos);
    vec3 halfwayDir = normalize(lightDir + viewDir);

    float spec = pow(max(dot(Normal, halfwayDir), 0.0), 8.0);
    vec3 specularLight = (light.color) * (spec * vec3(texture(tex1, TexCoords))) * material.specularFactor;

    vec3 I = -viewDir;
    vec3 R = reflect(I, norm);
    vec3 envSpecular = texture(skybox, R).rgb * material.specularFactor * vec3(texture(tex1, TexCoords));

    float cosTheta = max(dot(viewDir, norm), 0.0);
    float F0 = 0.04;
    float reflectivity = fresnelFactor(cosTheta, F0);
    vec3 specular = specularLight + envSpecular * reflectivity * (1.0 - material.roughnessFactor);

    vec3 emissive = vec3(texture(tex3, TexCoords)) * material.emissiveTint * material.emissiveFactor;
    vec3 lightCoords;
    float shadow = ShadowCalculation(FragPosLightSpace, lightCoords); 

    vec3 result = ((light.intensity * (diffuse + specular)) * (1.0 - shadow));
    return result + emissive;
}


vec3 SpotLightResult(SpotLight light)
{
    vec3 ambient = vec3(1.0) * 0.1 * vec3(texture(tex0, TexCoords));
    //Theta and Light Dir
    vec3 norm = normalize(Normal);
    vec3 lightDir = normalize(light.position - FragPos);

    vec3 result = vec3(0.0);
    //Diffuse
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = (diff * vec3(texture(tex0, TexCoords))) * light.color * material.diffuseTint;

    // Specular (Phong)
    vec3 viewDir = normalize(viewPosition - FragPos);
    vec3 halfwayDir = normalize(lightDir + viewDir);

    float spec = pow(max(dot(Normal, halfwayDir), 0.0), 8.0);
    vec3 specularLight = (light.color) * (spec * vec3(texture(tex1, TexCoords))) * material.specularFactor;

    vec3 I = -viewDir;
    vec3 R = reflect(I, norm);
    vec3 envSpecular = texture(skybox, R).rgb * material.specularFactor * vec3(texture(tex1, TexCoords));

    float cosTheta = max(dot(viewDir, norm), 0.0);
    float F0 = 0.04;
    float reflectivity = fresnelFactor(cosTheta, F0);
    vec3 specular = specularLight + envSpecular * reflectivity * (1.0 - material.roughnessFactor);

    vec3 emissive = vec3(texture(tex3, TexCoords)) * material.emissiveTint * material.emissiveFactor;

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

    return result + emissive;
}


void main()
{
    vec3 result = vec3(0.0);
    vec3 ambient = vec3(1.0) * 0.1 * vec3(texture(tex0, TexCoords));
    result += ambient;
    for (int i = 0; i < MAX_POINT_LIGHTS; i++)
    {
        if (i >= numPointLights) break;
        result += PointLightResult(ptLights[i]);
    }

    for (int i = 0; i < MAX_DIRECTIONAL_LIGHTS; i++)
    {
        if (i >= numDirLights) break;
        result += DirectionalLightResult(dirLights[i]);
    }

    for (int i = 0; i < MAX_SPOT_LIGHTS; i++)
    {
        if (i >= numSpotLights) break;
        result += SpotLightResult(spotLights[i]);
    }
    
    float gamma = 2.2;
    outputColor = vec4(pow(result, vec3(1.0/gamma)), 1.0);
    //outputColor = vec4(vec3(result.z), 1.0);
    //outputColor = vec4(result, 1.0);
}`;