import { ShaderData } from "./shader-data";
import { showError } from "../gl-utils";

export class MaterialData
{
    gl: WebGL2RenderingContext;
    shaderData: ShaderData;

    /* 
    Texture Array Format
    Diffuse        0
    Specular       1
    Normal(OGL)    2
    Emissive       3 
    */

    textures: (WebGLTexture | null) [] = new Array(4);
    texUniformLocations: (WebGLUniformLocation | null)[] = new Array(4);
    modelMatrixUniformLocation: WebGLUniformLocation | null;

    posAttrib: number;
    texAttrib: number;
    normAttrib: number;

    constructor
    (
        gl: WebGL2RenderingContext,
        shaderData: ShaderData
    ) {
        this.gl = gl;
        this.shaderData = shaderData;

        if (!shaderData.shaderProgram)
        {
            showError('Failed to get shader program.');
            return;
        }
        
        this.texUniformLocations[0] = (shaderData.gl.getUniformLocation(shaderData.shaderProgram, 'tex0'));
        this.texUniformLocations[1] = (shaderData.gl.getUniformLocation(shaderData.shaderProgram, 'tex1'));
        this.texUniformLocations[2] = (shaderData.gl.getUniformLocation(shaderData.shaderProgram, 'tex2'));
        this.texUniformLocations[3] = (shaderData.gl.getUniformLocation(shaderData.shaderProgram, 'tex3'));
        this.modelMatrixUniformLocation = shaderData.gl.getUniformLocation(shaderData.shaderProgram, 'modelMatrix');
        this.posAttrib = this.gl.getAttribLocation(shaderData.shaderProgram, 'vertexPosition');
        this.texAttrib = this.gl.getAttribLocation(shaderData.shaderProgram, 'vertexTexCoord');
        this.normAttrib = this.gl.getAttribLocation(shaderData.shaderProgram, 'vertexNormal');
    }

    bindTextures()
    {
        // Tex 0
        if (this.texUniformLocations[0] && this.textures[0])
        {
            this.shaderData.gl.activeTexture(this.shaderData.gl.TEXTURE0);
            this.shaderData.gl.bindTexture(this.shaderData.gl.TEXTURE_2D, this.textures[0]);
            this.shaderData.gl.uniform1i(this.texUniformLocations[0], 0);
        }

        // Tex 1
        if (this.texUniformLocations[1] && this.textures[1])
        {
            this.shaderData.gl.activeTexture(this.shaderData.gl.TEXTURE1);
            this.shaderData.gl.bindTexture(this.shaderData.gl.TEXTURE_2D, this.textures[1]);
            this.shaderData.gl.uniform1i(this.texUniformLocations[1], 0);
        }
        
        // Tex 2
        if (this.texUniformLocations[2] && this.textures[2])
        {
            this.shaderData.gl.activeTexture(this.shaderData.gl.TEXTURE2);
            this.shaderData.gl.bindTexture(this.shaderData.gl.TEXTURE_2D, this.textures[2]);
            this.shaderData.gl.uniform1i(this.texUniformLocations[2], 0);
        }

        // Tex 3
        if (this.texUniformLocations[3] && this.textures[3])
        {
            this.shaderData.gl.activeTexture(this.shaderData.gl.TEXTURE3);
            this.shaderData.gl.bindTexture(this.shaderData.gl.TEXTURE_2D, this.textures[3]);
            this.shaderData.gl.uniform1i(this.texUniformLocations[3], 0);
        }
    }
};