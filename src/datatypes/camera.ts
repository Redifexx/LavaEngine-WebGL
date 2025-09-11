import { glMatrix, mat3, mat4, quat, vec3 } from 'gl-matrix';
import { CameraType } from '../components/camera-component';
import { Input } from '../engine/input';
import { Transform } from '../components/transform-component';

export class Camera
{
    // Camera attributes
    Forward: vec3;
    Up: vec3;
    Right: vec3;
    WorldUp: vec3;

    // Euler Angles
    Yaw: number;
    Pitch: number;

    // Constructor with vectors
    constructor()
    {
        this.Forward = vec3.fromValues(0.0, 0.0, -1.0);
        this.Right = vec3.fromValues(1.0, 0.0, 0.0);
        this.Up = vec3.fromValues(0.0, 1.0, 0.0);
        this.WorldUp = this.Up;
    }

    draw(
        camType: CameraType,
        fieldOfView: number,
        canvasWidth: number,
        canvasHeight: number,
        nearPlane: number,
        farPlane: number,
        matViewProjUniform: WebGLUniformLocation,
        matViewPosUniform: WebGLUniformLocation,
        transform: Transform,
        gl: WebGL2RenderingContext
    )
    {
        const matView = mat4.create();
        const matProj = mat4.create();
        const matViewProj = mat4.create();

        mat4.copy(matView, this.getViewMatrix(transform));


        if (camType === CameraType.PERSPECTIVE)
        {
            mat4.perspective(
            matProj,
            glMatrix.toRadian(fieldOfView),
            canvasWidth / canvasHeight,
            nearPlane, farPlane);
        }
        else
        {
            mat4.ortho(
                matProj,
                -1,
                1,
                -1,
                1,
                nearPlane,
                farPlane
            );
        }

        mat4.multiply(matViewProj, matProj, matView)

        gl.uniformMatrix4fv(matViewProjUniform, false, matViewProj);

        gl.uniform3fv(matViewPosUniform, transform.position);
    }

    drawSky(
        camType: CameraType,
        fieldOfView: number,
        canvasWidth: number,
        canvasHeight: number,
        nearPlane: number,
        farPlane: number,
        viewMatrixUniform: WebGLUniformLocation,
        projMatrixUniform: WebGLUniformLocation,
        transform: Transform,
        gl: WebGL2RenderingContext
    )
    {
        const matView = mat4.create();
        const matProj = mat4.create();

        mat4.copy(matView, this.getViewMatrix(transform));
        matView[12] = 0;
        matView[13] = 0;
        matView[14] = 0;

        if (camType === CameraType.PERSPECTIVE)
        {
            mat4.perspective(
            matProj,
            glMatrix.toRadian(fieldOfView),
            canvasWidth / canvasHeight,
            nearPlane, farPlane);
        }
        else
        {
            mat4.ortho(
                matProj,
                -1,
                1,
                -1,
                1,
                nearPlane,
                farPlane
            );
        }

        gl.uniformMatrix4fv(viewMatrixUniform, false, matView);
        gl.uniformMatrix4fv(projMatrixUniform, false, matProj);
    }

    getViewMatrix(transform: Transform)
    {
        const viewMat = mat4.create();
        const posForward = vec3.create();
        const up = transform.GetUp();
        vec3.add(posForward, transform.position, transform.GetForward());
        mat4.lookAt(viewMat, transform.position, posForward, up);
        return viewMat;
    }

    // helper
    updateCameraVectors()
    {
        let Forward = vec3.fromValues(0.0, 0.0, 0.0);
        Forward[0] = Math.cos(glMatrix.toRadian(this.Yaw)) * Math.cos(glMatrix.toRadian(this.Pitch));
        Forward[1] = Math.sin(glMatrix.toRadian(this.Pitch));
        Forward[2] = Math.sin(glMatrix.toRadian(this.Yaw)) * Math.cos(glMatrix.toRadian(this.Pitch));
        vec3.normalize(this.Forward, Forward);

        // recalculate the right and up vectors
        vec3.cross(this.Right, this.Forward, this.WorldUp);
        vec3.normalize(this.Right, this.Right);

        vec3.cross(this.Up, this.Right, this.Forward);
        vec3.normalize(this.Up, this.Up);
    }

}