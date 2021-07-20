function gen_trees(chunk) {
    const forest_noise = new MaasNoise(Chunk.size.x / 64, Chunk.size.z / 64);
    
    const tree_attempts_count = Chunk.size.x * Chunk.size.z / 128;

    for(let tree_id = 0; tree_id < tree_attempts_count; tree_id++) {
        const considered_location = vector(random(Chunk.size.x), Chunk.size.y, random(Chunk.size.z));

        const tree_chance = forest_noise.value_at(considered_location.x / 64, considered_location.z / 64);
        
        if(Math.random() < tree_chance) {
            gen_tree(chunk, considered_location);
        }
    }
}


function gen_tree(chunk, base_position) {
    while(true) {
        base_position.y -= 1;

        if(base_position.y < 0) {
            return;
        }

        const block_below = chunk.get_at(base_position);

        if(block_below !== null && !block_below.invisible()) {
            base_position.y += 1;
            break;
        }
    }

    gen_branch(chunk, base_position, vector(0, 1, 0), 20, 0);
}

function gen_branch(chunk, current_position, direction, max_length, height_from_base) {
    if(max_length <= 0 || (height_from_base >= 2 && direction.y < 0)) {
        // chunk.set_at(current_position, leaf);
        generate_leaf(chunk, current_position, direction);
        return;
    }

    const leaf_chance = 0.5;
    const branch_chance = 0.3;
    const target_height = 10;
    const min_height = 4;

    if(Math.random() < leaf_chance) {
        const new_direction = rotate_random(direction);

        gen_branch(chunk, current_position.clone().add(new_direction), new_direction, 0, height_from_base + new_direction.y);
    }

    if(Math.random() < branch_chance) {
        const up_bias = Math.max(0, 1 - height_from_base / target_height);

        let new_direction = null;

        if(Math.random() < up_bias) {
            if(direction.y === 0) { // Don't branch if we're already going up or down
                new_direction = vector(0, 1, 0);
                // gen_branch(chunk, current_position.clone().add(up), up, max_length / 2 - 1, height_from_base + up.y);
            }
        }
        else {
            new_direction = rotate_random(direction);
        }

        if(new_direction !== null) {
            gen_branch(
                chunk,
                current_position.clone().add(new_direction),
                new_direction,
                max_length / 2 - 1,
                height_from_base + new_direction.y
            );
        }
    }

    chunk.set_at(current_position, wood);
    
    gen_branch(chunk, current_position.clone().add(direction), direction, max_length - random(2) - 1, height_from_base + direction.y);
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

function generate_leaf(chunk, position, direction) {
    chunk.set_at(position, leaf);

    const opposite_direction = direction.clone().multiplyScalar(-1);

    for(const new_direction of face_directions) {
        if(!new_direction.equals(opposite_direction)) {
            chunk.set_at(position.clone().add(new_direction), leaf);
        }
    }
}

function gen_tree_old(chunk, base_position) {
    let trunk_position = base_position;

    for(let i = 0; i < 10; i++) {
        chunk.set_at(trunk_position, wood);

        trunk_position = trunk_position.clone().add(vector(0, 1, 0));
    }

    gen_branch(chunk, trunk_position, 40);
    gen_branch(chunk, trunk_position, 40);
    gen_branch(chunk, trunk_position, 40);
}

function gen_branch_old(chunk, base_position, max_depth) {
    if(max_depth <= 0) {
        chunk.set_at(base_position, leaf);
        return;
    }

    const directions = faces.map(face_to_direction);

    const leaf_count = random(3);

    branches = random(4) + 1;

    chunk.set_at(base_position, wood);

    for(let branch_index = 0; branch_index < branches; branch_index++) {
        const i = random(directions.length);

        const direction = directions[i];
        directions.splice(i, 1);

        gen_branch(chunk, base_position.clone().add(direction), max_depth - random(2) - 1);
    }

    for(let leaf_index = 0; leaf_index < leaf_count; leaf_index++) {                     
        const i = random(directions.length);                                            
                                                                                           
        direction = directions[i];                                                   
        directions.splice(i, 1);                                                     
                                                                                     
        gen_branch(chunk, base_position.clone().add(direction), -1);                 
    }  
}

