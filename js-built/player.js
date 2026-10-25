const PI_2 = 2.0 * Math.PI;
const PI_OVER_2 = Math.PI / 2.0;
const PI_3_OVER_2 = 3.0 * PI_OVER_2;
const EPSILON = PI_2 / 1000.0;
class Player {
    x;
    y;
    dx;
    dy;
    speed;
    angleRadians;
    angularVelocity;
    tileMap;
    constructor(x, y, tileMap) {
        this.x = x;
        this.y = y;
        this.speed = 0.25;
        this.angleRadians = 0.0;
        this.dx = 0.25;
        this.dy = 0.0;
        this.angularVelocity = 2.0 * Math.PI / 60.0;
        this.tileMap = tileMap;
    }
    moveForward() {
        this.x += this.dx;
        this.y += this.dy;
    }
    moveBackward() {
        this.x -= this.dx;
        this.y -= this.dy;
    }
    rotateClockwise() {
        this.angleRadians -= this.angularVelocity;
        if (this.angleRadians < 0.0) {
            this.angleRadians += 2 * Math.PI;
        }
        this.dx = this.speed * Math.cos(this.angleRadians);
        this.dy = this.speed * Math.sin(this.angleRadians);
    }
    rotateCounterclockwise() {
        this.angleRadians += this.angularVelocity;
        if (this.angleRadians > 2 * Math.PI) {
            this.angleRadians -= 2 * Math.PI;
        }
        this.dx = this.speed * Math.cos(this.angleRadians);
        this.dy = this.speed * Math.sin(this.angleRadians);
    }
    getVertices() {
        let tileCoordinates = [
            0.0, 0.0,
            -0.1, 0.05,
            -0.1, -0.05
        ];
        let sin = Math.sin(this.angleRadians);
        let cos = Math.cos(this.angleRadians);
        for (let i = 0; i < tileCoordinates.length; i += 2) {
            let newX = cos * tileCoordinates[i] - sin * tileCoordinates[i + 1] + this.x;
            let newY = sin * tileCoordinates[i] + cos * tileCoordinates[i + 1] + this.y;
            tileCoordinates[i] = newX;
            tileCoordinates[i + 1] = newY;
        }
        return tileCoordinates;
    }
    getQuadrantIAngle(angleRadians) {
        if (angleRadians < PI_OVER_2) {
            return angleRadians;
        }
        else if (angleRadians < Math.PI) {
            return Math.PI - angleRadians;
        }
        else if (angleRadians < PI_3_OVER_2) {
            return angleRadians - Math.PI;
        }
        else {
            return PI_2 - angleRadians;
        }
    }
    getHorizontalIntersection(angleRadians) {
        if (angleRadians < EPSILON || angleRadians > PI_2 - EPSILON) {
            return null;
        }
        if (angleRadians > Math.PI - EPSILON && angleRadians < Math.PI + EPSILON) {
            return null;
        }
        let isUp = angleRadians > 0.0 && angleRadians < Math.PI;
        let newY = 0.0;
        let dy = 0.0;
        if (isUp) {
            newY = Math.ceil(this.y);
            dy = newY - this.y;
        }
        else {
            newY = Math.floor(this.y);
            dy = this.y - newY;
        }
        let normalizedAngle = this.getQuadrantIAngle(angleRadians);
        let dx = 1.0 / Math.tan(normalizedAngle);
        let isLeft = angleRadians > PI_OVER_2 && angleRadians < PI_3_OVER_2;
        if (isLeft) {
            dx = -dx;
        }
        let newX = this.x + dy * dx;
        let isInside = true;
        if (isUp) {
            isInside = this.tileMap.isInside(newX, newY);
            while (isInside && this.tileMap.getTileAt(Math.floor(newX), Math.floor(newY)) !== 1 /* TILE_TYPE.WALL */) {
                newX += dx;
                ++newY;
                isInside = this.tileMap.isInside(newX, newY);
            }
        }
        else {
            isInside = this.tileMap.isInside(newX, newY - 1.0);
            while (isInside && this.tileMap.getTileAt(Math.floor(newX), Math.floor(newY) - 1) !== 1 /* TILE_TYPE.WALL */) {
                newX += dx;
                --newY;
                isInside = this.tileMap.isInside(newX, newY - 1.0);
            }
        }
        return isInside ? [newX, newY] : null;
    }
    getVerticalIntersection(angleRadians) {
        if (angleRadians > PI_OVER_2 - EPSILON && angleRadians < PI_OVER_2 + EPSILON) {
            return null;
        }
        if (angleRadians > PI_3_OVER_2 - EPSILON && angleRadians < PI_3_OVER_2 + EPSILON) {
            return null;
        }
        let isLeft = angleRadians > PI_OVER_2 && angleRadians < PI_3_OVER_2;
        let newX = 0.0;
        let dx = 0.0;
        if (isLeft) {
            newX = Math.floor(this.x);
            dx = this.x - newX;
        }
        else {
            newX = Math.ceil(this.x);
            dx = newX - this.x;
        }
        let tempAngle = this.getQuadrantIAngle(angleRadians);
        let dy = Math.tan(tempAngle);
        let isUp = angleRadians > 0.0 && angleRadians < Math.PI;
        if (!isUp) {
            dy = -dy;
        }
        let newY = this.y + dx * dy;
        let isInside = true;
        if (isLeft) {
            isInside = this.tileMap.isInside(newX - 1.0, newY);
            while (isInside && this.tileMap.getTileAt(Math.floor(newX) - 1, Math.floor(newY)) !== 1 /* TILE_TYPE.WALL */) {
                --newX;
                newY += dy;
                isInside = this.tileMap.isInside(newX - 1.0, newY);
            }
        }
        else {
            let isInside = this.tileMap.isInside(newX, newY);
            while (isInside && this.tileMap.getTileAt(Math.floor(newX), Math.floor(newY)) !== 1 /* TILE_TYPE.WALL */) {
                ++newX;
                newY += dy;
                isInside = this.tileMap.isInside(newX, newY);
            }
        }
        return isInside ? [newX, newY] : null;
    }
    getNearerIntersection(intersection1, intersection2) {
        if (intersection1 === null) {
            return intersection2;
        }
        if (intersection2 === null) {
            return intersection1;
        }
        return this.x < intersection1[0] === intersection1[0] < intersection2[0] ? intersection1 : intersection2;
    }
    getAllIntersections(fovDegrees) {
        let radianDelta = 0.5 * fovDegrees * Math.PI / 180.0;
        let intersections = [];
        for (let angle = this.angleRadians - radianDelta; angle < this.angleRadians + radianDelta; angle += Math.PI / 180.0) {
            let normalizedAngle = angle;
            if (angle < 0.0) {
                normalizedAngle += PI_2;
            }
            else if (angle > PI_2) {
                normalizedAngle -= PI_2;
            }
            intersections.push(this.getNearerIntersection(this.getHorizontalIntersection(normalizedAngle), this.getVerticalIntersection(normalizedAngle)));
        }
        return intersections;
    }
}
export { Player };
