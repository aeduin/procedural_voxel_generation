class Array3D {
    constructor(size) {
        this.data = new Array(size.x * size.y * size.z);
        this.size = size;
    }

    position_to_index(position) {
        return (position.x * this.size.y + position.y) * this.size.z + position.z;
    }

    in_bounds(position) {
        return !(
            position.x < 0 ||
            position.x >= this.size.x ||
            position.y < 0 ||
            position.y >= this.size.y ||
            position.z < 0 ||
            position.z >= this.size.z
        );
    }

    get_at(position) {
        if(!this.in_bounds(position)) {
            return null;
        }

        return this.data[this.position_to_index(position)];
    }

    set_at(position, new_value) {
        if(!this.in_bounds(position)) {
            return false;
        }
        else {
            this.data[this.position_to_index(position)] = new_value;
            return true;
        }
    }

    *iter_indices() {
        let result = vector(0, 0, 0);
        const max = this.size.clone().subScalar(1);

        for(result.x = 0; result.x < this.size.x; result.x++) {
            for(result.y = 0; result.y < this.size.y; result.y++) {
                for(result.z = 0; result.z < this.size.z; result.z++) {
                    yield result;
                }
            }
        }
    }
}

const vector = (x, y, z) => new THREE.Vector3(x, y, z);

const vector_as_array = ({x, y, z}) => [x, y, z];
THREE.Vector3.prototype.as_array = function() { return vector_as_array(this) }

THREE.Vector3.prototype.moduloScalar = function(m) {
    this.x %= m;
    this.y %= m;
    this.z %= m;
    return this;
}

THREE.Vector3.prototype.modulo = function(v) {
    this.x %= v.x;
    this.y %= v.y;
    this.z %= v.z;
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


