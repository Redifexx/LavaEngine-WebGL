import { glMatrix, mat4, quat, vec3 } from 'gl-matrix';

export enum CameraMovement
{
    FORWARD,
    BACKWARD,
    LEFT,
    RIGHT,
    UP,
    DOWN
};


const YAW = -90.0;
const PITCH = 0.0;
const SPEED = 8.0;
const SENSITIVITY = 0.1;
const ZOOM = 80.0;
const MULTIPLIER = 2.0;

export class Camera
{
    // Camera attributes
    Position: vec3;
    Front: vec3;
    Up: vec3;
    Right: vec3;
    WorldUp: vec3;

    // Euler Angles
    Yaw: number;
    Pitch: number;

    // Camera Options
    MovementSpeed: number;
    MouseSensitivity: number;
    Zoom: number;
    Multiplier: number;

    // Constructor with vectors
    constructor(
        position = vec3.fromValues(0.0, 0.0, 0.0),
        up = vec3.fromValues(0.0, 1.0, 0.0),
        yaw = YAW, pitch = PITCH)
    {
        this.Front = vec3.fromValues(0.0, 0.0, -1.0);
        this.Right = vec3.create();
        this.Up = vec3.create();
        this.MovementSpeed = SPEED;
        this.MouseSensitivity = SENSITIVITY;
        this.Zoom = ZOOM;
        this.Multiplier = MULTIPLIER;
        this.Position = position;
        this.WorldUp = up;
        this.Yaw = yaw;
        this.Pitch = pitch;
        this.updateCameraVectors();
        console.log("Camera Position: "
            + this.Position[0].toString()
            + ", " +
            + this.Position[1].toString()
            + ", " +
            + this.Position[2].toString()
        );
    }

    // Helper for walk
    getGroundForward(): vec3
    {
        const forward = vec3.clone(this.Front);
        forward[1] = 0.0;
        vec3.normalize(forward, forward);
        return forward;
    };

    processKeysFlight(direction: CameraMovement, deltaTime: number, isSprinting: boolean = false)
    {
        let velocity = this.MovementSpeed * deltaTime;
        let multiplier = isSprinting ? this.Multiplier : 1.0;

        if (direction === CameraMovement.FORWARD)
        {
            velocity *= multiplier;
            let temp = vec3.create();
            vec3.scale(temp, this.Front, velocity);
            vec3.add(this.Position, this.Position, temp);
        }
        if (direction === CameraMovement.BACKWARD)
        {
            velocity *= multiplier;
            let temp = vec3.create();
            vec3.scale(temp, this.Front, velocity);
            vec3.subtract(this.Position, this.Position, temp);
        }
        if (direction === CameraMovement.LEFT)
        {
            velocity *= multiplier;
            let temp = vec3.create();
            vec3.scale(temp, this.Right, velocity);
            vec3.subtract(this.Position, this.Position, temp);
        }
        if (direction === CameraMovement.RIGHT)
        {
            velocity *= multiplier;
            let temp = vec3.create();
            vec3.scale(temp, this.Right, velocity);
            vec3.add(this.Position, this.Position, temp);
        }
        if (direction === CameraMovement.UP)
        {
            velocity *= multiplier;
            let temp = vec3.create();
            vec3.scale(temp, this.WorldUp, velocity);
            vec3.add(this.Position, this.Position, temp);
        }
        if (direction === CameraMovement.DOWN)
        {
            velocity *= multiplier;
            let temp = vec3.create();
            vec3.scale(temp, this.WorldUp, velocity);
            vec3.subtract(this.Position, this.Position, temp);
        }
        console.log("Camera Position: "
            + this.Position[0].toString()
            + ", " +
            + this.Position[1].toString()
            + ", " +
            + this.Position[2].toString()
        );
    }

    processKeysWalk(direction: CameraMovement, deltaTime: number, isSprinting: boolean = false)
    {
        let velocity = this.MovementSpeed * deltaTime;
        let multiplier = isSprinting ? this.Multiplier : 1.0;

        if (direction === CameraMovement.FORWARD)
        {
            let temp = vec3.create();
            vec3.scale(temp, this.getGroundForward(), velocity * multiplier);
            vec3.add(this.Position, this.Position, temp);
        }
        if (direction === CameraMovement.BACKWARD)
        {
            let temp = vec3.create();
            vec3.scale(temp, this.getGroundForward(), velocity * multiplier);
            vec3.subtract(this.Position, this.Position, temp);
        }
        if (direction === CameraMovement.LEFT)
        {
            let temp = vec3.create();
            vec3.scale(temp, this.Right, velocity * multiplier);
            vec3.subtract(this.Position, this.Position, temp);
        }
        if (direction === CameraMovement.RIGHT)
        {
            let temp = vec3.create();
            vec3.scale(temp, this.Right, velocity * multiplier);
            vec3.add(this.Position, this.Position, temp);
        }

        // keep fixed height
        //const groundHeight = 2.0;
        //this.Position[1] = groundHeight;
        console.log("Camera Position: "
            + this.Position[0].toString()
            + ", " +
            + this.Position[1].toString()
            + ", " +
            + this.Position[2].toString()
        );
    }

    processMouseMovement(xOffset: number, yOffset: number, constrainPitch: GLboolean = true)
    {
        xOffset *= this.MouseSensitivity;
        yOffset *= this.MouseSensitivity;

        this.Yaw += xOffset;
        this.Pitch += yOffset;

        // screen doesn't get flipped when pitch is out of bounds
        if (constrainPitch)
        {
            if (this.Pitch > 89.0)
            {
                this.Pitch = 89.0;
            }
            if (this.Pitch < -89.0)
            {
                this.Pitch = -89.0;
            } 
        }

        // update these angles
        this.updateCameraVectors();
    }

    processMouseScroll(yOffset: number)
    {
        this.Multiplier += yOffset / 10.0;
        if (this.Multiplier < 0.01)
        {
            this.Multiplier = 0.01;
        }
        if (this.Multiplier > 120.0)
        {
            this.Multiplier = 120.0;
        }
    }

    getViewMatrix()
    {
        const viewMat = mat4.create();
        const posFront = vec3.create();
        vec3.add(posFront, this.Position, this.Front);
        mat4.lookAt(viewMat, this.Position, posFront, this.Up);
        return viewMat;
    }

    updateCameraVectors()
    {
        let front = vec3.fromValues(0.0, 0.0, 0.0);
        front[0] = Math.cos(glMatrix.toRadian(this.Yaw)) * Math.cos(glMatrix.toRadian(this.Pitch));
        front[1] = Math.sin(glMatrix.toRadian(this.Pitch));
        front[2] = Math.sin(glMatrix.toRadian(this.Yaw)) * Math.cos(glMatrix.toRadian(this.Pitch));
        vec3.normalize(this.Front, front);

        // recalculate the right and up vectors
        vec3.cross(this.Right, this.Front, this.WorldUp);
        vec3.normalize(this.Right, this.Right);

        vec3.cross(this.Up, this.Right, this.Front);
        vec3.normalize(this.Up, this.Up);
    }

}