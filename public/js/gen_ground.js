function gen_ground(chunk) {
    const noise = new PerlinNoise(Chunk.size.x / 8, Chunk.size.z / 8);

    console.log(noise);

    for(let x = 0; x < Chunk.size.x; x++) {
        for(let z = 0; z < Chunk.size.z; z++) {
            const height = Math.sqrt(Math.abs(noise.value_at(x / 8, z / 8)) * 10);
            // const height = noise.value_at(x / 8, z / 8) * 4;

            for(let y = 0; y < height; y++) {
                chunk.set_at(vector(x, y, z), new Dirt());
            }

            chunk.set_at(vector(x, Math.ceil(height), z), new Grass());
            // if(random(2) == 0) {
            //     chunk.set_at(vector(x, 1, z), new Sand());
            // }
        }
    }
}

class PerlinNoise {
    constructor(grid_width, grid_height) {
        this.width = grid_width + 1;
        this.height = grid_height + 1;

        this.grid = new Array(this.width * this.height * 2);

        for(let x = 0; x < this.width; x++) {
            for(let y = 0; y < this.height; y++) {
                const idx = this.to_index(x, y);

                this.grid[idx] = Math.random() * 2 - 1;
                this.grid[idx + 1] = Math.random() * 2 - 1;
            }
        }
    }

    to_index(x, y) {
        return (x * this.height + y) * 2;
    }

    value_at(x, y) {
        let result = 0;

        for(const [dx, dy] of [
            [0, 0],
            [1, 0],
            [0, 1],
            [1, 1],
        ]) {
            const corner_x = Math.floor(x + dx);
            const corner_y = Math.floor(y + dy);

            if(corner_x < 0 || corner_x >= this.width ||corner_y < 0 || corner_y >= this.height) {
                return 0;
            }
            
            const idx = this.to_index(corner_x, corner_y);
            // console.log(corner_x, corner_y, idx);
            //

            const frac_x = x % 1;
            const frac_y = y % 1;
            
            const distance_to_corner_x = dx === 0 ? 1 - frac_x : frac_x;
            const distance_to_corner_y = dy === 0 ? 1 - frac_y : frac_y;

            const distance = distance_to_corner_x * distance_to_corner_x + distance_to_corner_y * distance_to_corner_y;

            result +=
                (
                    this.grid[idx] * distance_to_corner_x +
                    this.grid[idx + 1] * distance_to_corner_y
                ) * distance;
        }

        return result;
    }
}
