const PI_2 = 2.0 * Math.PI;
const PI_OVER_2 = Math.PI / 2.0;
const PI_3_OVER_2 = 3.0 * PI_OVER_2;
const EPSILON = PI_2 / 1000.0;
class Player {
    x;
    y;
    dx;
    dy;
    angleRadians;
    angularVelocity;
    tileMap;
    constructor(x, y, tileMap) {
        this.x = x;
        this.y = y;
        this.dx = 0.25;
        this.dy = 0.0;
        this.angleRadians = 0.0;
        this.angularVelocity = 2.0 * Math.PI / 60.0;
        this.tileMap = tileMap;
    }
    rotateClockwise() {
        this.angleRadians -= this.angularVelocity;
        if (this.angleRadians < 0.0) {
            this.angleRadians += 2 * Math.PI;
        }
    }
    rotateCounterclockwise() {
        this.angleRadians += this.angularVelocity;
        if (this.angleRadians > 2 * Math.PI) {
            this.angleRadians -= 2 * Math.PI;
        }
    }
    getScreenVertices() {
        let tileCoordinates = new Float32Array([
            0.0, 0.0,
            -0.1, 0.05,
            -0.1, -0.05
        ]);
        let sin = Math.sin(this.angleRadians);
        let cos = Math.cos(this.angleRadians);
        for (let i = 0; i < tileCoordinates.length; i += 2) {
            let newX = cos * tileCoordinates[i] - sin * tileCoordinates[i + 1];
            let newY = sin * tileCoordinates[i] + cos * tileCoordinates[i + 1];
            tileCoordinates[i] = newX;
            tileCoordinates[i + 1] = newY;
        }
        for (let i = 0; i < tileCoordinates.length; i += 2) {
            tileCoordinates[i] += this.x;
            tileCoordinates[i + 1] += this.y;
        }
        let screenVertices = tileCoordinates.map((coord) => coord / this.tileMap.tiles.length * 2.0 - 1.0);
        return screenVertices;
    }
    getHorizontalIntersectionVertices() {
        if (this.angleRadians < EPSILON || this.angleRadians > PI_2 - EPSILON) {
            return null;
        }
        if (this.angleRadians > Math.PI - EPSILON && this.angleRadians < Math.PI + EPSILON) {
            return null;
        }
        let intersectionX = 0.0;
        let intersectionY = 0.0;
        let isInside = true;
        if (this.angleRadians > 0 && this.angleRadians < Math.PI) {
            let newY = Math.ceil(this.y);
            let dy = newY - this.y;
            let dx = 1.0 / Math.tan(this.angleRadians);
            let newX = this.x + dy * dx;
            let isInsideFlag = this.tileMap.isInside(newX, newY);
            while (isInsideFlag && this.tileMap.getTileAt(Math.floor(newX), Math.floor(newY)) !== 1 /* TILE_TYPE.WALL */) {
                newX += dx;
                ++newY;
                isInsideFlag = this.tileMap.isInside(newX, newY);
            }
            intersectionX = newX;
            intersectionY = newY;
            isInside = isInsideFlag;
        }
        else {
            let newY = Math.floor(this.y);
            let dy = this.y - newY;
            let dx = 1.0 / Math.tan(2.0 * Math.PI - this.angleRadians);
            let newX = this.x + dy * dx;
            let isInsideFlag = this.tileMap.isInside(newX, newY - 1.0);
            while (isInsideFlag && this.tileMap.getTileAt(Math.floor(newX), Math.floor(newY) - 1) !== 1 /* TILE_TYPE.WALL */) {
                newX += dx;
                --newY;
                isInsideFlag = this.tileMap.isInside(newX, newY - 1.0);
            }
            intersectionX = newX;
            intersectionY = newY;
            isInside = isInsideFlag;
        }
        if (!isInside) {
            return null;
        }
        let horizontalIntersection = new Float32Array([
            intersectionX, intersectionY
        ]);
        let screenVertices = horizontalIntersection.map((coord) => coord / this.tileMap.tiles.length * 2.0 - 1.0);
        return screenVertices;
    }
    getVerticalIntersectionVertices() {
        if (this.angleRadians > PI_OVER_2 - EPSILON && this.angleRadians < PI_OVER_2 + EPSILON) {
            return null;
        }
        if (this.angleRadians > PI_3_OVER_2 - EPSILON && this.angleRadians < PI_3_OVER_2 + EPSILON) {
            return null;
        }
        let intersectionX = 0.0;
        let intersectionY = 0.0;
        let isInside = true;
        if (this.angleRadians > PI_OVER_2 && this.angleRadians < PI_3_OVER_2) {
            let newX = Math.floor(this.x);
            let dx = this.x - newX;
            let tempAngle = Math.abs(Math.PI - this.angleRadians);
            let dy = this.angleRadians < Math.PI ? Math.tan(tempAngle) : -Math.tan(tempAngle);
            let newY = this.y + dx * dy;
            let isInsideFlag = this.tileMap.isInside(newX - 1.0, newY);
            while (isInsideFlag && this.tileMap.getTileAt(Math.floor(newX) - 1, Math.floor(newY)) !== 1 /* TILE_TYPE.WALL */) {
                --newX;
                newY += dy;
                isInsideFlag = this.tileMap.isInside(newX - 1.0, newY);
            }
            intersectionX = newX;
            intersectionY = newY;
            isInside = isInsideFlag;
        }
        else {
            let newX = Math.ceil(this.x);
            let dx = newX - this.x;
            let tempAngle = this.angleRadians < Math.PI ? this.angleRadians : PI_2 - this.angleRadians;
            let dy = this.angleRadians < Math.PI ? Math.tan(tempAngle) : -Math.tan(tempAngle);
            let newY = this.y + dx * dy;
            let isInsideFlag = this.tileMap.isInside(newX, newY);
            while (isInsideFlag && this.tileMap.getTileAt(Math.floor(newX), Math.floor(newY)) !== 1 /* TILE_TYPE.WALL */) {
                ++newX;
                newY += dy;
                isInsideFlag = this.tileMap.isInside(newX, newY);
            }
            intersectionX = newX;
            intersectionY = newY;
            isInside = isInsideFlag;
        }
        if (!isInside) {
            return null;
        }
        let verticalIntersection = new Float32Array([
            intersectionX, intersectionY
        ]);
        let screenVertices = verticalIntersection.map((coord) => coord / this.tileMap.tiles.length * 2.0 - 1.0);
        return screenVertices;
    }
}
export { Player };
