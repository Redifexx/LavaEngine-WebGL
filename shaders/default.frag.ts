export const fragmentShaderSourceCode = `#version 300 es
precision mediump float;

in vec3 fragmentPosition;
in vec2 fragmentTexCoord;
in vec3 fragmentNormal;

out vec4 outputColor;

uniform vec3 viewPosition;
uniform sampler2D tex0;
uniform sampler2D tex1;
uniform sampler2D tex3;
uniform samplerCube skybox;

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



vec3 PointLightResult(PointLight light)
{

    // Diffuse
    vec3 norm = normalize(fragmentNormal);
    vec3 lightDir = normalize(light.position - fragmentPosition);

    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = (diff * vec3(texture(tex0, fragmentTexCoord)) * light.color * material.diffuseTint);

    // Specular (Phong)
    vec3 viewDir = normalize(viewPosition - fragmentPosition);
    vec3 halfwayDir = normalize(lightDir + viewDir);

    float spec = pow(max(dot(fragmentNormal, halfwayDir), 0.0), 8.0);
    vec3 specularLight = (light.color) * (spec * vec3(texture(tex1, fragmentTexCoord))) * material.specularFactor;

    vec3 I = -viewDir;
    vec3 R = reflect(I, norm);
    vec3 envSpecular = texture(skybox, R).rgb * material.specularFactor * vec3(texture(tex1, fragmentTexCoord));

    float cosTheta = max(dot(viewDir, norm), 0.0);
    float F0 = 0.04;
    float reflectivity = fresnelFactor(cosTheta, F0);
    vec3 specular = specularLight + envSpecular * reflectivity * (1.0 - material.roughnessFactor);

    vec3 emissive = vec3(texture(tex3, fragmentTexCoord)) * material.emissiveTint * material.emissiveFactor;

    // Light Falloff
    float distance = length(light.position - fragmentPosition);
    float attenuation = 1.0 / (1.0 + 0.1 * distance + 0.01 * distance * distance); //possible optimazation

    vec3 result = (attenuation * light.intensity * (diffuse + specular));

    return result + emissive;
}

vec3 DirectionalLightResult(DirectionalLight light)
{
    // Diffuse
    vec3 norm = normalize(fragmentNormal);
    vec3 lightDir = normalize(-light.direction);

    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = (diff * vec3(texture(tex0, fragmentTexCoord)) * light.color * material.diffuseTint);

    // Specular (Phong)
    vec3 viewDir = normalize(viewPosition - fragmentPosition);
    vec3 halfwayDir = normalize(lightDir + viewDir);

    float spec = pow(max(dot(fragmentNormal, halfwayDir), 0.0), 8.0);
    vec3 specularLight = (light.color) * (spec * vec3(texture(tex1, fragmentTexCoord))) * material.specularFactor;

    vec3 I = -viewDir;
    vec3 R = reflect(I, norm);
    vec3 envSpecular = texture(skybox, R).rgb * material.specularFactor * vec3(texture(tex1, fragmentTexCoord));

    float cosTheta = max(dot(viewDir, norm), 0.0);
    float F0 = 0.04;
    float reflectivity = fresnelFactor(cosTheta, F0);
    vec3 specular = specularLight + envSpecular * reflectivity * (1.0 - material.roughnessFactor);

    vec3 emissive = vec3(texture(tex3, fragmentTexCoord)) * material.emissiveTint * material.emissiveFactor;

    vec3 result = (light.intensity * (diffuse + specular));
    return result + emissive;
}


vec3 SpotLightResult(SpotLight light)
{

    //Theta and Light Dir
    vec3 norm = normalize(fragmentNormal);
    vec3 lightDir = normalize(light.position - fragmentPosition);

    vec3 result = vec3(0.0);
    //Diffuse
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = (diff * vec3(texture(tex0, fragmentTexCoord))) * light.color * material.diffuseTint;

    // Specular (Phong)
    vec3 viewDir = normalize(viewPosition - fragmentPosition);
    vec3 halfwayDir = normalize(lightDir + viewDir);

    float spec = pow(max(dot(fragmentNormal, halfwayDir), 0.0), 8.0);
    vec3 specularLight = (light.color) * (spec * vec3(texture(tex1, fragmentTexCoord))) * material.specularFactor;

    vec3 I = -viewDir;
    vec3 R = reflect(I, norm);
    vec3 envSpecular = texture(skybox, R).rgb * material.specularFactor * vec3(texture(tex1, fragmentTexCoord));

    float cosTheta = max(dot(viewDir, norm), 0.0);
    float F0 = 0.04;
    float reflectivity = fresnelFactor(cosTheta, F0);
    vec3 specular = specularLight + envSpecular * reflectivity * (1.0 - material.roughnessFactor);

    vec3 emissive = vec3(texture(tex3, fragmentTexCoord)) * material.emissiveTint * material.emissiveFactor;

    float theta = dot(lightDir, normalize(-light.direction));
    float epsilon = light.innerCutOff - light.outerCutOff;
    float intensity = clamp((theta - light.outerCutOff) / epsilon, 0.0, 1.0);

    // Light Falloff
    float distance = length(light.position - fragmentPosition);
    float attenuation = 1.0 / (1.0 + 0.09 * distance + 0.032 * (distance * distance));

    //Softness intensity
    diffuse *= intensity;
    specular *= intensity;

    result = (attenuation * light.intensity * (diffuse + specular));

    return result + emissive;
}


void main()
{
    vec3 ambient = vec3(1.0) * 0.1 * vec3(texture(tex0, fragmentTexCoord));
    vec3 result = vec3(0.0);

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
        
    result += ambient;
    float gamma = 2.2;
    outputColor = vec4(pow(result, vec3(1.0/gamma)), 1.0);
    //outputColor = vec4(result, 1.0);
}`;