import { TileMap } from "./map.js";
import { Player } from "./player.js";
let shouldDebug = true;
async function loadShaderSource(filePath) {
    const response = await fetch(filePath);
    if (!response.ok) {
        throw new Error("File retrieval error");
    }
    return response.text();
}
function getDefaultWallTexture() {
    let magenta = [255, 0, 255, 255];
    let black = [0, 0, 0, 255];
    let mixColor = [
        [magenta, black],
        [black, magenta]
    ];
    return {
        pixels: new Uint8ClampedArray(mixColor.flat(Infinity)),
        width: 2,
        height: 2
    };
}
function loadWallTexture(filePath) {
    function isPowerOf2(val) {
        return (val & (val - 1)) === 0; // clever bitwise trick thanks to www.geeksforgeeks.org/dsa/program-to-find-whether-a-given-number-is-power-of-2/#approach-4-using-and-operator-o1-time-and-o1-space
    }
    let image = new Image();
    image.onload = async () => {
        let hasProperDimensions = isPowerOf2(image.width) && isPowerOf2(image.height);
        if (!hasProperDimensions) {
            console.error("image dimensions are not power of 2");
            return;
        }
        let offscreenCanvas = new OffscreenCanvas(image.width, image.height);
        let ctx = offscreenCanvas.getContext("2d");
        if (!(ctx instanceof OffscreenCanvasRenderingContext2D)) {
            throw new TypeError("context not of type CanvasRenderingContext2D");
        }
        ctx.drawImage(image, 0, 0, image.width, image.height);
        let newWallTexture = {
            pixels: ctx.getImageData(0, 0, image.width, image.height, {
                pixelFormat: "rgba-unorm8"
            }).data,
            width: image.width,
            height: image.height
        };
        wallTexture = newWallTexture;
    };
    image.src = filePath;
}
function getFullShaderProgram(gl, vertexSource, fragmentSource) {
    let shadersInfo = [
        { type: gl.VERTEX_SHADER, src: vertexSource },
        { type: gl.FRAGMENT_SHADER, src: fragmentSource }
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
function drawWalls(wallCoordinates, gl, program) {
    let tileCoordinates = wallCoordinates.map(([x, y]) => {
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
    }).flat(Infinity);
    const POSITION_BUFFER = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, POSITION_BUFFER);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tileCoordinates), gl.STATIC_DRAW);
    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 2 * Float32Array.BYTES_PER_ELEMENT, 0);
    let colors = new Array(tileCoordinates.length).fill([1, 0, 0]).flat();
    const COLOR_BUFFER = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, COLOR_BUFFER);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    const colorHandle = gl.getAttribLocation(program, "aColor");
    gl.enableVertexAttribArray(colorHandle);
    gl.vertexAttribPointer(colorHandle, 3, gl.FLOAT, false, 3 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.drawArrays(gl.TRIANGLES, 0, tileCoordinates.length / 2);
}
function drawPlayer(gl, program, player) {
    let playerVertices = player.getVertices();
    const VERTEX_BUFFER = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, VERTEX_BUFFER);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(playerVertices), gl.STATIC_DRAW);
    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 2 * Float32Array.BYTES_PER_ELEMENT, 0);
    let colors = new Array(playerVertices.length).fill([0, 0, 1]).flat();
    const COLOR_BUFFER = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, COLOR_BUFFER);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    const colorHandle = gl.getAttribLocation(program, "aColor");
    gl.enableVertexAttribArray(colorHandle);
    gl.vertexAttribPointer(colorHandle, 3, gl.FLOAT, false, 3 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.drawArrays(gl.LINE_LOOP, 0, 3);
}
function drawPoint(gl, program, point) {
    const VERTEX_BUFFER = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, VERTEX_BUFFER);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(point), gl.STATIC_DRAW);
    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 2 * Float32Array.BYTES_PER_ELEMENT, 0);
    let colors = new Array(point.length).fill([0, 0, 1]).flat();
    const COLOR_BUFFER = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, COLOR_BUFFER);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    const aColor = gl.getAttribLocation(program, "aColor");
    gl.enableVertexAttribArray(aColor);
    gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 3 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.drawArrays(gl.POINTS, 0, 1);
}
function getTextureCoordinates(intersection, nextIntersection) {
    function getIdentity(val) {
        return val;
    }
    function getNegated(val) {
        return -val;
    }
    let uOperation;
    let index;
    if (intersection.isBoundaryHorizontal) {
        uOperation = intersection.isUp ? getIdentity : getNegated;
        index = 0;
    }
    else {
        uOperation = intersection.isLeft ? getIdentity : getNegated;
        index = 1;
    }
    let bottomLeft = [uOperation(intersection.point[index]), 0];
    let bottomRight = [uOperation(nextIntersection.point[index]), 0];
    let topRight = [uOperation(nextIntersection.point[index]), 1];
    let topLeft = [uOperation(intersection.point[index]), 1];
    return [
        bottomLeft,
        bottomRight,
        topRight,
        topLeft
    ];
}
function drawVerticalStripsFromIntersections(gl, program, intersections, wallTexture) {
    /*
        Format of pipeline (for now)
        [x, y, u, v, isBoundaryHorizontal]
    */
    let sin = Math.sin(player.angleRadians);
    let cos = Math.cos(player.angleRadians);
    let stripWidth = gl.getParameter(gl.VIEWPORT)[2] / intersections.length;
    let stripMiddleY = 0.5 * gl.getParameter(gl.VIEWPORT)[3];
    let stripData = [];
    for (let i = 0; i + 1 < intersections.length; ++i) {
        let intersection = intersections[i];
        let nextIntersection = intersections[i + 1];
        let normalizedDistance = Math.sqrt((intersection.point[0] - player.x) * cos + (intersection.point[1] - player.y) * sin);
        let halfHeight = 0.5 * gl.getParameter(gl.VIEWPORT)[3] / normalizedDistance;
        let leftX = i * stripWidth;
        let rightX = leftX + stripWidth;
        let bottomY = stripMiddleY - halfHeight;
        let topY = stripMiddleY + halfHeight;
        let bottomLeft = [[leftX, bottomY]];
        let bottomRight = [[rightX, bottomY]];
        let topRight = [[rightX, topY]];
        let topLeft = [[leftX, topY]];
        let coordinateInfos = [
            bottomLeft,
            bottomRight,
            topRight,
            topLeft
        ];
        let textureCoordinates = getTextureCoordinates(intersection, nextIntersection);
        for (let i = 0; i < coordinateInfos.length; ++i) {
            coordinateInfos[i].push(textureCoordinates[i]);
        }
        let boundaryFloat = intersection.isBoundaryHorizontal ? 1 : 0;
        for (let i = 0; i < coordinateInfos.length; ++i) {
            coordinateInfos[i].push([boundaryFloat]);
        }
        stripData.push([
            bottomLeft,
            bottomRight,
            topLeft,
            bottomRight,
            topRight,
            topLeft
        ]);
    }
    stripData = stripData.flat(Infinity);
    const DATA_BUFFER = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, DATA_BUFFER);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(stripData), gl.STATIC_DRAW);
    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 0);
    const aTextureCoordsLocation = gl.getAttribLocation(PROGRAM, "aTextureCoordinates");
    gl.enableVertexAttribArray(aTextureCoordsLocation);
    gl.vertexAttribPointer(aTextureCoordsLocation, 2, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 2 * Float32Array.BYTES_PER_ELEMENT);
    const aOrientation = gl.getAttribLocation(program, "aOrientation");
    gl.enableVertexAttribArray(aOrientation);
    gl.vertexAttribPointer(aOrientation, 1, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 4 * Float32Array.BYTES_PER_ELEMENT);
    // let colors = new Array(stripData.length).fill([1.0, 0.0, 0.0]).flat();
    // const COLOR_BUFFER = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, COLOR_BUFFER);
    // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    // const aColor = gl.getAttribLocation(program, "aColor");
    // gl.enableVertexAttribArray(aColor);
    // gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 3 * Float32Array.BYTES_PER_ELEMENT, 0);
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, wallTexture.width, wallTexture.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, wallTexture.pixels);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const textureLocation = gl.getUniformLocation(PROGRAM, "uTexture");
    gl.uniform1i(textureLocation, 0);
    gl.drawArrays(gl.TRIANGLES, 0, stripData.length / 5);
}
const VERTEX_SRC = loadShaderSource("./shader/vertex.vs");
const FRAGMENT_SRC = loadShaderSource("./shader/fragment.fs");
let wallTexture = getDefaultWallTexture();
loadWallTexture("./texture/directional-test.png");
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
const PROGRAM = getFullShaderProgram(gl, await VERTEX_SRC, await FRAGMENT_SRC);
gl.useProgram(PROGRAM);
gl.viewport(0, 0, WEBGL_CANVAS.width, WEBGL_CANVAS.height); // clip space -> pixels
gl.clearColor(0.5, 0.5, 0.5, 1);
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
let tileMap = new TileMap(gl.getParameter(gl.VIEWPORT));
let player = new Player(1.5, 1.5, 0.5 * Math.PI, tileMap);
function drawScene(gl, wallTexture) {
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
    const WINDOW_HEIGHT_HANDLE = gl.getUniformLocation(PROGRAM, "uWindowHeight");
    gl.uniform1i(WINDOW_HEIGHT_HANDLE, gl.getParameter(gl.VIEWPORT)[3]);
    let intersections = player.getAllIntersections(60);
    drawVerticalStripsFromIntersections(gl, PROGRAM, intersections, wallTexture);
}
document.addEventListener("keydown", (event) => {
    let doesKeyAffect = true;
    switch (event.key) {
        case "ArrowRight":
            player.turnRight();
            break;
        case "ArrowLeft":
            player.turnLeft();
            break;
        case "ArrowUp":
            player.tryMoveForward();
            break;
        case "ArrowDown":
            player.tryMoveBackward();
            break;
        default:
            doesKeyAffect = false;
            break;
    }
    if (doesKeyAffect) {
        requestAnimationFrame(() => drawScene(gl, wallTexture));
    }
});
requestAnimationFrame(() => drawScene(gl, wallTexture));
