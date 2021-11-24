world_size = vector(8, 1, 8);
world_blocks_size = world_size.clone().multiply(Chunk.size);

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

const sun = new THREE.PointLight(0xffffaa, 1.5, 10000);
sun.position.set(world_blocks_size.x / 2, 400, world_blocks_size.z / 2);
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

let controls = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
    sprint: false,
    jump: false,
    flying: true,
}

// let chunk = new Chunk();
world = new World(world_size);

gen_ground(world);
gen_trees(world);

const iter_chunks = world.iter_chunk_indices();

camera.position.x = world_blocks_size.x / 2;
camera.position.y = 300;
camera.position.z = world_blocks_size.z / 2;

let falling_speed = 5;
let on_ground = false;

function animate() {
    const i = iter_chunks.next();

    if(!i.done) {
        const chunk_position = i.value;
        const neighbours = faces
            .map(face_to_direction)
            .map(direction => direction.add(chunk_position))
            .map(chunk_position => world.get_chunk(chunk_position));
        ;

        const chunk_mesh = world.chunks.get_at(chunk_position).to_mesh(neighbours);
        const p = chunk_position.clone().multiply(Chunk.size);
        chunk_mesh.position.set(p.x, p.y, p.z);

        scene.add(chunk_mesh);
    }

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
    if(controls.flying) {
        if(controls.up) {
            movement.y += move_speed;
        }
        if(controls.down) {
            movement.y -= move_speed;
        }
        falling_speed = 0;
    }
    else {
        const rc = raycast(world, camera.position.clone().sub(vector(0.4, 2.1, 0.4)), camera.position.clone().add(vector(0.4, -2, 0.4)), vector(0, -1, 0), 0.05);
        if(controls.jump && rc.hit_block) {
            falling_speed = -0.3;
        }
        movement.y -= falling_speed;
    }
    on_ground = false;
    
    while(true) {
        const movement_length = movement.length();

        if(movement_length > 0.05) {
            const movement_direction = movement.clone().divideScalar(movement_length);

            const { distance_travelled, hit_block, last_direction_idx } = raycast(
                world,
                camera.position.clone().sub(vector(0.4, 2.1, 0.4)),
                camera.position.clone().add(vector(0.4, 0.3, 0.4)),
                movement_direction,
                movement_length
            );

            const move_amount = movement_direction.clone().multiplyScalar(distance_travelled);
            
            sign = n => n < 0 ? -1 : (n === 0 ? 0 : 1);
            epsilon = 0.001

            const move_sign = vector(sign(move_amount.x), sign(move_amount.y), sign(move_amount.z))
            const absolute_movement = move_amount.clone().multiply(move_sign)
            const move_back = vector(
                Math.min(epsilon, absolute_movement.x),
                Math.min(epsilon, absolute_movement.y),
                Math.min(epsilon, absolute_movement.z),
            )


            move_amount.sub(move_back.multiply(move_sign))

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
                    on_ground = true;
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
    else if(e.key == 'f' || e.key == 'F') {
        controls.flying = !controls.flying;
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
        controls.jump = false;
    }
    else if(e.key == 'Shift') {
        controls.down = false;
    }
})
