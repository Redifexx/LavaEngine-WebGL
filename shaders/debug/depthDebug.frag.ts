export const depthDebugFragSdrSourceCode = `#version 300 es
precision highp float;

in vec2 TexCoords;

out vec4 fragColor;
uniform sampler2D debugDepth;

void main() {
    float d = texture(debugDepth, TexCoords).r;
    fragColor = vec4(vec3(d), 1.0);
    //fragColor = vec4(vec3(0.0, 1.0, 1.0), 1.0);
}`;