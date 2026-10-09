const VERTEX_SHADER_SRC = `
    precision mediump float;
    attribute vec2 aPosition;

    void main(){
        gl_Position = vec4(aPosition, 0.0, 1.0);
    }
`;

const FRAGMENT_SHADER_SRC = `
    precision mediump float;

    void main(){
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
`;

function getFullShaderProgram(gl: WebGLRenderingContext){
    let shadersInfo: Array<{type: GLenum, src: string}>= [
        {type: gl.VERTEX_SHADER, src: VERTEX_SHADER_SRC},
        {type: gl.FRAGMENT_SHADER, src: FRAGMENT_SHADER_SRC}
    ];

    const PROGRAM = gl.createProgram();
    for (const {type, src} of shadersInfo){
        const SHADER = gl.createShader(type);
        if (!(SHADER instanceof WebGLShader)){
            throw new TypeError("shader not of type WebGLShader");
        }
        gl.shaderSource(SHADER, src);
        gl.compileShader(SHADER);

        if (!(gl.getShaderParameter(SHADER, gl.COMPILE_STATUS) as GLboolean)){
            throw new Error(gl.getShaderInfoLog(SHADER) ?? "Compilation failed but no error message provided :(");
        }

        gl.attachShader(PROGRAM, SHADER);
    }

    gl.linkProgram(PROGRAM);
    if (!(gl.getProgramParameter(PROGRAM, gl.LINK_STATUS) as GLboolean)){
        throw new Error(gl.getProgramInfoLog(PROGRAM) ?? "Linking failed but no error message provided :(");
    }
    return PROGRAM;
}

// Make sure canvas is fixed in size since that can ruin things later...

const WEBGL_CANVAS = document.getElementById("webgl-canvas");
if (!(WEBGL_CANVAS instanceof HTMLCanvasElement)){
    throw new TypeError("WEBGL_CANVAS not type HTMLCanvasElement");
}
const DIMENSION = 0.75 * Math.min(innerWidth, innerHeight);
WEBGL_CANVAS.width = DIMENSION;
WEBGL_CANVAS.height = DIMENSION;

const gl = WEBGL_CANVAS.getContext("webgl");
if (gl === null){
    throw new Error("WebGL not available on this device");
}

const PROGRAM = getFullShaderProgram(gl);
gl.useProgram(PROGRAM);

const TRIANGLE_VERTICES = new Float32Array([
  //   x      y
    0.0,   0.8,
   -0.8,  -0.6,
    0.8,  -0.6,
]);

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, TRIANGLE_VERTICES, gl.STATIC_DRAW);
gl.bindBuffer(gl.ARRAY_BUFFER, null);

const aPosition = gl.getAttribLocation(PROGRAM, "aPosition");
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.enableVertexAttribArray(aPosition);
gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 2 * Float32Array.BYTES_PER_ELEMENT, 0);

gl.viewport(0, 0, WEBGL_CANVAS.width, WEBGL_CANVAS.height);  // clip space -> pixels
gl.clearColor(0.5, 0.5, 0.5, 1.0);
gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

gl.drawArrays(gl.TRIANGLES, 0, 3);