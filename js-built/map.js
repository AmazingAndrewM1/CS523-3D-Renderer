class TileMap {
    tiles = [
        [1 /* TILE_TYPE.WALL */, 1 /* TILE_TYPE.WALL */, 1 /* TILE_TYPE.WALL */, 1 /* TILE_TYPE.WALL */, 1 /* TILE_TYPE.WALL */, 1 /* TILE_TYPE.WALL */],
        [1 /* TILE_TYPE.WALL */, 0 /* TILE_TYPE.FLOOR */, 0 /* TILE_TYPE.FLOOR */, 0 /* TILE_TYPE.FLOOR */, 0 /* TILE_TYPE.FLOOR */, 1 /* TILE_TYPE.WALL */],
        [1 /* TILE_TYPE.WALL */, 0 /* TILE_TYPE.FLOOR */, 0 /* TILE_TYPE.FLOOR */, 1 /* TILE_TYPE.WALL */, 1 /* TILE_TYPE.WALL */, 1 /* TILE_TYPE.WALL */],
        [1 /* TILE_TYPE.WALL */, 0 /* TILE_TYPE.FLOOR */, 0 /* TILE_TYPE.FLOOR */, 0 /* TILE_TYPE.FLOOR */, 0 /* TILE_TYPE.FLOOR */, 1 /* TILE_TYPE.WALL */],
        [1 /* TILE_TYPE.WALL */, 0 /* TILE_TYPE.FLOOR */, 0 /* TILE_TYPE.FLOOR */, 0 /* TILE_TYPE.FLOOR */, 0 /* TILE_TYPE.FLOOR */, 1 /* TILE_TYPE.WALL */],
        [1 /* TILE_TYPE.WALL */, 1 /* TILE_TYPE.WALL */, 1 /* TILE_TYPE.WALL */, 1 /* TILE_TYPE.WALL */, 1 /* TILE_TYPE.WALL */, 1 /* TILE_TYPE.WALL */]
    ];
    tileSize;
    viewportSize;
    constructor(viewport) {
        this.viewportSize = viewport[2];
        this.tileSize = viewport[2] / this.tiles.length;
    }
    getTileAt(x, y) {
        let r = this.tiles.length - y - 1;
        let c = x;
        return this.tiles[r][c];
    }
    isInside(x, y) {
        return x >= 0 && x < this.tiles.length &&
            y >= 0 && y < this.tiles.length;
    }
    getWorldVertices(x, y) {
        const OFFSET = 0.2;
        let worldX = x * this.tileSize;
        let worldY = y * this.tileSize;
        let returnVal = new Float32Array([
            worldX + OFFSET, worldY + OFFSET,
            worldX + this.tileSize - OFFSET, worldY + OFFSET,
            worldX + OFFSET, worldY + this.tileSize - OFFSET,
            worldX + this.tileSize - OFFSET, worldY + this.tileSize - OFFSET
        ]);
        return returnVal;
    }
    getScreenVertices(x, y) {
        let worldVertices = this.getWorldVertices(x, y);
        let screenVertices = worldVertices.map((coord) => coord / this.viewportSize * 2.0 - 1.0);
        return screenVertices;
    }
}
class Rectangle {
    r;
    c;
    w;
    h;
    constructor(r, c, tileMap) {
        this.r = tileMap.tiles.length - r - 1;
        this.c = c;
        this.w = tileMap.tileSize;
        this.h = tileMap.tileSize;
    }
    getVertices() {
        let x = this.c * this.w;
        let y = this.r * this.h;
        return new Float32Array([
            x, y,
            x, y + this.h,
            x + this.w, y,
            x + this.w, y + this.h
        ]);
    }
}
export { TileMap, Rectangle };
