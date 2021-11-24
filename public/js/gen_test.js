function gen_random(chunk) {
    for(let i = 0; i < 10000; i++) {
        x = Math.floor(Math.random() * chunk_size.x);
        y = Math.floor(Math.random() * chunk_size.y);
        z = Math.floor(Math.random() * chunk_size.z);

        r_type = Math.random();
        
        let block;

        if(r_type < 0.333) {
            block = new Stone();
        }
        else if(r_type < 0.667) {
            block = new Dirt();
        }
        else {
            block = new Sand();
        }

        chunk.set_at(vector(x, y, z), block);
    }
}
