const vector = (x, y, z) => new THREE.Vector3(x, y, z);

class Chunk {
    static size = vector(256, 192, 256);
    static blocks_count = Chunk.size.x * Chunk.size.y * Chunk.size.z;

    static position_to_index(position) {
        return (position.x * this.size.y + position.y) * this.size.z + position.z;
    }

    constructor() {
        this.data = new Array(Chunk.blocks_count);

        for(let tile = 0; tile < Chunk.blocks_count; tile++) {
            this.data[tile] = new Air();
        }
    }

    get_at(position) {
        if(position.x < 0 || position.x >= Chunk.size.x || position.y < 0 || position.y >= Chunk.size.y || position.z < 0 || position.z >= Chunk.size.z) {
            return null;
        }

        return this.data[Chunk.position_to_index(position)];
    }

    set_at(position, new_block) {
        this.data[Chunk.position_to_index(position)] = new_block;
    }

    *iter_indices() {
        for(let x = 0; x < Chunk.size.x; x++) {
            for(let y = 0; y < Chunk.size.y; y++) {
                for(let z = 0; z < Chunk.size.z; z++) {
                    const result = vector(x, y, z);

                    if(result.equals(Chunk.size.clone().subScalar(1))) {
                        return result;
                    }
                    else {

                        yield result;
                    }
                }
            }
        }
    }

    to_mesh() {
        let all_vertices = [];

        let all_colors = [];

        let faces_count = 0;

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
                        const { vertices, color } = vertex_info;
                        all_vertices.push(...vertices)

                        for(let i = 0; i < 4; i++) {
                            all_colors.push(color);
                        }

                        faces_count += 1;
                    }
                }
            }
        }

        let geometry = new THREE.BufferGeometry();
        let material = new THREE.MeshPhongMaterial({
            vertexColors: true,
            emissive: new THREE.Color(0x0c0c0c),
            shininess: 50,
            // side: THREE.DoubleSide,
        });

        material.vertexColors = true;
        
        // let material = new THREE.MeshBasicMaterial( { vertexColors: true } );

        const pos = new THREE.Float32BufferAttribute(
            all_vertices.flatMap(({x, y, z}) => [x, y, z]),
            3
        );

        const col = new THREE.Float32BufferAttribute(
            all_colors.flatMap(({r, g, b}) => [r, g, b]),
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

        // result.castShadow = true;
        // result.receiveShadow = true;

        return result;
    }
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const  renderer = new THREE.WebGLRenderer({
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
    vertical_rotation: 0,
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
    // console.log(e, pointer_locked, e.movementX, e.movementY);

    if(pointer_locked) {
        // console.log(e.movementX, e.movementY);
        view.horizontal_rotation -= (e.movementX) / 1000;
        view.vertical_rotation -= e.movementY / 1000;
    }
});

const geometry = new THREE.BufferGeometry();
const vertices = new Float32Array([
    0, 0, 0,
    1, 0, 0,
    0, 1, 0,
    1, 1, 0,
]);

const indices = new Uint32Array([
    0, 1, 2,
    3, 2, 1,
])
// geometry.addAttribute( 'index', new THREE.BufferAttribute( indices, 3 ) );
geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
geometry.setIndex(new THREE.BufferAttribute(indices, 1))
geometry.computeBoundingSphere();
geometry.computeBoundingBox();

// geometry.vertices.push(new THREE.Vector3(0, 0, 0));
// geometry.vertices.push(new THREE.Vector3(0, 100, 0));
// geometry.vertices.push(new THREE.Vector3(100, 0, 0));

// geometry.faces.push(new THREE.Face3(0, 1, 2));

const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );

const mesh = new THREE.Mesh( geometry, material );
mesh.position.z = 1
// scene.add(mesh);

const sun = new THREE.PointLight(0xffffaa, 1.5, 1000);
sun.position.set(Chunk.size.x / 2, 100, Chunk.size.z / 2);
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

const face_directions= faces.map(face_to_direction);

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
    }

    invisible() {
        return false;
    }

    transparent() {
        return this.invisible();
    }


    face(position, facing) {
        const vertices = face_to_side_coordinates(facing).map(cor => cor.add(position));
        
        return { vertices, color: this.color() }
    }

    color() {
        return new THREE.Color(0);
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
class Stone extends Block {
    constructor() {
        super(1);
    }

    color() {
        return new THREE.Color(0x444444);
    }
}

class Dirt extends Block {
    constructor() {
        super(2);
    }

    color() {
        return new THREE.Color(0x6B350F);
    }
}

class Grass extends Block {
    constructor() {
        super(3);
    }

    color() {
        return new THREE.Color(0x117f00);
    }
}


class Sand extends Block {
    constructor() {
        super(4);
    }

    color() {
        return new THREE.Color(0xEFDD6F);
    }
}

class Leaf extends Block {
    constructor() {
        super(5);
    }

    color() {
        return new THREE.Color(0x115a00);
    }
}

class Wood extends Block {
    constructor() {
        super(6);
    }

    color() {
        return new THREE.Color(0xaB4513);
    }
}

class Snow extends Block {
    constructor() {
        super(7);
    }

    color() {
        return new THREE.Color(0xdddddd);
    }
}

let controls = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
    sprint: false,
}

let chunk = new Chunk();

gen_ground(chunk);
// gen_tree(chunk, vector(Chunk.size.x / 2, 10, Chunk.size.z / 2));
//
gen_trees(chunk);

const chunk_mesh = chunk.to_mesh();
// chunk_mesh.position.x = Chunk.size.x / -2;
// chunk_mesh.position.y = Chunk.size.y / -2;
// chunk_mesh.position.z = Chunk.size.z * -1.1;

scene.add(chunk_mesh);

camera.position.z = 30;
camera.position.y = 20;
camera.position.x = Chunk.size.x / 2;

function animate() {
    // console.log(controls)
    mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.01;

    // chunk_mesh.rotation.x += 0.01;
    // chunk_mesh.rotation.y += 0.01;
    
    let move_speed = 0.2;
    if(controls.sprint) {
        move_speed *= 2;
    }

    if(controls.forward) {
        camera.position.z -= Math.cos(view.horizontal_rotation) * move_speed;
        camera.position.x -= Math.sin(view.horizontal_rotation) * move_speed;
    }
    if(controls.backward) {
        camera.position.z += Math.cos(view.horizontal_rotation) * move_speed;
        camera.position.x += Math.sin(view.horizontal_rotation) * move_speed;
    }
    if(controls.right) {
        camera.position.z -= Math.sin(view.horizontal_rotation) * move_speed;
        camera.position.x += Math.cos(view.horizontal_rotation) * move_speed;
    }
    if(controls.left) {
        camera.position.z += Math.sin(view.horizontal_rotation) * move_speed;
        camera.position.x -= Math.cos(view.horizontal_rotation) * move_speed;
    }

    if(controls.turn_left) {
        // camera.rotation.y += 0.05;
    }
    if(controls.turn_right) {
        // camera.rotation.y -= 0.05;
    }
    if(controls.up) {
        camera.position.y += move_speed;
    }
    if(controls.down) {
        camera.position.y -= move_speed;
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
