function gen_tree(chunk, base_position) {
    let trunk_position = base_position;

    for(let i = 0; i < 10; i++) {
        chunk.set_at(trunk_position, new Wood());

        trunk_position = trunk_position.clone().add(vector(0, 1, 0));
    }

    gen_branch(chunk, trunk_position, 40);
    gen_branch(chunk, trunk_position, 40);
    gen_branch(chunk, trunk_position, 40);
}

function gen_branch(chunk, base_position, max_depth) {
    if(max_depth <= 0) {
        chunk.set_at(base_position, new Leaf());
        return;
    }

    const directions = faces.map(face_to_direction);

    const leaf_count = random(3);

    branches = random(4) + 1;

    chunk.set_at(base_position, new Wood());

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

