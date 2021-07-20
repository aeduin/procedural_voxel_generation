function gen_ground(chunk) {
    gen_ground_base(
        chunk,
        new MaasNoise(Chunk.size.x / 8, Chunk.size.z / 8),
        new MaasNoise(Chunk.size.x / 128, Chunk.size.z / 128)
    );
}

function gen_ground_2(chunk) {

}

function gen_ground_base(chunk, height_noise, roughness_noise) {
    for(let x = 0; x < Chunk.size.x; x++) {
        for(let z = 0; z < Chunk.size.z; z++) {
            const roughness_sample = Math.abs(roughness_noise.value_at(x / 128, z / 128));
            const height_sample = Math.abs(height_noise.value_at(x / 8, z / 8));

            const roughness = (roughness_sample ** 2 * 10) + 0.5;
            // const roughness = 5;
            const height =
                Math.sqrt(height_sample * 30 + 5) * roughness
                + roughness * 4;
            // const height = height_noise.value_at(x / 8, z / 8) * 4;

            const dirt_layer = 1 + random(2);

            for(let y = 0; y < height - dirt_layer; y++) {
                chunk.set_at(vector(x, y, z), stone);
            }

            for(let y = Math.max(0, Math.floor(height - dirt_layer)); y < height; y++) {
                chunk.set_at(vector(x, y, z), dirt);
            }
            
            let top_block;
            if(height - 60 > Math.random() * 5) {
                top_block = snow;
            }
            else {
                top_block = grass;
            }
            chunk.set_at(vector(x, Math.ceil(height), z), top_block);
            // if(random(2) == 0) {
            //     chunk.set_at(vector(x, 1, z), sand);
            // }
        }
    }
}

class MaasNoise {
    static values_per_cell = 1;

    constructor(grid_width, grid_height) {
        this.width = grid_width + 1;
        this.height = grid_height + 1;

        this.grid = new Array(this.width * this.height * MaasNoise.values_per_cell);

        for(let x = 0; x < this.width; x++) {
            for(let y = 0; y < this.height; y++) {
                const idx = this.to_index(x, y);

                this.grid[idx] = Math.random() * 2 - 1;
                // this.grid[idx + 1] = Math.random() * 2 - 1;
                // this.grid[idx + 2] = Math.random() * 2 - 1;
            }
        }
    }

    to_index(x, y) {
        return (x * this.height + y) * MaasNoise.values_per_cell;
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
            
            const distance_to_corner_x = dx === 0 ? frac_x : 1 - frac_x;
            const distance_to_corner_y = dy === 0 ? frac_y : 1 - frac_y;

            result +=
                (
                    // this.grid[idx] * distance_to_corner_x *.5
                    // + this.grid[idx + 1] * distance_to_corner_y *.5
                    + this.grid[idx]
                ) * Math.min(1 - distance_to_corner_x, 1 - distance_to_corner_y);
        }

        return result;
    }
}
