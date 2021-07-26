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
    static size = vector(64, 256, 64);
    static blocks_count = Chunk.size.x * Chunk.size.y * Chunk.size.z;

    static position_to_index(position) {
        return (position.x * this.size.y + position.y) * this.size.z + position.z;
    }

    constructor() {
        this.data = new Array3D(Chunk.size);

        for(let tile = 0; tile < Chunk.blocks_count; tile++) {
            this.data.data[tile] = air;
        }
    }

    get_at(position) {
        return this.data.get_at(position);
    }

    set_at(position, new_block) {
        return this.data.set_at(position, new_block)
    }

    iter_indices() {
        return this.data.iter_indices();
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

        for(const position of this.iter_indices()) {
            const block = this.get_at(position);

            if(block.invisible()) {
                continue;
            }

            for(const face of faces) {
                const neigbhour_position = position.clone().add(face_to_direction(face));

                let neighbour = this.get_at(neigbhour_position);
                if(neighbour === null) {
                    const neighbour_chunk = neighbour_chunks[face];
                    if(neighbour_chunk !== null) {
                        const position_in_neighbour_chunk = neigbhour_position.clone().sub(
                            face_to_direction(face).multiply(Chunk.size)
                        );
                        neighbour = neighbour_chunk.get_at(position_in_neighbour_chunk);
                    }
                }

                if(neighbour == null || neighbour.transparent()) {
                    const vertex_info = block.face(position, face);
                    
                    if(vertex_info !== null) {
                        push(vertex_info);
                    }
                }
            }
        }

        return { all_vertices, all_colors, faces_count };
    }

    to_mesh(chunk_position) {
        const { all_vertices, all_colors, faces_count } = this.vertices_and_colors(chunk_position);

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
        this.blocks_size = chunks_size.clone().multiply(Chunk.size);

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
            const chunk_corner = chunk_position.clone().multiply(Chunk.size)

            for(result.x = chunk_corner.x; result.x < Chunk.size.x + chunk_corner.x; result.x++) {
                for(result.y = chunk_corner.y; result.y < Chunk.size.y + chunk_corner.y; result.y++) {
                    for(result.z = chunk_corner.z; result.z < Chunk.size.z + chunk_corner.z; result.z++) {
                        yield result;
                    }
                }
            }
        }
    }

    position_of_chunk(position) {
        return position.clone().divide(Chunk.size).floor();
    }

    position_in_chunk(position) {
        let p = position.clone()
        p = p.modulo(Chunk.size);
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
