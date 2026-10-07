// Make sure canvas is fixed in size since that can ruin things later...
const DIMENSION = 0.75 * Math.min(innerWidth, innerHeight);
const WEBGL_CANVAS = document.getElementById("webgl-canvas");
WEBGL_CANVAS.width = DIMENSION;
WEBGL_CANVAS.height = DIMENSION;
