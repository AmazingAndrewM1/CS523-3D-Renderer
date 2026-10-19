import { TileMap } from "./map.js";
import { Player } from "./player.js";
const VERTEX_SHADER_SRC = `
    precision mediump float;
    attribute vec2 aPosition;
    attribute vec3 aColor;
    varying vec3 vColor;

    void main(){
        gl_Position = vec4(aPosition, 0.0, 1.0);
        gl_PointSize = 5.0;
        vColor = aColor;
    }
`;
const FRAGMENT_SHADER_SRC = `
    precision mediump float;
    varying vec3 vColor;

    void main(){
        gl_FragColor = vec4(vColor, 1.0);
    }
`;
function getFullShaderProgram(gl) {
    let shadersInfo = [
        { type: gl.VERTEX_SHADER, src: VERTEX_SHADER_SRC },
        { type: gl.FRAGMENT_SHADER, src: FRAGMENT_SHADER_SRC }
    ];
    const PROGRAM = gl.createProgram();
    for (const { type, src } of shadersInfo) {
        const SHADER = gl.createShader(type);
        if (!(SHADER instanceof WebGLShader)) {
            throw new TypeError("shader not of type WebGLShader");
        }
        gl.shaderSource(SHADER, src);
        gl.compileShader(SHADER);
        if (!gl.getShaderParameter(SHADER, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(SHADER) ?? "Compilation failed but no error message provided :(");
        }
        gl.attachShader(PROGRAM, SHADER);
    }
    gl.linkProgram(PROGRAM);
    if (!gl.getProgramParameter(PROGRAM, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(PROGRAM) ?? "Linking failed but no error message provided :(");
    }
    return PROGRAM;
}
function drawTile(gl, program, screenVertices) {
    const POSITION_BUFFER = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, POSITION_BUFFER);
    gl.bufferData(gl.ARRAY_BUFFER, screenVertices, gl.STATIC_DRAW);
    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 2 * Float32Array.BYTES_PER_ELEMENT, 0);
    let colors = new Float32Array(new Array(screenVertices.length).fill([1, 0, 0]).flat());
    const COLOR_BUFFER = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, COLOR_BUFFER);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
    const aColor = gl.getAttribLocation(program, "aColor");
    gl.enableVertexAttribArray(aColor);
    gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 3 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
function drawPlayer(gl, program, screenVertices) {
    const VERTEX_BUFFER = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, VERTEX_BUFFER);
    gl.bufferData(gl.ARRAY_BUFFER, screenVertices, gl.STATIC_DRAW);
    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 2 * Float32Array.BYTES_PER_ELEMENT, 0);
    let colors = new Float32Array(new Array(screenVertices.length).fill([0, 0, 1]).flat());
    const COLOR_BUFFER = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, COLOR_BUFFER);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
    const aColor = gl.getAttribLocation(program, "aColor");
    gl.enableVertexAttribArray(aColor);
    gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 3 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.drawArrays(gl.LINE_LOOP, 0, 3);
}
function drawPoint(gl, program, screenVertices) {
    const VERTEX_BUFFER = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, VERTEX_BUFFER);
    gl.bufferData(gl.ARRAY_BUFFER, screenVertices, gl.STATIC_DRAW);
    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 2 * Float32Array.BYTES_PER_ELEMENT, 0);
    let colors = new Float32Array(new Array(screenVertices.length).fill([0, 0, 1]).flat());
    const COLOR_BUFFER = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, COLOR_BUFFER);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
    const aColor = gl.getAttribLocation(program, "aColor");
    gl.enableVertexAttribArray(aColor);
    gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 3 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.drawArrays(gl.POINTS, 0, 1);
}
// Make sure canvas is fixed in size since that can ruin things later...
const WEBGL_CANVAS = document.getElementById("webgl-canvas");
if (!(WEBGL_CANVAS instanceof HTMLCanvasElement)) {
    throw new TypeError("WEBGL_CANVAS not type HTMLCanvasElement");
}
const DIMENSION = 0.75 * Math.min(innerWidth, innerHeight);
WEBGL_CANVAS.width = DIMENSION;
WEBGL_CANVAS.height = DIMENSION;
const gl = WEBGL_CANVAS.getContext("webgl");
if (gl === null) {
    throw new Error("WebGL not available on this device");
}
const PROGRAM = getFullShaderProgram(gl);
gl.useProgram(PROGRAM);
gl.viewport(0, 0, WEBGL_CANVAS.width, WEBGL_CANVAS.height); // clip space -> pixels
gl.clearColor(0.5, 0.5, 0.5, 1);
let tileMap = new TileMap(gl.getParameter(gl.VIEWPORT));
let player = new Player(1.2, 3.45, tileMap);
function drawScene(gl) {
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
    for (let x = 0; x < tileMap.tiles.length; ++x) {
        for (let y = 0; y < tileMap.tiles.length; ++y) {
            if (tileMap.getTileAt(x, y) === 1 /* TILE_TYPE.WALL */) {
                drawTile(gl, PROGRAM, tileMap.getScreenVertices(x, y));
            }
        }
    }
    drawPlayer(gl, PROGRAM, player.getScreenVertices());
    let horizontalIntersection = player.getHorizontalIntersectionVertices();
    if (horizontalIntersection !== null) {
        drawPoint(gl, PROGRAM, horizontalIntersection);
    }
    let verticalIntersection = player.getVerticalIntersectionVertices();
    if (verticalIntersection !== null) {
        drawPoint(gl, PROGRAM, verticalIntersection);
    }
}
document.addEventListener("keydown", (event) => {
    let doesKeyAffect = true;
    switch (event.key) {
        case "ArrowRight":
            player.rotateClockwise();
            break;
        case "ArrowLeft":
            player.rotateCounterclockwise();
            break;
        default:
            doesKeyAffect = false;
            break;
    }
    if (doesKeyAffect) {
        requestAnimationFrame(() => drawScene(gl));
    }
});
requestAnimationFrame(() => drawScene(gl));
