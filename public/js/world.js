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

class Chunk {
    static size = vector(64, 64);
    static blocks_count = Chunk.size.x * Chunk.size.y;

    constructor() {
        this.data = new Array2D(Chunk.size);

        for(let tile = 0; tile < Chunk.blocks_count; tile++) {
            this.data.data[tile] = [255, air];
        }
    }

    get_at(position) {
        const position_2d = vector2(position.x, position.z)
        const xy_data = this.data.get_at(position_2d);

        if (xy_data === null) {
            return null;
        }

        let height = 0;
        for(let i = 0; i < xy_data.length; i += 2) {
            height += xy_data[i];
            if(position.y <= height) {
                return xy_data[i + 1]
            }
        }

        return air;
    }

    set_at(position, new_block) {
        const position_2d = vector2(position.x, position.z)
        const xy_data = this.data.get_at(position_2d);

        let height = 0;
        for(let i = 0; i < xy_data.length; i += 2) {
            const old_height = height;
            height += xy_data[i];
            if(position.y <= height) {
                const block_here = xy_data[i + 1];

                const lowest_block_range = i - 2 > 0 && old_height === position.y - 1;
                const heighest_block_range = i + 2 < xy_data.length && height + 1 === position.y;
                // block_here_same -> pass
                // lowest_block_range && block_below_same -> extend height below
                // heighest_block_range && block_above_same -> decrease height here
                // else: split current block range
                if(block_here.equals(new_block)) {
                    return;
                }
                else if(lowest_block_range && xy_data[i - 1].equals(new_block)) {
                    xy_data[i - 2] += 1;
                    xy_data[i] -= 1;
                    return;
                }
                else if(heighest_block_range && xy_data[i + 3].equals(new_block)) {
                    xy_data[i + 2] += 1;
                    xy_data[i] -= 1;
                }
                else {
                    if(lowest_block_range) {
                        xy_data[i] -= 1;
                        xy_data.splice(i, 0, 1, new_block);
                    }
                    else if(heighest_block_range) {
                        xy_data[i] -= i;
                        xy_data.splice(i + 2, 0, 1, new_block);
                    }
                    else {
                        const size_below = position.y - old_height - 1;
                        const size_above = height - position.y;

                        xy_data[i] = size_below;
                        xy_data.splice(i + 2, 0, 1, new_block);
                        xy_data.splice(i + 4, 0, size_above, block_here);
                    }
                }

            }
        }

        return air;
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
            // all_vertices.push(...vertices)

            for(let i = 0; i < 4; i++) {
                all_colors.push(color.r, color.g, color.b);
            }

            faces_count += 1;
        }

        for(let x = 0; x < Chunk.size.x; x++) {
            for(let z = 0; z < Chunk.size.y; z++) {
                const here_with_neighbours = [[0, 0, 0], [-1, 0, 1], [1, 0, 2], [0, -1, 3], [0, 1, 4]];
                xy_data_with_neighbours = Array(5);

                for(const [dx, dy, i] of here_with_neighbours) {
                    const get_at = vector2(x + dx, y + dy);
                    let get_from;

                    if(get_at.x < 0){
                        get_from = neighbour_chunks[i + 1]
                        postion.x += Chunk.size.x;
                    }
                    else if(get_at.x >= Chunk.size.x){
                        get_from = neighbour_chunks[i + 1]
                        postion.x -= Chunk.size.x;
                    }
                    else if(get_at.y < 0){
                        get_from = neighbour_chunks[i + 1]
                        postion.y += Chunk.size.x;
                    }
                    else if(get_at.y >= Chunk.size.y) {
                        get_from = neighbour_chunks[i + 1]
                        postion.y -= Chunk.size.x;
                    }
                    else {
                        get_from = this;
                    }

                    xy_data_with_neighbours[i] = get_from.data.get_at(get_at)
                }

                for(let i = 0; i < 9; i++) {
                    const x_component = Math.floor(i / 3);
                    const y_component = i % 3;

                    const dx = x_component - 1;
                    const dy = y_component - 1;
                    
                    let data;
                    
                    get_from

                    this.data.get_at(position)

                    if(data === null) {
                        if
                    }

                    xy_data[i] = data;
                }
            }
        }

        // for(const position of this.iter_indices()) {
        //     const block = this.get_at(position);

        //     if(block.invisible()) {
        //         continue;
        //     }

        //     for(const face of faces) {
        //         const neighbour_position = position.clone().add(face_to_direction(face));

        //         let neighbour = this.get_at(neighbour_position);
        //         if(neighbour === null) {
        //             const neighbour_chunk = neighbour_chunks[face];
        //             if(neighbour_chunk !== null) {
        //                 const position_in_neighbour_chunk = neighbour_position.clone().sub(
        //                     face_to_direction(face).multiply(chunk_size)
        //                 );
        //                 neighbour = neighbour_chunk.get_at(position_in_neighbour_chunk);
        //             }
        //         }

        //         if(neighbour === null || neighbour.transparent()) {
        //             const vertex_info = block.face(position, face);
                    
        //             if(vertex_info !== null) {
        //                 push(vertex_info);
        //             }
        //         }
        //     }
        // }

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

    get_at(position) {
        return this.chunks.get_at(this.position_of_chunk(position))?.get_at(this.position_in_chunk(position)) ?? null;
    }

    get_chunk(chunk_position) {
        return this.chunks.get_at(chunk_position);
    }

    set_at(position, block) {
        const pc = this.position_of_chunk(position);
        const c = this.chunks.get_at(pc);

        return c?.set_at(this.position_in_chunk(position), block) ?? false;
    }
}
