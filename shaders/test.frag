#version 300 es
precision mediump float;

in vec3 fragmentPosition;
in vec2 fragmentTexCoord;
in vec3 fragmentNormal;

out vec4 outputColor;

uniform vec3 viewPosition;
uniform vec3 diffuseColor;

uniform sampler2D tex0;

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

// Uniform arrays for light

uniform int numPointLights;
uniform PointLight ptLights[16]; // MAX

uniform int numDirLights;
uniform DirectionalLight dirLights[4]; // MAX

uniform int numSpotLights;
uniform SpotLight spotLights[4]; // MAX



vec3 PointLightResult(PointLight light)
{

    // Diffuse
    vec3 norm = normalize(fragmentNormal);
    vec3 lightDir = normalize(light.position - fragmentPosition);

    float diff = max(dot(norm, lightDir), 0.0f);
    vec3 diffuse = (diff * vec3(texture(tex0, fragmentTexCoord)) * diffuseColor * light.color);

    // Specular (Phong)
    vec3 viewDir = normalize(viewPosition - fragmentPosition);
    vec3 reflectDir = reflect(-lightDir, norm);

    float spec = pow(max(dot(viewDir, reflectDir), 0.0f), 8.0);
    vec3 specular = (light.color * vec3(0.2)) * (spec * diffuseColor);

    vec3 emissive = (light.color * vec3(0.0)) * diffuseColor;

    // Light Falloff
    float distance = length(light.position - fragmentPosition);
    float attenuation = 1.0 / (1.0 + 0.1 * distance + 0.01 * distance * distance); //possible optimazation

    vec3 result = (attenuation * light.intensity * (diffuse + specular + emissive));

    return result;
}

vec3 DirectionalLightResult(DirectionalLight light)
{
    // Diffuse
    vec3 norm = normalize(fragmentNormal);
    vec3 lightDir = normalize(-light.direction);

    float diff = max(dot(norm, lightDir), 0.0f);
    vec3 diffuse = (diff * diffuseColor * vec3(texture(tex0, fragmentTexCoord)) * light.color);

    // Specular (Phong)
    vec3 viewDir = normalize(viewPosition - fragmentPosition);
    vec3 reflectDir = reflect(-lightDir, norm);

    float spec = pow(max(dot(viewDir, reflectDir), 0.0f), 16.0);
    vec3 specular = (light.color * vec3(0.2)) * (spec * diffuseColor);

    vec3 emissive = (light.color * vec3(0.0)) * diffuseColor;

    vec3 result = (light.intensity * (diffuse + specular + emissive));

    return result;
}


vec3 SpotLightResult(SpotLight light)
{

    //Theta and Light Dir
    vec3 norm = normalize(fragmentNormal);
    vec3 lightDir = normalize(light.position - fragmentPosition);

    vec3 result = vec3(0.0f);
    //Diffuse
    float diff = max(dot(norm, lightDir), 0.0f);
    vec3 diffuse = (diff * vec3(texture(tex0, fragmentTexCoord))) * light.color;

    // Specular (Phong)
    vec3 viewDir = normalize(viewPosition - fragmentPosition);
    vec3 reflectDir = reflect(-lightDir, norm);

    float spec = pow(max(dot(viewDir, reflectDir), 0.0f), 16.0);
    vec3 specular = (light.color * vec3(0.2)) * (spec * diffuseColor);

    vec3 emissive = (light.color * vec3(0.0)) * diffuseColor;

    float theta = dot(lightDir, normalize(-light.direction));
    float epsilon = light.innerCutOff - light.outerCutOff;
    float intensity = clamp((theta - light.outerCutOff) / epsilon, 0.0, 1.0);

    // Light Falloff
    float distance = length(light.position - fragmentPosition);
    float attenuation = 1.0f / (1.0f + 0.09f * distance + 0.032f * (distance * distance));

    //Softness intensity
    diffuse *= intensity;
    specular *= intensity;

    result = (attenuation * light.intensity * (diffuse + specular + emissive));

    return result;
}


void main()
{
    vec3 ambient = vec3(1.0) * 0.25 * vec3(texture(tex0, fragmentTexCoord));
    vec3 result = vec3(0.0f);

    for (int i = 0; i < numPointLights; i++)
    {
        result += PointLightResult(ptLights[i]);
    }

    for (int i = 0; i < numDirLights; i++)
    {
        result += DirectionalLightResult(dirLights[i]);
    }

    for (int i = 0; i < numSpotLights; i++)
    {
        result += SpotLightResult(spotLights[i]);
    }
        
    result += ambient;

    outputColor = vec4(result, 1.0);
}