import { createProgram } from "../gl-utils";

export class Shader
{
    gl: WebGL2RenderingContext;
    vertexShader: string;
    fragmentShader: string;
    shaderProgram: WebGLProgram;

    constructor(
        gl: WebGL2RenderingContext,
        vertexShader: string, 
        fragmentShader: string
    ){
        this.gl = gl;
        this.vertexShader = vertexShader;
        this.fragmentShader = fragmentShader;
        this.shaderProgram = createProgram(gl, this.vertexShader, this.fragmentShader);
    }

    destroy(): void
    {
        const gl = this.gl;
        if (this.shaderProgram)
        {
            gl.deleteProgram(this.shaderProgram);
            this.shaderProgram = null as any;
        }
    }
}