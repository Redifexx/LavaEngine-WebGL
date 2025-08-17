export const fragmentShaderSourceCode = `#version 300 es
precision mediump float;

in vec3 fragmentPosition;
in vec3 fragmentNormal;

out vec4 outputColor;

uniform vec3 viewPosition;
uniform vec3 diffuseColor;

struct DirectionalLight
{
    vec3 direction;
    vec3 color;
    float intensity;
};

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

    float spec = pow(max(dot(viewDir, reflectDir), 0.0f), 8.0);
    vec3 specular = (light.color * vec3(0.5)) * (spec * diffuseColor);

    vec3 emissive = (light.color * vec3(0.0)) * diffuseColor;

    vec3 result = (light.intensity * (diffuse + specular + emissive));

    return result;
}

void main()
{
    vec3 ambient = vec3(1.0) * 0.25 * diffuseColor;
    vec3 result = vec3(0.0f);

    DirectionalLight sun;
    sun.direction = vec3(0.3f, -1.0f, 0.7f);
    sun.color = vec3(1.0f);
    sun.intensity = 1.0f;

    result += DirectionalLightResult(sun);
    result += ambient;

    outputColor = vec4(result, 1.0);
}`;