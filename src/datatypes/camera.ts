import { glMatrix, mat4, quat, vec3 } from 'gl-matrix';
import { CameraType } from '../components/camera-component';
import { Input } from '../engine/input';

export class Camera
{
    // Camera attributes
    Front: vec3;
    Up: vec3;
    Right: vec3;
    WorldUp: vec3;

    // Euler Angles
    Yaw: number;
    Pitch: number;

    // Constructor with vectors
    constructor()
    {
        
        this.Front = vec3.fromValues(0.0, 0.0, -1.0);
        this.Right = vec3.fromValues(1.0, 0.0, 0.0);
        this.Up = vec3.fromValues(0.0, 1.0, 0.0);
        this.WorldUp = this.Up;
        console.log(this.WorldUp[0] + " " + this.WorldUp[1] + " " + this.WorldUp[2]);
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
        position: vec3,
        gl: WebGL2RenderingContext
    )
    {
        const matView = mat4.create();
        const matProj = mat4.create();
        const matViewProj = mat4.create();

        mat4.copy(matView, this.getViewMatrix(position));


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
        gl.uniform3fv(matViewPosUniform, position);

    }

    getViewMatrix(position: vec3)
    {
        const viewMat = mat4.create();
        const posFront = vec3.create();
        vec3.add(posFront, position, this.Front);
        mat4.lookAt(viewMat, position, posFront, this.Up);
        return viewMat;
    }

}