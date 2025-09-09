import { Shader } from "./shader";
import { showError } from "../gl-utils";

export class Material
{
    gl: WebGL2RenderingContext;
    shader: Shader;

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
    viewProjMatrixUniformLocation: WebGLUniformLocation;
    viewPosMatrixUniformLocation: WebGLUniformLocation;

    posAttrib: number;
    texAttrib: number;
    normAttrib: number;

    constructor
    (
        shader: Shader
    ) {
        this.gl = shader.gl;
        this.shader = shader;
        console.log('SUCCESS');

        if (!shader.shaderProgram)
        {
            throw new Error("Shader program is null!");
        }
        
        this.texUniformLocations[0] = (shader.gl.getUniformLocation(shader.shaderProgram, "tex0"));
        this.texUniformLocations[1] = (shader.gl.getUniformLocation(shader.shaderProgram, 'tex1'));
        this.texUniformLocations[2] = (shader.gl.getUniformLocation(shader.shaderProgram, 'tex2'));
        this.texUniformLocations[3] = (shader.gl.getUniformLocation(shader.shaderProgram, 'tex3'));
        this.modelMatrixUniformLocation = shader.gl.getUniformLocation(shader.shaderProgram, 'modelMatrix');

        
        let location = shader.gl.getUniformLocation(shader.shaderProgram, 'viewProjMatrix')
        if (location === null)
        {
            throw new Error('Missing projection view matrix');
        }
        else
        {
            this.viewProjMatrixUniformLocation = location;
        }

        location = shader.gl.getUniformLocation(shader.shaderProgram, 'viewPosition')
        if (location === null)
        {
            throw new Error('Missing view position matrix');
        }
        else
        {
            this.viewPosMatrixUniformLocation = location;
        }

        this.posAttrib = this.gl.getAttribLocation(shader.shaderProgram, 'vertexPosition');
        this.texAttrib = this.gl.getAttribLocation(shader.shaderProgram, 'vertexTexCoord');
        this.normAttrib = this.gl.getAttribLocation(shader.shaderProgram, 'vertexNormal');
        
    }

    bindTextures()
    {
        // Tex 0
        if (this.texUniformLocations[0] && this.textures[0])
        {
            this.shader.gl.activeTexture(this.shader.gl.TEXTURE0);
            this.shader.gl.bindTexture(this.shader.gl.TEXTURE_2D, this.textures[0]);
            this.shader.gl.uniform1i(this.texUniformLocations[0], 0);
        }

        // Tex 1
        if (this.texUniformLocations[1] && this.textures[1])
        {
            this.shader.gl.activeTexture(this.shader.gl.TEXTURE1);
            this.shader.gl.bindTexture(this.shader.gl.TEXTURE_2D, this.textures[1]);
            this.shader.gl.uniform1i(this.texUniformLocations[1], 0);
        }
        
        // Tex 2
        if (this.texUniformLocations[2] && this.textures[2])
        {
            this.shader.gl.activeTexture(this.shader.gl.TEXTURE2);
            this.shader.gl.bindTexture(this.shader.gl.TEXTURE_2D, this.textures[2]);
            this.shader.gl.uniform1i(this.texUniformLocations[2], 0);
        }

        // Tex 3
        if (this.texUniformLocations[3] && this.textures[3])
        {
            this.shader.gl.activeTexture(this.shader.gl.TEXTURE3);
            this.shader.gl.bindTexture(this.shader.gl.TEXTURE_2D, this.textures[3]);
            this.shader.gl.uniform1i(this.texUniformLocations[3], 0);
        }
    }

    setTex(texIndex: number, texMap: WebGLTexture)
    {
        if (texIndex >= this.textures.length)
        {
            showError('Texture index doesnt exist');
            return;
        }

        this.textures[texIndex] = texMap;
    }
};