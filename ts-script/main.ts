import {TileMap, TILE_TYPE} from "./map";
import {Player, Point} from "./player";

async function loadShaderSource(filePath: string): Promise<string>{
    const response = await fetch(filePath); 
    if (!response.ok){
        throw new Error("File retrieval error");
    }
    return response.text();
}

function getFullShaderProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string){
    let shadersInfo: Array<{type: GLenum, src: string}>= [
        {type: gl.VERTEX_SHADER, src: vertexSource},
        {type: gl.FRAGMENT_SHADER, src: fragmentSource}
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

function drawWalls(wallCoordinates: Array<[number, number]>, gl: WebGLRenderingContext, program: WebGLProgram){
    let tileCoordinates = wallCoordinates.map(
        ([x, y]) => {
            let bottomLeft = [x, y];
            let bottomRight = [x + 1, y];
            let topLeft = [x, y + 1];
            let topRight = [x + 1, y + 1];
            return [
                bottomLeft,
                bottomRight,
                topLeft,
                bottomRight,
                topRight,
                topLeft
            ];
        }
    ).flat(Infinity) as number[];

    const POSITION_BUFFER = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, POSITION_BUFFER);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tileCoordinates), gl.STATIC_DRAW);

    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 2 * Float32Array.BYTES_PER_ELEMENT, 0);

    let colors = new Array(tileCoordinates.length).fill([1.0, 0.0, 0.0]).flat();
    const COLOR_BUFFER = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, COLOR_BUFFER);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    const colorHandle = gl.getAttribLocation(program, "aColor");
    gl.enableVertexAttribArray(colorHandle);
    gl.vertexAttribPointer(colorHandle, 3, gl.FLOAT, false, 3 * Float32Array.BYTES_PER_ELEMENT, 0);

    gl.drawArrays(gl.TRIANGLES, 0, tileCoordinates.length / 2);
}

function drawPlayer(gl: WebGLRenderingContext, program: WebGLProgram, player: Player){
    let playerVertices = player.getVertices();

    const VERTEX_BUFFER = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, VERTEX_BUFFER);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(playerVertices), gl.STATIC_DRAW);

    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 2 * Float32Array.BYTES_PER_ELEMENT, 0);

    let colors = new Array(playerVertices.length).fill([0.0, 0.0, 1.0]).flat();
    const COLOR_BUFFER = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, COLOR_BUFFER);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    const colorHandle = gl.getAttribLocation(program, "aColor");
    gl.enableVertexAttribArray(colorHandle);
    gl.vertexAttribPointer(colorHandle, 3, gl.FLOAT, false, 3 * Float32Array.BYTES_PER_ELEMENT, 0);

    gl.drawArrays(gl.LINE_LOOP, 0, 3);
}

function drawPoint(gl: WebGLRenderingContext, program: WebGLProgram, point: [number, number]){
    const VERTEX_BUFFER = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, VERTEX_BUFFER);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(point), gl.STATIC_DRAW);

    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 2 * Float32Array.BYTES_PER_ELEMENT, 0);

    let colors = new Array(point.length).fill([0.0, 0.0, 1.0]).flat();
    const COLOR_BUFFER = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, COLOR_BUFFER);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    const aColor = gl.getAttribLocation(program, "aColor");
    gl.enableVertexAttribArray(aColor);
    gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 3 * Float32Array.BYTES_PER_ELEMENT, 0);

    gl.drawArrays(gl.POINTS, 0, 1);
}

function getNearerIntersection(player: Player, intersection1: Point | null, intersection2: Point | null){
    if (intersection1 === null){
        return intersection2;
    }
    if (intersection2 === null){
        return intersection1;
    }

    return player.x < intersection1[0] === intersection1[0] < intersection2[0] ? intersection1 : intersection2;
}

const VERTEX_SRC = loadShaderSource("./shader/vertex.vs");
const FRAGMENT_SRC = loadShaderSource("./shader/fragment.fs");

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

const PROGRAM = getFullShaderProgram(gl, await VERTEX_SRC, await FRAGMENT_SRC);
gl.useProgram(PROGRAM);

gl.viewport(0, 0, WEBGL_CANVAS.width, WEBGL_CANVAS.height);  // clip space -> pixels
gl.clearColor(0.5, 0.5, 0.5, 1.0);

let tileMap = new TileMap(gl.getParameter(gl.VIEWPORT) as Int32Array);
let player = new Player(1.2, 3.45, tileMap);

function drawScene(gl: WebGLRenderingContext){
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

    const UNIFORM_HANDLE = gl.getUniformLocation(PROGRAM, "uMapLength");
    gl.uniform1i(UNIFORM_HANDLE, tileMap.tiles.length);

    let wallCoordinates: Point[] = [];
    for (let x = 0; x < tileMap.tiles.length; ++x){
        for (let y = 0; y < tileMap.tiles.length; ++y){
            if (tileMap.getTileAt(x, y) === TILE_TYPE.WALL){
                wallCoordinates.push([x, y]);
            }
        }
    }
    drawWalls(wallCoordinates, gl, PROGRAM);
    drawPlayer(gl, PROGRAM, player);

    let intersections = player.getAllIntersections(60.0).filter((point) => point !== null);
    for (let intersection of intersections){
        drawPoint(gl, PROGRAM, intersection);
    }
}

document.addEventListener("keydown", (event) => {
    let doesKeyAffect = true;
    switch (event.key){
        case "ArrowRight":
            player.rotateClockwise();
            break;
        case "ArrowLeft":
            player.rotateCounterclockwise();
            break;
        case "ArrowUp":
            player.moveForward();
            break;
        case "ArrowDown":
            player.moveBackward();
            break;
        default:
            doesKeyAffect = false;
            break;
    }
    if (doesKeyAffect){
        requestAnimationFrame(() => drawScene(gl));
    }
});

requestAnimationFrame(() => drawScene(gl));