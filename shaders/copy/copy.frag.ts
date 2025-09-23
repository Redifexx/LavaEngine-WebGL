export const copyFragSdrSourceCode = `#version 300 es
precision mediump float;

out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D uSource;

void main() {
    
    vec4 result = texture(uSource, TexCoords);
    
    FragColor = result;
}`;