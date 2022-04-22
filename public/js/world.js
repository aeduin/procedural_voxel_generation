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
    height_nan: {toString: () => "height_nan"},
    invalid_result: {toString: () => "invalid_result"},
}

function verify_range_and_throw(ranges, ranges_input_copy, bottom_y, top_y, value) {
    if(!debug) return;
    const opt_range_error = verify_ranges(ranges, ranges_input_copy, bottom_y, top_y, value);

    if(debug && opt_range_error !== range_error.none && opt_range_error !== range_error.double_value) {
        throw new Error(opt_range_error.toString())
    }
}

function verify_ranges(ranges, ranges_input_copy, bottom_y, top_y, value) {
    const error = ranges_have_correct_successors(ranges)
    if(error != range_error.none) {
        return error
    }

    if(!insert_range_post_condition(ranges_input_copy, ranges, bottom_y, top_y, value)) {
        return range_error.invalid_result;
    }

    return range_error.none;
}

function ranges_have_correct_successors(ranges) {
    let last_height = ranges[0];
    let last_value = ranges[1];

    if(isNaN(last_height)) {
        return range_error.height_nan;
    }

    for(let i = 2; i < ranges.length; i += 2) {
        const height = ranges[i];
        const value = ranges[i + 1];
        if(isNaN(height)) {
            return range_error.height_nan;
        }
        if(height <= last_height) {
            return range_error.non_increasing_height;
        }
        else if(last_value.equals(value)){
            return range_error.double_value;
        }
        last_height = height;
        last_value = value;
    }

    return range_error.none
}

function insert_range_post_condition(ranges_input_copy, ranges_result, bottom_y, top_y, value) {
    let i = 0;
    // Everything below bottom_y should be the same value as in the input
    for(; i < ranges_result.length && ranges_result[i] < bottom_y; i += 2) {
        if(!ranges_result[i + 1].equals(ranges_input_copy[i + 1])) {
            return false;
        }
    }
    let j = i - 2;
    // Everything between bottom_y and top_y should be the new value
    for(; i < ranges_result.length && ranges_result[i] <= top_y; i += 2) {
        if(!ranges_result[i + 1].equals(value)) {
            return false;
        }
    }

    // input_idx_offset = x - y
    // where x is the lowest value such that ranges_input_copy[x] >= top_y
    // and y is the lowest value such that ranges_result[y] >= top_y
    let input_idx_offset = 0;

    for(; j < ranges_input_copy.length; j += 2) {
        if(ranges_input_copy[j] > top_y) {
            input_idx_offset = j - i;
            break;
        }
    }

    for(; i < ranges_result.length; i += 2) {
        if(!ranges_result[i + 1].equals(ranges_input_copy[i + input_idx_offset + 1])) {
            return false;
        }
    }

    // TODO: we have now verified that ranges_result is "sound", but not that it is complete. i.e. we did not check that every value from ranges_input_copy that should be copied is indeed copied.

    return true;
}

function insert_range(ranges, bottom_y, top_y, value) {
    let ranges_copy = null;
    if(debug) {
        ranges_copy = ranges.slice();
    }
    if(value.equals(wood) || value.equals(leaf)) {
        // console.log(ranges)
    }

    // Find the ranges that currently contain the start and end of the new range
    let lowest_range_idx = -1;
    for(let i = 0; i < ranges.length; i += 2) {
        if(bottom_y <= ranges[i]) {
            lowest_range_idx = i;
            break;
        }
    }

    if(debug && lowest_range_idx === -1) {
        throw Error("Setting block range that starts above world height is impossible");
    }

    let highest_range_idx = -1;
    for(let i = lowest_range_idx; i < ranges.length; i += 2) {
        if(top_y <= ranges[i]) {
            highest_range_idx = i;
            break;
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

    const lowest_range_same = ranges[lowest_range_idx + 1].equals(value)
    const highest_range_same = ranges[highest_range_idx + 1].equals(value)
    const below_range_same = (
        lowest_range_idx - 2 > 0
        &&
        ranges[lowest_range_idx - 2] === bottom_y - 1
        &&
        ranges[lowest_range_idx - 1].equals(value)
    );
    const above_range_same = (
        highest_range_idx + 3 < ranges.length
        &&
        ranges[highest_range_idx + 2] === top_y + 1
        &&
        ranges[highest_range_idx + 3].equals(value)
    );

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
    let set_bottom_height_idx;
    let set_top_height_idx;
    if(extend_from !== null && extend_to !== null) {
        if(extend_from !== extend_to) {
            remove_ranges(ranges, extend_from, extend_to - 2, false);
        }
        /* implicit: else, the block is placed inside a range that alrady contains the same block */

        verify_range_and_throw(ranges, ranges_copy, bottom_y, top_y, value);

        // remove_ranges_from_idx = extend_from;
        // remove_ranges_to_idx = extend_to - 2;
        // set_top_height_idx = null; // extend_to already has the correct height
        // set_bottom_height_idx = null;
    }
    else if(extend_from !== null /* implicit: && extend_to === null */ ) {
        // If top_y is equal to the height of highest_range, include highest_range in the removed ranges
        // If top_y is less than the height of lowest_range, the new range splits lowest_range. So lowest_range should be duplicated

        set_range_height(ranges, extend_from, top_y);
        if(ranges[highest_range_idx] === top_y) {
            remove_ranges(ranges, extend_from + 2, highest_range_idx)
        }
        else {
            remove_ranges(ranges, extend_from + 2, highest_range_idx - 2);
        }

        verify_range_and_throw(ranges, ranges_copy, bottom_y, top_y, value);
    }
    else if(extend_to !== null /* implicit: && extend_from === null */ ) {
        // Ranges between lowest_range and highest_range should be removed
        // The height of lowest_range should decrease to new_height_below. If this means its height would be equal to the height of the range below it, remove lowest_range as well

        const new_height_below = bottom_y - 1;

        let remove_start_idx;
        let decrease_height_below;
        if(lowest_range_idx - 2 > 0 && ranges[lowest_range_idx - 2] === new_height_below) {
            // The new height of lowest_range would become equal to the height of the range below it, so lowest_range should be removed
            remove_start_idx = lowest_range_idx;
            decrease_height_below = false;
        }
        else {
            remove_start_idx = lowest_range_idx + 2;
            decrease_height_below = true;
            // set_range_height(ranges, lowest_range_idx, new_height_below);
        }

        if(decrease_height_below) {
            set_range_height(ranges, lowest_range_idx, new_height_below);
        }
        remove_ranges(ranges, remove_start_idx, extend_to - 2);

        verify_range_and_throw(ranges, ranges_copy, bottom_y, top_y, value);
    }
    else /* implicit: extend_from === null && extend_to === null */ {
        const new_height_below = bottom_y - 1;

        // Ranges between lowest_range and highest_range should be removed
        // The height of lowest_range should decrease to new_height_below. If this means its height would be equal to the height of the range below it, remove lowest_range as well
        // If top_y is equal to the height of highest_range, include highest_range in the removed ranges
        // If top_y is less than the height of lowest_range, the new range splits lowest_range. So lowest_range should be duplicated

        let remove_start_idx;
        let decrease_height_below;
        if(lowest_range_idx - 2 > 0 && ranges[lowest_range_idx - 2] === new_height_below) {
            // The new height of lowest_range would become equal to the height of the range below it, so lowest_range should be removed
            remove_start_idx = lowest_range_idx;
            decrease_height_below = false;
        }
        else {
            remove_start_idx = lowest_range_idx + 2;
            decrease_height_below = true;
            // set_range_height(ranges, lowest_range_idx, new_height_below);
        }

        let remove_end_idx;
        if(ranges[highest_range_idx] === top_y) {
            // The height of highest_range would be equal to that of the new range, so remove highest_range
            remove_end_idx = highest_range_idx;
        }
        else {
            remove_end_idx = highest_range_idx - 2;
        }

        if(remove_end_idx - remove_start_idx < -2) {
            // Insert instead of remove
            ranges.splice(remove_start_idx - 2, 0, new_height_below, ranges[lowest_range_idx + 1], top_y, value)
        }
        else {
            if(decrease_height_below) {
                set_range_height(ranges, lowest_range_idx, new_height_below);
            }
            remove_ranges(ranges, remove_start_idx, remove_end_idx, true);
            set_range_height(ranges, remove_start_idx, top_y);
            set_range_value(ranges, remove_start_idx, value);
        }

        verify_range_and_throw(ranges, ranges_copy, bottom_y, top_y, value);
    }

    verify_range_and_throw(ranges, ranges_copy, bottom_y, top_y, value);
}

function remove_ranges(ranges, from_idx, to_idx, keep_one=false) {
    const idx = from_idx;
    const removed_elements_count = to_idx - idx + 2;

    if(keep_one) {
        ranges.splice(idx, removed_elements_count, 0, 0)
    }
    else {
        ranges.splice(idx, removed_elements_count)
    }
}

function set_range_height(ranges, idx, height) {
    ranges[idx] = height;
}

function set_range_value(ranges, idx, value) {
    ranges[idx + 1] = value;
}

class Chunk {
    static size = vector2(64, 64);
    static blocks_count = Chunk.size.x * Chunk.size.y;

    constructor() {
        this.data = new Array2D(Chunk.size);

        for(let tile = 0; tile < Chunk.blocks_count; tile++) {
            this.data.data[tile] = [world_height, air];
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

        insert_range(block_ranges, position.y, top_y, new_block);
    }

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
