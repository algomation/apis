/*globals $, _, algo, ok, test */

module("algo.array tests");


test("isEmptyArray", function () {

    // test array types

    ok(algo.array.isEmptyArray([]), "Passed");

    // test some non array types

    ok(!algo.array.isEmptyArray(arguments), "Passed");

    ok(!algo.array.isEmptyArray(null), "Passed");

    ok(!algo.array.isEmptyArray(void 0), "Passed");

    ok(!algo.array.isEmptyArray(123), "Passed");

    ok(!algo.array.isEmptyArray("123"), "Passed");

    ok(!algo.array.isEmptyArray({}), "Passed");

    // test non empty array

    ok(!algo.array.isEmptyArray([0]), "Passed");

});

test("isArrayLengthAtLeast", function () {

    // test lengths

    ok(algo.array.isArrayLengthAtLeast([], 0), "Passed");

    ok(algo.array.isArrayLengthAtLeast([1, 2, 3, 4], 4), "Passed");

    // test failure cases

    ok(!algo.array.isArrayLengthAtLeast([], 1), "Passed");

    ok(!algo.array.isArrayLengthAtLeast([1, 2, 3, 4], 5), "Passed");


    // test some non array types with length properties

    ok(!algo.array.isArrayLengthAtLeast(arguments, 0), "Passed");

    ok(!algo.array.isArrayLengthAtLeast({length: 0}, 0), "Passed");

    ok(!algo.array.isArrayLengthAtLeast([]), "Passed");

});

test("fill", function () {

    function fillTest(a, start, end, value) {

        for (var i = start; i < end; i += 1) {

            if (a[i] !== value) {
                return false;
            }

            return true;
        }
    }

    // test without step

    var a = new Uint32Array(100);

    algo.array.fill(a, 0, a.length, 0xcccc);

    ok(fillTest(a, 0, a.length, 0xcccc), "Passed");

    algo.array.fill(a, 50, a.length, 0x5555);

    ok(fillTest(a, 0, 50, 0xcccc), "Passed");

    ok(fillTest(a, 50, a.length, 0x5555), "Passed");

    // test with step

    algo.array.fill(a, 0, a.length, 1000, 1);

    var errors = 0;

    for (var i = 0; i < a.length; i += 1) {

        if (a[i] != 1000 + i) {
            errors++;
        }
    }

    ok(errors == 0, "passed");

});

test("randomize", function () {

    var a = [];

    // 10000 elements between 100 - 200

    algo.array.randomize(a, 0, 10000, 11, 100, 200);

    var errors = 0;

    for (var i = 0; i < 10000; i += 1) {

        if (a[i] < 100 || a[i] > 200) {
            errors++;
        }
    }

    ok(errors === 0, "Passed");

    a.length = 0;
});

test("reverse", function () {

    // 1000 zeros

    var a = new Int32Array(1000);

    // set last 500 to 0,1,2,3 etc

    for (var i = 0; i < 500; i += 1) {
        a[500 + i] = i;
    }

    // reverse the 500 items

    algo.array.reverse(a, 500, 1000);

    // verify

    var errors = 0;

    for (var i = 0; i < 500; i += 1) {

        if (a[500 + i] != (499 - i)) {
            errors++;
        }
    }

    ok(errors === 0, "Passed");

    a.length = 0;
});

test("swap", function () {

    var a = [];

    a[0] = 1234;

    a[1] = 4567;

    algo.array.swap(a, 0, 1);

    ok(a[0] == 4567, "Passed");

    ok(a[1] == 1234, "Passed");
});

test("isSortedLowToHigh", function () {

    var a = new Int32Array(1000);

    algo.array.fill(a, 0, a.length, 0, 1);

    // test using native comparison

    ok(algo.array.isSortedLowToHigh(a, 0, a.length), "Passed");

    // test using custom comparison

    ok(algo.array.isSortedLowToHigh(a, 0, a.length, function (a, b) {

        if (a == b) return 0;

        if (a < b) return -1;

        return 1;

    }), "Passed");

    // now reverse and the test should fail

    algo.array.reverse(a, 0, a.length);

    // test using native comparison

    ok(!algo.array.isSortedLowToHigh(a, 0, a.length), "Passed");

    // test using custom comparison

    ok(!algo.array.isSortedLowToHigh(a, 0, a.length, function (a, b) {

        if (a == b) return 0;

        if (a < b) return -1;

        return 1;

    }), "Passed");
});

test("shuffle", function () {

    // create a deck of 52 cards

    var a = new Int32Array(52);

    // fill with 0 -> 51

    algo.array.fill(a, 0, a.length, 0, 1);

    // shuffle

    algo.array.shuffle(a, 0, a.length, Date.now());

    // count the number of items that are in their initial positions

    var k = 0;

    for (var i = 0; i < a.length; i += 1) {

        if (a[i] == i) {
            k++;
        }
    }

    // we expect k to be very small

    ok(k < 10, "Passed");
});

test("algo.compare tests", function () {

    ok(algo.array.compare([1, 2, 3], [1, 2, 3], 0, 0, 3), "passed");

    ok(!algo.array.compare([0, 0, 0, 1, 2, 3], [0, 0, 0, 4, 5, 6], 3, 3, 3), "passed");

    ok(algo.array.compare(["ABC", "XYZ"], ["ABC", "XYZ"], 0, 0, 2), "passed");

    var v1 = {
        value: 3.14
    }

    var v2 = {
        value: 3.14
    }

    ok(algo.array.compare([v1, v1, v1], [v2, v2, v2], 0, 0, 3, function (a, b) {

        return a.value - b.value;
    }));

    v2.value = 0;

    ok(!algo.array.compare([v1, v1, v1], [v2, v2, v2], 0, 0, 3, function (a, b) {

        return a.value - b.value;
    }));
});

module("algo.sort tests");


test("quicksort", function () {

    var a = new Int32Array(100);

    algo.array.randomize(a, 0, a.length, Date.now(), 0, 1000);

    algo.core.quickSortArray(a, 0, a.length - 1);

});

test("mergeSort", function () {

    var a = [];

    algo.array.randomize(a, 0, 100, Date.now(), 0, 1000);

    var sorted = algo.core.mergeSortArray(a);
});

module("algo.search tests");


test("binarySearch", function () {

    // create sorted array

    var a = new Int32Array(10);

    algo.array.fill(a, 0, a.length, 0, 1);

    // test value outside and inside the range

    for (var i = -a.length; i < a.length * 2; i += 1) {

        if (i >= 0 && i < a.length) {

            ok(algo.search.binarySearch(a, i) !== null, "Passed");

        } else {

            ok(algo.search.binarySearch(a, i) === null, "Passed");
        }
    }
});

module("algo.core tests");

test("factorial", function () {

    ok(algo.core.factorial(1) === 1, "passed");

    ok(algo.core.factorial(4) === 24, "passed");

    ok(algo.core.factorial(3) === 6, "passed");

});

test("permutations generator", function () {

    // create a generator for 4!

    var p = algo.core.permutations(4);

    // collect all the permutations and test that none is like any other and they contain 0..3


    var y = p.next();

    var a = [];

    while (!y.done) {

        a.push(y.value);

        y = p.next();

    }

    // number of permutations should === 4!

    ok(algo.core.factorial(4) === a.length, "passed");

    // check that each array contains 0..3 in some order

    for (var i = 0; i < a.length; i += 1) {

        ok(a[i].length === 4, "passed");

        ok(a[i].indexOf(0) >= 0, "passed");

        ok(a[i].indexOf(1) >= 0, "passed");

        ok(a[i].indexOf(2) >= 0, "passed");

        ok(a[i].indexOf(3) >= 0, "passed");

    }

});


