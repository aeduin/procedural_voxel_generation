function raycast(chunk, smaller_corner, greater_corner, direction, max_length) {
    console.log('direction =', direction);

    let distance_travelled = 0;

    const is_positive = n => n < 0 ? 0 : 1;

    const direction_is_positive = vector(is_positive(direction.x), is_positive(direction.y), is_positive(direction.z));

    // let position = vector(0, 0, 0);
    let smaller_position = smaller_corner.clone();
    let greater_position = greater_corner.clone();

    // position.add(
    //     greater_corner.clone().multiply(
    //         direction_is_positive
    //     )
    // );
    // position.add(
    //     smaller_corner.clone().multiply(
    //         vector(1, 1, 1).sub(direction_is_positive.clone())
    //     )
    // );
    
    let last_direction_idx = 0;

    function min_move_length(position) {
        const distance_to_next_block =
            position.clone()
            .modulo(1)
            .multiplyScalar(-1)
            .add(direction_is_positive)
            .abs()
        ;

        const path_to_next_block_length = distance_to_next_block.clone().divide(direction).abs();
        
        return min(path_to_next_block_length.as_array().map(i => i === 0 ? 1 : i));


    }

    while(true) {
        console.log('positions =', smaller_position, greater_position);

        // if(isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
        //     console.log('oops position');
        // }

        floored_smaller_position = smaller_position.clone().add(direction.clone().multiplyScalar(0.001)).floor();
        floored_greater_position = greater_position.clone().floor();

        let check_at = vector(0, 0, 0);

        for(check_at.x = floored_smaller_position.x; check_at.x <= greater_position.x; check_at.x++) {
            for(check_at.y = floored_smaller_position.y; check_at.y <= greater_position.y; check_at.y++) {
                for(check_at.z = floored_smaller_position.z; check_at.z <= greater_position.z; check_at.z++) {
                    console.log('check_at =', check_at);
                    const block_here = chunk.get_at(check_at)

                    if(block_here !== null && block_here.solid()) {
                        console.log('hit block after travelling ', distance_travelled);
                        return { hit_block: true, distance_travelled, last_direction_idx };
                    }
                }
            }
        }

        let min_1 = min_move_length(smaller_position);
        let min_2 = min_move_length(greater_position);


        let move_length = min_1.value;
        last_direction_idx = min_1.idx;
        if(min_2.value < min_1.value) {
            move_length = min_2.value;
            last_direction_idx = min_2.idx;
        }

        console.log('move_length =', move_length);
        distance_travelled += move_length;

        if(distance_travelled > max_length) {
            return { hit_block: false, distance_travelled: max_length };
            // last_iteration = true;
        }
        console.log('move_length =', move_length);
        const move = direction.clone().multiplyScalar(move_length);

        if(isNaN(move.x) || isNaN(move.y) || isNaN(move.z)) {
            console.log('oops move');
        }
        // position.add(move);
        smaller_position.add(move);
        greater_position.add(move);
    }
}
