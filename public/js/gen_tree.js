function gen_trees(world) {
    const forest_noise = new MaasNoise(world.blocks_size.x / 64, world.blocks_size.z / 64);
    
    const tree_attempts_count = world.blocks_size.x * world.blocks_size.z / 128;

    for(let tree_id = 0; tree_id < tree_attempts_count; tree_id++) {
        const considered_location = vector(random(world.blocks_size.x), world.blocks_size.y, random(world.blocks_size.z));

        const tree_chance = forest_noise.value_at(considered_location.x / 64, considered_location.z / 64);
        
        if(Math.random() < tree_chance) {
            gen_tree(world, considered_location);
        }
    }
}


function gen_tree(world, base_position) {
    while(true) {
        base_position.y -= 1;

        if(base_position.y < 0) {
            return;
        }

        const block_below = world.get_at(base_position);

        if(block_below !== null && !block_below.invisible()) {
            base_position.y += 1;
            break;
        }
    }

    gen_branch(world, base_position, 30);
}

function gen_branch(world, start_position, max_length) {
    const leaf_chance = 0.5;
    const branch_chance = 0.5;
    const target_height = 10;

    let stack = [
        {
            position: start_position,
            direction: vector(0, 1, 0),
            max_length,
            height_from_base: 0,
        }
    ];

    while(stack.length > 0) {
        const { position, direction, max_length, height_from_base } = stack.pop();

        if(max_length <= 0 || (height_from_base >= 2 && direction.y < 0)) {
            generate_leaf(world, position, direction);
        }
        else {
            if(Math.random() < leaf_chance) {
                const new_direction = rotate_random(direction);

                generate_leaf(world, position.clone().add(new_direction), new_direction);
            }

            if(Math.random() < branch_chance) {
                const up_bias = Math.max(0, 1 - height_from_base / target_height);

                let new_direction = null;

                if(Math.random() < up_bias) {
                    if(direction.y === 0) { // Don't branch if we're already going up or down
                        new_direction = vector(0, 1, 0);
                    }
                }
                else {
                    new_direction = rotate_random(direction);
                }

                if(new_direction !== null) {
                    stack.push(
                        {
                            position: position.clone().add(new_direction),
                            direction: new_direction,
                            max_length: max_length / 2 - 1,
                            height_from_base: height_from_base + new_direction.y
                        }
                    );
                }
            }

            world.set_at(position, wood);
            
            stack.push({
                position: position.clone().add(direction),
                direction,
                max_length: max_length - random(2) - 1,
                height_from_base: height_from_base + direction.y,
            });
        }
    }

}

function rotate_random(direction) {
    let current_direction_idx = 0;

    if(direction.y !== 0) {
        current_direction_idx = 1;
    }
    else if(direction.z !== 0) {
        current_direction_idx = 2;
    }

    let new_direction_idx = random(2);

    if(new_direction_idx >= current_direction_idx) {
        new_direction_idx += 1;
    }

    const sign = random(2) * 2 - 1; // Randomly chosen: sign = -1 or sign = 1

    let new_direction;

    if(new_direction_idx == 0) {
        new_direction = vector(sign, 0, 0);
    }
    else if(new_direction_idx == 1) {
        new_direction = vector(0, sign, 0);
    }
    else {
        new_direction = vector(0, 0, sign);
    }

    return new_direction;
}

function generate_leaf(world, position, direction) {
    world.set_at(position, leaf);

    const opposite_direction = direction.clone().multiplyScalar(-1);

    let directions = face_directions_xyz.slice();
    const idx = face_directions.findIndex(v => !v.equals(opposite_direction));

    directions.splice(idx * 3, 3);

    let block_pos = vector(0, 0, 0);
    
    for(let i = 0; i < 5; i++) {
        block_pos.x = directions[i * 3 + 0] + position.x;
        block_pos.y = directions[i * 3 + 1] + position.y;
        block_pos.z = directions[i * 3 + 2] + position.z;

        world.set_at(block_pos, leaf);
    }

}

function gen_tree_old(world, base_position) {
    let trunk_position = base_position;

    for(let i = 0; i < 10; i++) {
        world.set_at(trunk_position, wood);

        trunk_position = trunk_position.clone().add(vector(0, 1, 0));
    }

    gen_branch(world, trunk_position, 40);
    gen_branch(world, trunk_position, 40);
    gen_branch(world, trunk_position, 40);
}

function gen_branch_old(world, base_position, max_depth) {
    if(max_depth <= 0) {
        world.set_at(base_position, leaf);
        return;
    }

    const directions = faces.map(face_to_direction);

    const leaf_count = random(3);

    branches = random(4) + 1;

    world.set_at(base_position, wood);

    for(let branch_index = 0; branch_index < branches; branch_index++) {
        const i = random(directions.length);

        const direction = directions[i];
        directions.splice(i, 1);

        gen_branch(world, base_position.clone().add(direction), max_depth - random(2) - 1);
    }

    for(let leaf_index = 0; leaf_index < leaf_count; leaf_index++) {                     
        const i = random(directions.length);                                            
                                                                                           
        direction = directions[i];                                                   
        directions.splice(i, 1);                                                     
                                                                                     
        gen_branch(world, base_position.clone().add(direction), -1);                 
    }  
}

