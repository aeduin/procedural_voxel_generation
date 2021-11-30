if(debug) {
    let test_ranges = [1024, air];

    insert_range(test_ranges, 5, 10, stone);
    insert_range(test_ranges, 11, 13, stone);
    insert_range(test_ranges, 15, 15, stone);
    insert_range(test_ranges, 14, 14, stone);
    
    if(
        test_ranges[0] !== 4 ||
        !test_ranges[1].equals(air) ||
        test_ranges[2] !== 15 ||
        !test_ranges[3].equals(stone) ||
        test_ranges[4] !== 1024 ||
        !test_ranges[5].equals(air) ||
        test_ranges.length > 6
    ) {
        throw Error("test range is incorrect");
    }
}
