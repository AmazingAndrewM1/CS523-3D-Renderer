"use strict";
// Make sure canvas is fixed in size since that can ruin things later...
const WEBGL_CANVAS = document.getElementById("webgl-canvas");
if (!(WEBGL_CANVAS instanceof HTMLCanvasElement)) {
    throw new TypeError("WEBGL_CANVAS not HTMLCanvasElement");
}
const DIMENSION = 0.75 * Math.min(innerWidth, innerHeight);
WEBGL_CANVAS.width = DIMENSION;
WEBGL_CANVAS.height = DIMENSION;
console.log("TypeScript is running!");
