export const fragmentShaderSourceCode = `#version 300 es
precision mediump float;

in vec3 fragmentPosition;
in vec3 fragmentNormal;

out vec4 outputColor;

uniform vec3 viewPosition;
uniform vec3 diffuseColor;

struct PointLight
{
    vec3 position;
    float intensity;
    vec3 color;
};

PointLight ptLights[4];

struct DirectionalLight
{
    vec3 direction;
    vec3 color;
    float intensity;
};

vec3 PointLightResult(PointLight light)
{

    // Diffuse
    vec3 norm = normalize(fragmentNormal);
    vec3 lightDir = normalize(light.position - fragmentPosition);

    float diff = max(dot(norm, lightDir), 0.0f);
    vec3 diffuse = (diff * diffuseColor * light.color);

    // Specular (Phong)
    vec3 viewDir = normalize(viewPosition - fragmentPosition);
    vec3 reflectDir = reflect(-lightDir, norm);

    float spec = pow(max(dot(viewDir, reflectDir), 0.0f), 8.0);
    vec3 specular = (light.color * vec3(0.5)) * (spec * diffuseColor);

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
    vec3 diffuse = (diff * diffuseColor * light.color);

    // Specular (Phong)
    vec3 viewDir = normalize(viewPosition - fragmentPosition);
    vec3 reflectDir = reflect(-lightDir, norm);

    float spec = pow(max(dot(viewDir, reflectDir), 0.0f), 16.0);
    vec3 specular = (light.color * vec3(0.5)) * (spec * diffuseColor);

    vec3 emissive = (light.color * vec3(0.0)) * diffuseColor;

    vec3 result = (light.intensity * (diffuse + specular + emissive));

    return result;
}

void main()
{
    vec3 ambient = vec3(1.0) * 0.25 * diffuseColor;
    vec3 result = vec3(0.0f);

    PointLight ptLight0;
    ptLight0.position = vec3(1.0f, 3.0f, 1.0f);
    ptLight0.color = vec3(1.0f, 0.0f, 1.0f);
    ptLight0.intensity = 1.0f;
    ptLights[0] = ptLight0;

    PointLight ptLight1;
    ptLight1.position = vec3(-5.0f, 2.0f, -3.0f);
    ptLight1.color = vec3(1.0f, 0.0f, 0.0f);
    ptLight1.intensity = 1.0f;
    ptLights[1] = ptLight1;

    PointLight ptLight2;
    ptLight2.position = vec3(3.0f, 5.0f, -4.0f);
    ptLight2.color = vec3(0.0f, 0.0f, 1.0f);
    ptLight2.intensity = 3.0f;
    ptLights[2] = ptLight2;

    PointLight ptLight3;
    ptLight3.position = vec3(-7.0f, 6.0f, 5.0f);
    ptLight3.color = vec3(0.0f, 1.0f, 0.0f);
    ptLight3.intensity = 2.0f;
    ptLights[3] = ptLight3;

    DirectionalLight sun;
    sun.direction = vec3(0.3f, -1.0f, 0.7f);
    sun.color = vec3(1.0f);
    sun.intensity = 1.0f;

    for (int i = 0; i < ptLights.length(); i++)
    {
        result += PointLightResult(ptLights[i]);
    }

    result += DirectionalLightResult(sun);
    result += ambient;

    outputColor = vec4(result, 1.0);
}`;