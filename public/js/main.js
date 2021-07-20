const vector = (x, y, z) => new THREE.Vector3(x, y, z);

const vector_as_array = ({x, y, z}) => [x, y, z];
THREE.Vector3.prototype.as_array = function() { return vector_as_array(this) }

THREE.Vector3.prototype.modulo = function(m) {
    this.x %= m;
    this.y %= m;
    this.z %= m;
    return this;
}

THREE.Vector3.prototype.abs = function() {
    this.x = Math.abs(this.x);
    this.y = Math.abs(this.y);
    this.z = Math.abs(this.z);
    return this;
}

function min(array) {
    let smallest_i = 0
    for(let i = 0; i < array.length; i++) {
        if(array[i] < array[smallest_i]) {
            smallest_i = i;
        }
    }

    return { idx: smallest_i, value: array[smallest_i] };
}

class Chunk {
    static size = vector(256, 256, 256);
    static blocks_count = Chunk.size.x * Chunk.size.y * Chunk.size.z;

    static position_to_index(position) {
        return (position.x * this.size.y + position.y) * this.size.z + position.z;
    }

    constructor() {
        this.data = new Array(Chunk.blocks_count);

        for(let tile = 0; tile < Chunk.blocks_count; tile++) {
            this.data[tile] = air;
        }
    }

    get_at(position) {
        if(position.x < 0 || position.x >= Chunk.size.x || position.y < 0 || position.y >= Chunk.size.y || position.z < 0 || position.z >= Chunk.size.z) {
            return null;
        }

        return this.data[Chunk.position_to_index(position)];
    }

    set_at(position, new_block) {
        if(position.x < 0 || position.x >= Chunk.size.x || position.y < 0 || position.y >= Chunk.size.y || position.z < 0 || position.z >= Chunk.size.z) {
            return;
        }

        this.data[Chunk.position_to_index(position)] = new_block;
    }

        // iter_indices() {
    //     const result = [];

    //     for(let x = 0; x < Chunk.size.x; x++) {
    //         for(let y = 0; y < Chunk.size.y; y++) {
    //             for(let z = 0; z < Chunk.size.z; z++) {
    //                 result.push(vector(x, y, z));
    //             }
    //         }
    //     }

    //     return result;
    // }

    *iter_indices() {
        let result = vector(0, 0, 0);
        const max = Chunk.size.clone().subScalar(1);

        for(result.x = 0; result.x < Chunk.size.x; result.x++) {
            for(result.y = 0; result.y < Chunk.size.y; result.y++) {
                for(result.z = 0; result.z < Chunk.size.z; result.z++) {

                    if(result.equals(max)) {
                        return result;
                    }
                    else {

                        yield result;
                    }
                }
            }
        }
    }

    vertices_and_colors() {
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
            // const {x, y, z} = position;

            // if(x % 30 == 0 && y % 30 == 0 && z % 30 == 0) {
            //     console.log(x, y, z, position);
            // }

            const block = this.get_at(position);

            if(block.invisible()) {
                continue;
            }

            for(const face of faces) {
                // console.log(face);
                const neighour_position = position.clone().add(face_to_direction(face));

                const neighbour = this.get_at(neighour_position);

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

    to_mesh() {
        const { all_vertices, all_colors, faces_count } = this.vertices_and_colors();

        let geometry = new THREE.BufferGeometry();
        let material = new THREE.MeshPhongMaterial({
            vertexColors: true,
            emissive: new THREE.Color(0x0c0c0c),
            shininess: 50,
            // side: THREE.DoubleSide,
        });

        material.vertexColors = true;
        
        // let material = new THREE.MeshBasicMaterial( { vertexColors: true } );
        //
        const map_vertices = () => 
            // all_vertices.flatMap(({x, y, z}) => [x, y, z]);
            all_vertices

        const map_colors = () =>
            // all_colors.flatMap(({r, g, b}) => [r, g, b]);
            all_colors

        const pos = new THREE.Float32BufferAttribute(
            map_vertices(),
            3
        );

        const col = new THREE.Float32BufferAttribute(
            map_colors(),
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
    constructor(size) {
        this.size = size;

        this.chunks = new Array(this.size.x * this.size.y, this.size.z);


    }

    *iter_indices() {
    }


}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x4477FF, 1);
document.body.appendChild(renderer.domElement);

let view = {
    horizontal_rotation: 0,
    vertical_rotation: -1,
}

let pointer_locked = false;
renderer.domElement.addEventListener('click', function(e) {
    this.requestPointerLock();
});

document.addEventListener('pointerlockchange', e => {
    pointer_locked = document.pointerLockElement != undefined;
    console.log(pointer_locked);
});

addEventListener('mousemove', e => {
    if(pointer_locked) {
        view.horizontal_rotation -= (e.movementX) / 1000;
        view.vertical_rotation -= e.movementY / 1000;
    }
});

window.addEventListener('resize', e => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
});

const sun = new THREE.PointLight(0xffffaa, 1.5, 1000);
sun.position.set(Chunk.size.x / 2, 200, Chunk.size.z / 2);
sun.castShadow = true;
scene.add(sun);

const ambient_light = new THREE.AmbientLight(0x333333);
scene.add(ambient_light);

const zip = (array1, array2) => array1.map((element, i) => [element, array2[i]]);
Array.prototype.zip = function(that) { return zip(this, that) }

const cube_corners = [
    vector(0, 0, 0),
    vector(0, 0, 1),
    vector(0, 1, 0),
    vector(0, 1, 1),
    vector(1, 0, 0),
    vector(1, 0, 1),
    vector(1, 1, 0),
    vector(1, 1, 1),
];

const cube_corner_directions = cube_corners.map(corner =>
    corner.clone().multiplyScalar(2).addScalar(-1)
);

const cuber_corners_with_directions = zip(cube_corners, cube_corner_directions);

const facing = {
    down: 0,
    up: 1,
    left: 2,
    right: 3,
    backward: 4,
    forward: 5,
}

const faces = [0, 1, 2, 3, 4, 5]

const face_directions = faces.map(face_to_direction);
const face_directions_xyz = face_directions.flatMap(({x, y, z}) => [x, y, z]);

function random(max) {
    return Math.floor(Math.random() * max);
}

function face_to_side_coordinates(face) {
    switch(face) {
        case facing.down:
            return [
                vector(0, 0, 0),
                vector(1, 0, 0),
                vector(1, 0, 1),
                vector(0, 0, 1),
            ]
        case facing.up:
            return [
                vector(0, 1, 1),
                vector(1, 1, 1),
                vector(1, 1, 0),
                vector(0, 1, 0),
            ]
        case facing.left:
            return [
                vector(0, 0, 1),
                vector(0, 1, 1),
                vector(0, 1, 0),
                vector(0, 0, 0),
            ]
        case facing.right:
            return [
                vector(1, 0, 0),
                vector(1, 1, 0),
                vector(1, 1, 1),
                vector(1, 0, 1),
            ]
        case facing.backward:
            return [
                vector(0, 1, 0),
                vector(1, 1, 0),
                vector(1, 0, 0),
                vector(0, 0, 0),
            ]
        case facing.forward:
            return [
                vector(0, 0, 1),
                vector(1, 0, 1),
                vector(1, 1, 1),
                vector(0, 1, 1),
            ]
        default:
            throw new Error(`In face_to_side_coordinates, face value ${face} is not in the range from 0 to 5`);
    }
}

function face_to_direction(face) {
    switch(face) {
        case facing.down:
            return vector(0, -1, 0);
        case facing.up:
            return vector(0, 1, 0);
        case facing.left:
            return vector(-1, 0, 0);
        case facing.right:
            return vector(1, 0, 0);
        case facing.backward:
            return vector(0, 0, -1);
        case facing.forward:
            return vector(0, 0, 1);
        default:
            throw new Error(`In face_to_direction, face value ${face} is not in the range from 0 to 5`);
    }
}

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

let controls = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
    sprint: false,
    jump: false,
}

let chunk = new Chunk();

gen_ground(chunk);
// gen_ground_2(chunk);
gen_trees(chunk);

const chunk_mesh = chunk.to_mesh();

scene.add(chunk_mesh);

camera.position.x = Chunk.size.x / 2;
camera.position.y = 300;
camera.position.z = Chunk.size.z / 2;

let falling_speed = 5;

function animate() {
    let move_speed = 0.2;
    falling_speed += 0.015

    if(controls.sprint) {
        move_speed *= 4;
    }

    let movement = vector(0, 0, 0);

    if(controls.forward) {
        movement.z -= Math.cos(view.horizontal_rotation) * move_speed;
        movement.x -= Math.sin(view.horizontal_rotation) * move_speed;
    }
    if(controls.backward) {
        movement.z += Math.cos(view.horizontal_rotation) * move_speed;
        movement.x += Math.sin(view.horizontal_rotation) * move_speed;
    }
    if(controls.right) {
        movement.z -= Math.sin(view.horizontal_rotation) * move_speed;
        movement.x += Math.cos(view.horizontal_rotation) * move_speed;
    }
    if(controls.left) {
        movement.z += Math.sin(view.horizontal_rotation) * move_speed;
        movement.x -= Math.cos(view.horizontal_rotation) * move_speed;
    }

    if(controls.turn_left) {
        // camera.rotation.y += 0.05;
    }
    if(controls.turn_right) {
        // camera.rotation.y -= 0.05;
    }
    // if(controls.up) {
    //     movement.y += move_speed;
    // }
    // if(controls.down) {
    //     movement.y -= move_speed;
    // }
    
    if(controls.jump) {
        falling_speed = -0.3;
    }
    movement.y -= falling_speed;
    
    while(true) {
        const movement_length = movement.length();

        if(movement_length > 0.05) {
            const movement_direction = movement.clone().divideScalar(movement_length);

            const { distance_travelled, hit_block, last_direction_idx } = raycast(
                chunk,
                camera.position.clone().sub(vector(0.4, 2.1, 0.4)),
                camera.position.clone().add(vector(0.4, 0.3, 0.4)),
                movement_direction,
                movement_length
            );

            console.log(distance_travelled);
            const move_amount = movement_direction.clone().multiplyScalar(distance_travelled);
            
            sign = n => n < 0 ? -1 : (n === 0 ? 0 : 1);

            move_amount.sub(vector(sign(move_amount.x), sign(move_amount.y), sign(move_amount.z)).multiplyScalar(0.01))

            if(distance_travelled > 0.05) {
                camera.position.add(move_amount);
            }

            if(hit_block) {
                movement.sub(move_amount);

                if(last_direction_idx === 0) {
                    movement.x = 0;
                }
                else if(last_direction_idx === 1) {
                    movement.y = 0;
                    falling_speed = 0;
                }
                else if(last_direction_idx === 2) {
                    movement.z = 0;
                }
            }
            else {
                break;
            }
        }
        else {
            break
        }
    }

    camera.rotation.setFromRotationMatrix(
        new THREE.Matrix4().makeRotationY(view.horizontal_rotation).multiply(
            new THREE.Matrix4().makeRotationX(view.vertical_rotation)
        )
    );

    // camera.rotation.x = view.vertical_rotation;
    // camera.rotation.y = view.horizontal_rotation;
    // camera.rotation.x = Math.cos(view.horizontal_rotation) * view.vertical_rotation;
    // camera.rotation.z = Math.sin(view.horizontal_rotation) * view.vertical_rotation;
    //

    // console.log(camera.rotation);
    
    controls.jump = false;
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
}

animate();

addEventListener('keydown', e => {
    if(e.key == 'a' || e.key == 'A') {
        controls.left = true;
    }
    else if(e.key == 'd' || e.key == 'D') {
        controls.right = true;
    }
    else if(e.key == 'w' || e.key == 'W') {
        controls.forward = true;
    }
    else if(e.key == 's' || e.key == 'S') {
        controls.backward = true;
    }
    else if(e.key == 'q' || e.key == 'Q') {
        controls.turn_left = true;
    }
    else if(e.key == 'e' || e.key == 'E') {
        controls.turn_right = true;
    }
    else if(e.key == ' ') {
        controls.up = true;
        controls.jump = true;
    }
    else if(e.key == 'Shift') {
        controls.down = true;
    }
    else if(e.key == 'c' || e.key == 'C') {
        controls.sprint = !controls.sprint;
    }
})

addEventListener('keyup', e => {
    if(e.key == 'a' || e.key == 'A') {
        controls.left = false;
    }
    else if(e.key == 'd' || e.key == 'D') {
        controls.right = false;
    }
    else if(e.key == 'w' || e.key == 'W') {
        controls.forward = false;
    }
    else if(e.key == 's' || e.key == 'S') {
        controls.backward = false;
    }
    else if(e.key == 'q' || e.key == 'Q') {
        controls.turn_left = false;
    }
    else if(e.key == 'e' || e.key == 'E') {
        controls.turn_right = false;
    }
    else if(e.key == ' ') {
        controls.up = false;
    }
    else if(e.key == 'Shift') {
        controls.down = false;
    }
})
