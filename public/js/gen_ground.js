function gen_ground(world) {
    gen_ground_base(
        world,
        new MaasNoise(world.blocks_size.x / 8, world.blocks_size.z / 8),
        new MaasNoise(world.blocks_size.x / 256, world.blocks_size.z / 256)
    );
}

function gen_ground_2(world) {

}

function gen_ground_base(world, height_noise, roughness_noise) {
    for(let x = 0; x < world.blocks_size.x; x++) {
        for(let z = 0; z < world.blocks_size.z; z++) {
            const roughness_sample = Math.abs(roughness_noise.value_at(x / 256, z / 256));
            const height_sample = Math.abs(height_noise.value_at(x / 8, z / 8));

            const roughness = (roughness_sample ** 2 * 20) + 0.5;
            // const roughness = 5;
            const height =
                Math.sqrt(height_sample * 40 + 5) * roughness
                + roughness * 4;
            // const height = height_noise.value_at(x / 8, z / 8) * 4;

            const dirt_layer = 1 + random(2);

            // for(let y = 0; y < height - dirt_layer; y++) {
            world.set_at(vector(x, 0, z), stone, Math.floor(height - dirt_layer));
            // }

            const min_y = Math.max(0, Math.floor(height - dirt_layer))
            const max_y = Math.floor(height);
            // for(let y = ; y < height; y++) {
            world.set_at(vector(x, min_y, z), dirt, max_y - min_y + 1);
            // }
            
            let top_block;
            if(height - 60 > Math.random() * 5) {
                top_block = snow;
            }
            else {
                top_block = grass;
            }
            world.set_at(vector(x, Math.ceil(height), z), top_block);
            // if(random(2) == 0) {
            //     world.set_at(vector(x, 1, z), sand);
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
                ) * ((1 - distance_to_corner_x) * (1 - distance_to_corner_y))
                // * Math.min(1 - distance_to_corner_x, 1 - distance_to_corner_y);
        }

        return result;
    }
}
