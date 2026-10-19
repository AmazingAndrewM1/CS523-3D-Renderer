const enum TILE_TYPE{
    FLOOR,
    WALL
}

class TileMap{
    tiles: TILE_TYPE[][] = [
        [TILE_TYPE.WALL, TILE_TYPE.WALL, TILE_TYPE.WALL, TILE_TYPE.WALL, TILE_TYPE.WALL, TILE_TYPE.WALL],
        [TILE_TYPE.WALL, TILE_TYPE.FLOOR, TILE_TYPE.FLOOR, TILE_TYPE.FLOOR, TILE_TYPE.FLOOR, TILE_TYPE.WALL],
        [TILE_TYPE.WALL, TILE_TYPE.FLOOR, TILE_TYPE.FLOOR, TILE_TYPE.WALL, TILE_TYPE.WALL, TILE_TYPE.WALL],
        [TILE_TYPE.WALL, TILE_TYPE.FLOOR, TILE_TYPE.FLOOR, TILE_TYPE.FLOOR, TILE_TYPE.FLOOR, TILE_TYPE.WALL],
        [TILE_TYPE.WALL, TILE_TYPE.FLOOR, TILE_TYPE.FLOOR, TILE_TYPE.FLOOR, TILE_TYPE.FLOOR, TILE_TYPE.WALL],
        [TILE_TYPE.WALL, TILE_TYPE.WALL, TILE_TYPE.WALL, TILE_TYPE.WALL, TILE_TYPE.WALL, TILE_TYPE.WALL]
    ];
    tileSize: number;
    viewportSize: number

    constructor(viewport: Int32Array){
        this.viewportSize = viewport[2];
        this.tileSize = viewport[2] / this.tiles.length;
    }

    getTileAt(x: number, y: number){
        let r = this.tiles.length - y - 1;
        let c = x;
        return this.tiles[r][c];
    }

    isInside(x: number, y: number){
        return x >= 0 && x < this.tiles.length &&
               y >= 0 && y < this.tiles.length;
    }

    getWorldVertices(x: number, y: number){
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

    getScreenVertices(x: number, y: number){
        let worldVertices = this.getWorldVertices(x, y);
        let screenVertices = worldVertices.map(
            (coord: number) => coord / this.viewportSize * 2.0 - 1.0
        );
        return screenVertices;
    }
}

class Rectangle{
    r: number;
    c: number;
    w: number;
    h: number;

    constructor(r: number, c: number, tileMap: TileMap){
        this.r = tileMap.tiles.length - r - 1;
        this.c = c;
        this.w = tileMap.tileSize;
        this.h = tileMap.tileSize;
    }

    getVertices(): Float32Array{
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

export { TileMap, TILE_TYPE, Rectangle };