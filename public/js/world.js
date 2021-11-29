class Block {
    constructor(id) {
        this.id = id;
        this.baseColor = new THREE.Color(0);
    }

    invisible() {
        return false;
    }

    transparent() {
        return this.invisible();
    }

    solid() {
        return !this.invisible();
    }

    face(position, facing) {
        const vertices = face_to_side_coordinates(facing).map(cor => cor.add(position));
        
        return { vertices, color: this.color() }
    }

    color() {
        return this.baseColor;
    }

    equals(other) {
        return this.id === other.id;
    }
}
class Air extends Block {
    constructor() {
        super(0);
    }

    invisible() {
        return true;
    }
}
const air = new Air();

class Stone extends Block {
    constructor() {
        super(1);
        this.baseColor = new THREE.Color(0x444444);
    }
}
const stone = new Stone();

class Dirt extends Block {
    constructor() {
        super(2);
        this.baseColor = new THREE.Color(0x6B350F);
    }
}
const dirt = new Dirt();

class Grass extends Block {
    constructor() {
        super(3);
        this.baseColor = new THREE.Color(0x117f00);
    }
}
const grass = new Grass();

class Sand extends Block {
    constructor() {
        super(4);
        this.baseColor = new THREE.Color(0xEFDD6F);
    }
}
const sand = new Sand();

class Leaf extends Block {
    constructor() {
        super(5);
        this.baseColor = new THREE.Color(0x115a00);
    }
}
const leaf = new Leaf();

class Wood extends Block {
    constructor() {
        super(6);
        this.baseColor = new THREE.Color(0xaB4513);
    }
}
const wood = new Wood();

class Snow extends Block {
    constructor() {
        super(7);
        this.baseColor = new THREE.Color(0xdddddd);
    }
}
const snow = new Snow();

const range_error = {
    none: {toString: () => "none"},
    double_value: {toString: () => "double_value"},
    non_increasing_height: {toString: () => "non_increasing_height"},
}

function verify_range(range) {
    let last_height = range[0];
    let last_value = range[1];
    for(let i = 2; i < range.length; i += 2) {
        const height = range[i];
        const value = range[i + 1];
        if(height <= last_height) {
            return range_error.non_increasing_height;
        }
        else if(last_value.equals(value)){
            return range_error.double_value;
        }
        last_height = height;
        last_value = value;
    }

    return range_error.none;
}

class Chunk {
    static size = vector2(64, 64);
    static blocks_count = Chunk.size.x * Chunk.size.y;

    constructor() {
        this.data = new Array2D(Chunk.size);

        for(let tile = 0; tile < Chunk.blocks_count; tile++) {
            this.data.data[tile] = [255, air];
        }

        this.mesh = null;
    }

    get_at(position) {
        const position_2d = vector2(position.x, position.z)
        const xy_data = this.data.get_at(position_2d);

        if (xy_data === null) {
            return null;
        }

        for(let i = 0; i < xy_data.length; i += 2) {
            const height = xy_data[i];
            if(position.y <= height) {
                return xy_data[i + 1]
            }
        }

        return air;
    }

    set_at(position, new_block, number_of_blocks=1) {
        const position_2d = vector2(position.x, position.z)
        const block_ranges = this.data.get_at(position_2d);

        const top_y = position.y + number_of_blocks - 1;

        // Find the ranges that currently contain the start and end of the new range
        let lowest_range_idx = -1;
        for(let i = 0; i < block_ranges.length; i += 2) {
            if(position.y <= block_ranges[i]) {
                lowest_range_idx = i;
            }
        }

        if(debug && lowest_range_idx === -1) {
            throw Error("Setting block range that starts above world height is impossible");
        }

        let highest_range_idx = -1;
        for(let i = lowest_range_idx; i < block_ranges.length; i += 2) {
            if(top_y <= block_ranges[i]) {
                highest_range_idx = i;
            }
        }

        if(debug && highest_range_idx === -1) {
            throw Error("Setting block range that ends above world height is impossible");
        }


        // Possible (edge) cases:
        // The range below contains the same block
        // The range above contains the same block
        // The range at lowest_range_idx contains the same block
        // The range at highest_range_idx contains the same block
        // lowest_range_idx is the same as highest_range_idx
        // If there are ranges between the lowest and highest range, these should be removed entirely
        // Some combination of the above
        
        const lowest_range_same = block_ranges[lowest_range_idx + 1].equals(new_block)
        const highest_range_same = block_ranges[highest_range_idx + 1].equals(new_block)
        const below_range_same = (
            lowest_range_idx - 2 > 0
            &&
            block_ranges[lowest_range_idx - 2] === position.y - 1
            &&
            block_ranges[lowest_range_idx - 1].equals(new_block)
        );
        const above_range_same = (
            highest_range_idx + 3 < block_ranges.length
            &&
            block_ranges[highest_range_idx + 2] == top_y + 1
            &&
            block_ranges[highest_range_idx + 3].equals(new_block)
        );

        if(debug & lowest_range_same && below_range_same) {
            throw Error("Lowest range and the range below it both contain the new block")
        }
        if(debug & highest_range_same && above_range_same) {
            throw Error("Highest range and the range above it both contain the new block")
        }

        let extend_from = null
        if(lowest_range_same) {
            extend_from = lowest_range_idx;
        }
        else if(below_range_same) {
            extend_from = lowest_range_idx - 2;
        }

        let extend_to = null
        if(highest_range_same) {
            extend_to = highest_range_idx;
        }
        else if(above_range_same) {
            extend_to = highest_range_idx + 2;
        }

        let remove_ranges_to_idx;
        let remove_ranges_from_idx;
        if(extend_from !== null && extend_to !== null) {
            remove_ranges_from_idx = extend_from;
            remove_ranges_to_idx = extend_from - 2;
        }
        else if() {
        }

        // const xy_data = this.data.get_at(position_2d);
        // let height = 0;
        // for(let i = 0; i < xy_data.length; i += 2) {
        //     const old_height = height;
        //     height = xy_data[i];
        //     if(position.y <= height) {
        //         const block_here = xy_data[i + 1];

        //         const lowest_block_range = i - 2 > 0 && old_height === position.y - 1;
        //         const heighest_block_range = i + 2 < xy_data.length && height === top_y;
        //         // block_here_same -> pass
        //         // lowest_block_range && block_below_same -> extend height below
        //         // heighest_block_range && block_above_same -> decrease height here
        //         // else: split current block range
        //         if(block_here.equals(new_block)) {}
        //         // TODO:
        //         // else if(lowest_block_range && heighest_block_range && xy_data[i - 1].equals(new_block) && xy_data[i + 3].equals(new_block)) {
        //         // }
        //         else if(lowest_block_range && xy_data[i - 1].equals(new_block)) {
        //             xy_data[i - 2] += number_of_blocks;
        //             if(heighest_block_range) {
        //                 // The old range is now empty, remove it
        //                 xy_data.splice(i, 2);
        //             }
        //         }
        //         else if(heighest_block_range && xy_data[i + 3].equals(new_block)) {
        //             xy_data[i] -= number_of_blocks;
        //             if(lowest_block_range) {
        //                 // The old range is now empty, remove it
        //                 xy_data.splice(i, 2);
        //             }
        //             else {
        //             }
        //         }
        //         else {
        //             if(lowest_block_range && heighest_block_range) {
        //                 console.log("lowest and highest block")
        //                 xy_data[i + 1] = new_block;
        //             }
        //             else if(lowest_block_range) {
        //                 xy_data.splice(i, 0, top_y, new_block);
        //             }
        //             else if(heighest_block_range) {
        //                 xy_data[i] -= number_of_blocks;
        //                 xy_data.splice(i + 2, 0, top_y, new_block);
        //             }
        //             else {
        //                 const height_below = position.y - 1;
        //                 const height_above = height;

        //                 xy_data[i] = height_below;
        //                 xy_data.splice(i + 2, 0, top_y, new_block);

        //                 if(top_y < height) {
        //                     xy_data.splice(i + 4, 0, height_above, block_here);
        //                 }
        //             }
        //         }
        //         const opt_range_error = verify_range(xy_data);
        //         if(opt_range_error !== range_error.none) {
        //             throw new Error(opt_range_error.toString())
        //         }
        //         return;
        //     }
        // }
        if(debug && opt_range_error !== range_error.none) {
            throw new Error(opt_range_error.toString())
        }
        // TODO: if position.y > current_max_height -> fill air between current_max_height and poistion.y and place new block
    }

    // set_at(position, new_block) {
    //     return this.data.set_at(position, new_block)
    // }

    *iter_indices() {
        let result = vector(0, 0, 0);

        for(result.x = 0; result.x < chunk_size.x; result.x++) {
            for(result.y = 0; result.y < chunk_size.y; result.y++) {
                for(result.z = 0; result.z < chunk_size.z; result.z++) {
                    yield result;
                }
            }
        }
    }

    vertices_and_colors(neighbour_chunks) {
        let all_vertices = [];

        let all_colors = [];

        let faces_count = 0;

        function push(vertex_info) {
            const { vertices, color } = vertex_info;

            for(const {x, y, z} of vertices) {
                all_vertices.push(x, y, z);
            }

            for(let i = 0; i < 4; i++) {
                all_colors.push(color.r, color.g, color.b);
            }

            faces_count += 1;
        }

        for(let x = 0; x < Chunk.size.x; x++) {
            for(let y = 0; y < Chunk.size.y; y++) {
                const here_with_neighbours = [[0, 0, 0], [-1, 0, 1], [1, 0, 2], [0, -1, 3], [0, 1, 4]];
                let xy_data_with_neighbours = Array(5);

                for(const [dx, dy, i] of here_with_neighbours) {
                    const get_at = vector2(x + dx, y + dy);
                    let get_from;

                    if(get_at.x < 0){
                        get_from = neighbour_chunks[i + 1]
                        get_at.x += Chunk.size.x;
                    }
                    else if(get_at.x >= Chunk.size.x){
                        get_from = neighbour_chunks[i + 1]
                        get_at.x -= Chunk.size.x;
                    }
                    else if(get_at.y < 0){
                        get_from = neighbour_chunks[i + 1]
                        get_at.y += Chunk.size.x;
                    }
                    else if(get_at.y >= Chunk.size.y) {
                        get_from = neighbour_chunks[i + 1]
                        get_at.y -= Chunk.size.x;
                    }
                    else {
                        get_from = this;
                    }

                    if(get_from) {
                        xy_data_with_neighbours[i] = get_from.data.get_at(get_at)
                    }
                    else{
                        xy_data_with_neighbours[i] = null;
                    }
                }

                let idcs = [0, 0, 0, 0, 0]
                let old_block = air;
                let center_idx = 0;
                let old_height = 0;
                while(center_idx < xy_data_with_neighbours[0].length) {
                    let next_height;
                    let next_block;
                    if(center_idx + 2 < xy_data_with_neighbours[0].length) {
                        next_height = xy_data_with_neighbours[0][center_idx + 2];
                        next_block = xy_data_with_neighbours[0][center_idx + 3]
                    }
                    else { // Always simulate a block of air on the top of the world
                        next_height = xy_data_with_neighbours[0][center_idx] + 1;
                        next_block = air;
                    }

                    const old_transparent = old_block.transparent();
                    const next_transparent = next_block.transparent();
                    if(old_transparent && !next_transparent) {
                        const vertex_info = next_block.face(vector(x, old_height + 1, y), facing.down);

                        if(vertex_info !== null) {
                            push(vertex_info)
                        }
                    }
                    else if(!old_transparent && next_transparent) {
                        const vertex_info = old_block.face(vector(x, old_height, y), facing.up);

                        if(vertex_info !== null) {
                            push(vertex_info)
                        }
                    }

                    if(!next_transparent) {
                        for(let i = 1; i < 5; i++) {
                            const xy_data = xy_data_with_neighbours[i];
                            if(xy_data !== null) {
                                let old_side_height = old_height;

                                while(true) {
                                    const idx = idcs[i];

                                    let side_block;
                                    let side_height;
                                    if(idx >= xy_data.length) {
                                        side_height = next_height;
                                        side_block = air;
                                    }
                                    else {
                                        side_height = xy_data[idx];
                                        side_block = xy_data[idx + 1];
                                    }

                                    if(side_height <= old_height) {
                                        old_side_height = side_height;
                                        idcs[i] += 2;
                                        continue;
                                    }
                                    if(!side_block.transparent()) {
                                        if(side_height >= next_height) {
                                            break;
                                        }
                                        else {
                                            old_side_height = side_height;
                                            idcs[i] += 2;
                                            continue;
                                        }
                                    }
                                    
                                    for(let vertical_y = Math.max(old_side_height, old_height) + 1; vertical_y <= Math.min(side_height, next_height); vertical_y++) {
                                        const vertex_info = next_block.face(vector(x, vertical_y, y), i + 1);

                                        if(vertex_info !== null) {
                                            push(vertex_info);
                                        }
                                    }

                                    if(side_height < next_height) {
                                        old_side_height = side_height;
                                        idcs[i] += 2;
                                    }
                                    else {
                                        break;
                                    }
                                }
                            }
                        }
                    }

                    old_block = next_block;
                    center_idx += 2;
                    old_height = next_height;
                }
            }
        }

        return { all_vertices, all_colors, faces_count };
    }

    to_mesh(neighbour_chunks) {
        const { all_vertices, all_colors, faces_count } = this.vertices_and_colors(neighbour_chunks);

        let geometry = new THREE.BufferGeometry();
        let material = new THREE.MeshPhongMaterial({
            vertexColors: true,
            emissive: new THREE.Color(0x0c0c0c),
            shininess: 50,
        });
        
        const pos = new THREE.Float32BufferAttribute(
            all_vertices,
            3
        );

        const col = new THREE.Float32BufferAttribute(
            all_colors,
            3
        );

        geometry.setAttribute('position', pos);
        geometry.setAttribute('color', col);
        
        const indices = new Uint32Array(faces_count * 6);

        for(let face_index = 0; face_index < faces_count; face_index++) {
            indices[face_index * 6 + 0] = face_index * 4 + 0;
            indices[face_index * 6 + 1] = face_index * 4 + 1;
            indices[face_index * 6 + 2] = face_index * 4 + 2;
            indices[face_index * 6 + 3] = face_index * 4 + 2;
            indices[face_index * 6 + 4] = face_index * 4 + 3;
            indices[face_index * 6 + 5] = face_index * 4 + 0;
        }

        geometry.setIndex(new THREE.BufferAttribute(indices, 1));

        geometry.computeBoundingSphere();
        geometry.computeBoundingBox();
        geometry.computeVertexNormals();

        const result = new THREE.Mesh(geometry, material)

        result.castShadow = true;
        result.receiveShadow = true;

        this.mesh = result;
        return result;
    }
}

class World {
    constructor(chunks_size) {
        this.chunks_size = chunks_size;
        this.blocks_size = chunks_size.clone().multiply(chunk_size);

        this.chunks = new Array3D(chunks_size);
        for(const chunk_idx of this.iter_chunk_indices()) {
            this.chunks.set_at(chunk_idx, new Chunk());
        }
    }

    iter_chunk_indices() {
        return this.chunks.iter_indices();
    }

    *iter_coordinates() {
        for(chunk_position of this.iter_indices()) {
            let result = vector(0, 0, 0);
            const chunk_corner = chunk_position.clone().multiply(chunk_size)

            for(result.x = chunk_corner.x; result.x < chunk_size.x + chunk_corner.x; result.x++) {
                for(result.y = chunk_corner.y; result.y < chunk_size.y + chunk_corner.y; result.y++) {
                    for(result.z = chunk_corner.z; result.z < chunk_size.z + chunk_corner.z; result.z++) {
                        yield result;
                    }
                }
            }
        }
    }

    position_of_chunk(position) {
        return position.clone().divide(chunk_size).floor();
    }

    position_in_chunk(position) {
        let p = position.clone()
        p = p.modulo(chunk_size);
        p = p.floor()
        return p;
    }

    get_array_at(position) {
        const pc = this.position_of_chunk(position);
        const pic = this.position_in_chunk(position);
        const c = this.chunks.get_at(pc);

        return c?.data?.get_at(vector2(pic.x, pic.z));
    }

    get_at(position) {
        return this.chunks.get_at(this.position_of_chunk(position))?.get_at(this.position_in_chunk(position)) ?? null;
    }

    get_chunk(chunk_position) {
        return this.chunks.get_at(chunk_position);
    }

    set_at(position, block, n_blocks=1) {
        const pc = this.position_of_chunk(position);
        const c = this.chunks.get_at(pc);

        if(c !== null) {
            const position_in_chunk = this.position_in_chunk(position);
            c.set_at(position_in_chunk, block, n_blocks);
            return c.data.get_at(vector2(position_in_chunk.x, position_in_chunk.z));
        }
    }
}
