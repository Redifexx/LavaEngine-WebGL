import { createProgram } from "../gl-utils";

export class ShaderData
{
    gl: WebGL2RenderingContext;
    vertexShader: string;
    fragmentShader: string;
    shaderProgram: WebGLProgram | null;

    constructor(
        gl: WebGL2RenderingContext,
        vertexShader: string, 
        fragmentShader: string
    ){
        this.vertexShader = vertexShader;
        this.fragmentShader = fragmentShader;
        this.shaderProgram = createProgram(gl, this.vertexShader, this.fragmentShader);
    }
}