/*
 The MIT License (MIT)

 Copyright (c) 2014 Duncan Meech / Algomation

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */

/*globals _*/
"use strict";


//Core classes and methods.
//-------------------------

// All the classes and libraries accessible to your algorithms lives within the 'algo' namespace object e.g. algo.Element etc
var algo = algo || {};

/**
 * @namespace algo.core
 */
algo.core = {};

/**
 * This is the most basic way to implement class inheritance in JavaScript.
 * The prototype property of the progeny class ( the new class ) is simply copied from the prototype property
 * if the progenitor class ( the base class ). After that we simple ensure that the correct constructor
 * function is called when creating new instances of progeny.
 *
 * @param {Function} progenitor - the base class ( constructor )
 * @param {Function} progeny - the extended ( inheriting ) class ( constructor )
 */
algo.core.extends = function (progenitor, progeny) {

    /* progeny is prototyped from its progenitor */
    progeny.prototype = Object.create(progenitor.prototype);

    /* make the constructor for the progeny references itself and not the progenitor constructor */
    progeny.prototype.constructor = progeny;

};

/**
 * Compare two items ( of the same type ) using either the supplied comparison function or the javascript ===/< operators
 *
 * @param {Object|number|string} a - first of two objects to compare
 * @param {Object|number|string} b - second of two objects to compare
 * @param {Function} [comparator] - optional function for comparing a and b
 * @returns {number}
 */
algo.core.compareItems = function (a, b, comparator) {

    // use compare function if provided
    if (comparator) {
        return comparator(a, b);
    }

    // use javascript built in comparison
    if (a === b) return 0;
    if (a < b) return -1;
    return 1;
};

/**
 * returns true if the object is an array of zero length
 * @param {Array} a - the array to test
 * @returns {boolean}
 */
algo.core.isEmptyArray = function (a) {

    return _.isArray(a) && a.length === 0;
};

algo.core.isArrayLengthAtLeast = function (a, length) {

    return _.isArray(a) && a.length >= length;

};

/**
 * fill the array with random values between min and max using the optional random number seed
 * @param {Array} a
 * @param {number} min
 * @param {number} max
 * @param {number} [seed] - optional seed
 * @returns {Array}
 */
algo.core.randomizeArray = function (a, min, max, seed) {

    var r = algo.core.randomInteger(min, max, algo.core.random(seed));
    for (var i = 0; i < a.length; i += 1) {
        a[i] = r();
    }

    return a;
};

/**
 * fill the array with values starting a zero and incrementing by step or zero if not supplied.
 * @param {Array} a
 * @param {number} value
 * @param {number} [step] - optional increment to add to value each time
 * @returns {*}
 */
algo.core.fillArray = function (a, value, step) {

    var s = step || 0;
    for (var i = 0; i < a.length; i += 1) {
        a[i] = value;
        value += s;
    }
    return a;
};

/**
 * create a multi-dimensional array, where the length of each dimension is specified by one of the arguments
 * e.g.
 * var a = createMD(2,2,2); a[1][1][1] = 3.14;
 * var a = createMD(1,2,3,4); a[0][1][2][3] = "1234";
 * @param (...dimensions) - zero to n dimensions for the array
 * @return {Array}
 */
algo.core.createMultiArray = function () {

    /**
     * @param {Array} a - the array to fill with zero or another dimension
     * @private
     */
    function createArrayInternal(a) {

        for (var i = 0; i < arguments[1]; i += 1)
            if (arguments.length === 2) a[i] = 0;
            else {
                a[i] = createArrayInternal.apply(this, [[]].concat(_.toArray(arguments).slice(2)));
            }
        return a;
    }

    return createArrayInternal.apply(this, [[]].concat(_.toArray(arguments)));
};

/**
 * return a new array with the given subsection of the array start->end-1
 * @param {Array} a
 * @param {number} [start] - optional, zero if not supplied
 * @param {number} [end] - optional, length of array if not supplied
 * @returns {Array}
 */
algo.core.copyArray = function (a, start, end) {

    var s = start || 0, e = end || a.length;
    return a.slice(s, e);
};

/**
 * return a new array with the first values from a
 * @param {Array} a
 * @param {number} n
 * @returns {Array}
 */
algo.core.copyArrayStart = function (a, n) {

    return a.slice(0, n);
};

/**
 * return a new array with the last n values from a
 * @param {Array} a
 * @param {number} n
 * @returns {Array}
 */
algo.core.copyArrayEnd = function (a, n) {

    return a.slice(-n);
};

/**
 * reverse the subsection of the array or the entire array if start, end not supplied
 * @param a
 * @param start
 * @param end
 */
algo.core.reverseArray = function (a, start, end) {

    var s = start || 0, e = end || a.length;
    while (start < end) {
        algo.core.swapArray(a, start++, --end);
    }
};

/**
 * swap two elements in an array
 * @param {Array} a
 * @param {number} x
 * @param {number} y
 */
algo.core.swapArray = function (a, x, y) {

    var temp = a[x];
    a[x] = a[y];
    a[y] = temp;
};

/**
 * swap the property p of objects a and b
 * @param p
 * @param a
 * @param b
 */
algo.core.swapProperties = function (p, a, b) {

    var temp = a[p];
    a[p] = b[p];
    b[p] = temp;
};

/**
 * fisher yates shuffle of an array, defer implemention to underscore
 * @param a
 * @returns {*}
 */
algo.core.shuffleArray = function (a) {

    return _.shuffle(a);
};

/**
 * Compare arrays values and length. Unequal length arrays are considered different
 * @param {Array} a - first array to compare
 * @param {Array} b - second array to compare
 * @param {Function} [comparator] - optional comparator function
 * @returns {boolean}
 */
algo.core.compare = function (a, b, comparator) {

    // if either of the objects is not an array or the lengths don't match we return false
    if (!_.isArray(a) || !_.isArray(b) || a.length !== b.length) {
        return false;
    }

    // iterate over the subsection
    for (var i = 0; i < a.length; i += 1) {

        var comp = algo.core.compareItems(a[i], b[i], comparator);
        if (comp !== 0) {
            return false;
        }
    }
    return true;
};

/**
 * Perform a binary search on the given array for the value, using the optional comparator.
 * If searching for zero, empty strings or other falsey objects you will need to compare against null  e.g.
 *
 * if (_.isNull(algo.core.binarySearchArray(a, 0))) { //not found }
 *
 * @param {Array} a
 * @param {*} v - the object/value to search for
 * @param {Function} [c] - optional comparator
 * @returns {*}
 */
algo.core.binarySearchArray = function (a, v, c) {

    // if not an array or empty then return null
    if (algo.core.isEmptyArray(a)) {
        return null;
    }

    // start narrowing down from both ends of the array
    var left = 0, right = a.length - 1;

    // while there are still locations to search
    while (left <= right) {

        // find mid-point of current range. Use the >> 1 to divide by two to ensure an integer result
        var mid = (left + right) >> 1;

        // compare items using native comparisons or use supplied function
        var compareResult = algo.core.compareItems(v, a[mid], c);

        // if we found the item return it
        if (compareResult === 0) {
            return v;
        }

        // select the left or right half of the current section for further searching
        if (compareResult < 0) {
            right = mid - 1;
        } else {
            left = mid + 1;
        }
    }

    // if we get here we didn't find the item
    return null;
};

/**
 * In place quickSort (partition sort). Call with 0, array.length to sort the entire array, or provide a sub section
 * to sort.
 * @param {Array} a - the array to sort
 * @param {number} start - start of section to sort
 * @param {number} end - end of section to sort
 * @param {Function} [comparator] - optional comparator for items
 */
algo.core.quickSortArray = function (a, start, end, comparator) {

    // partition the subsection and get the index of the pivot point
    var pivot = algo.core.quickSortPartition(a, 0, a.length, comparator);

    // partition and sort the the subsection to the left of pivot
    algo.core.quickSortArray(a, start, pivot - 1, comparator);

    // partition and sort the subsection to the right of pivot
    algo.core.quickSortArray(a, pivot + 1, end, comparator);

};
/**
 * internal partition method for quickSort
 * @param a
 * @param left
 * @param right
 * @param comparator
 * @returns {*}
 * @private
 */
algo.core.quickSortPartition = function (a, left, right, comparator) {

    // use i and j to walk toward through the section swapping items as necessary.
    // NOTE: i is pre-incremented and j is pre-decremented inside the inner loop
    // so there initialized values and outside the range to be divided. Since we don't want to
    // divide the pivot value itself j is initialized to right so that right-1 is the first value
    // considered for swapping

    var i = left;       // i index is left edge of subsection of array we are partitioning
    var j = right;      // j is the end of subsection, pre-decrement so it skips the partition index
    var v = a[right];   // v is the value we are going to partition around

    // repeat until i and j meet, which could be anywhere between i -> j
    while (true) {

        // set i to point to a value >= the pivot

        while (algo.core.compareItems(a[i], v, comparator) < 0) {
            i += 1;
        }

        // set j to point to a value less than the pivot being careful to abort if i and j meet.
        while (algo.core.compareItems(v < a[--j]) < 0) {
            if (i >= j) break;
        }

        // if i and j didn't meet then we need to swap the values at i and j
        if (i >= j) {
            break;
        }

        algo.core.swapArray(a, i, j);
    }

    // finally, i points to the correct location to insert the pivot at. The current value at i belongs in the
    // right half of the array so the swap ensures the array is now partitioned around index i
    algo.core.swapArray(a, i, right);

    // return the pivot location so that we can make recursive calls to refine the sorting in each remaining half
    // of the array
    return i;

};

/**
 * Merge sort the entire array.
 * NOTE: This is not an in place merge sort and is therefore not optimal. Also it always sorts the entire array.
 * Use quickSort for a more space efficient algorithm or when you want to sort a sub section of the array.
 * NOTE: This method only works with native Array types since it uses slice on the array
 * @param {Array} a - the array to sort
 * @returns {Array} - a new sorted array
 */
algo.core.mergeSortArray = function (a) {

    // if the array is not sortable then just return a copy of the array

    if (!algo.core.isArrayLengthAtLeast(a, 2)) {

        return a.slice();
    }

    // select a pivot in the middle of the array

    var pivot = a.length >> 1;

    // merge sort the left half

    var left = algo.core.mergeSortArray(a.slice(0, pivot));

    // merge sort the right half

    var right = algo.core.mergeSortArray(a.slice(pivot));

    // merge the left and right half together and return it

    return algo.core.merge(left, right);

};

/**
 * The merge function for algo.core.mergeSort
 *
 * @param {Array} a - the first array to merge
 * @param {Array} b - the second array to merge
 * @returns {Array} - the sorted combination of a + b
 * @private
 */
algo.core.merge = function (a, b) {

    // initialize an index into both array and create a results array

    var ai = 0, bi = 0, results = [];

    // while there are still items remaining in a AND b

    while (ai < a.length && bi < b.length) {

        // take the lower value from either a or b

        if (a[ai] < b[bi]) {
            results.push(a[ai++]);
        } else {
            results.push(b[bi++]);
        }
    }

    // combine the results array with any remaining elements in a and b

    return results.concat(a.slice(ai)).concat(b.slice(bi));
};

/**
 * recursive method for calculating the factorial of a positive integer
 * @param {number} n - a positive integer
 * @returns {number}
 */
algo.core.factorial = function (n) {

    // factorial 1,0 is 1, not defined for negative numbers but we treat as 1
    if (n <= 1) {
        return 1;
    }

    // this procedure is not as fast as for loop but it is a nice example of
    // inductive / recursive reasoning...since n! = n * (n-1)!
    return n * algo.core.factorial(n - 1);
};

/**
 * degrees to radian conversion
 * @param {number} d
 * @returns {number}
 */
algo.core.degreesToRadians = function (d) {
    return d * (Math.PI / 180);
};

/**
 * radians to degree conversion
 * @param {number} r
 * @returns {number}
 */
algo.core.radiansToDegrees = function (r) {
    return r * (180 / Math.PI);
};

// Return a point at **degrees** rotation from 0, on the circumference of a circle centered at **cx** and **cy**
// and with the given **radius**
algo.core.pointOnCircle = function (cx, cy, radius, degrees) {

    return algo.core.pointOnEllipse(cx, cy, radius, radius, degrees);
};

/**
 * returns a point on an ellipse centered at cx/cy with given x/y radius.
 * @param {number} cx
 * @param {number} cy
 * @param {number} radiusX
 * @param {number} radiusY
 * @param {number} degrees
 * @returns {{x:number, y:number}}
 */
algo.core.pointOnEllipse = function (cx, cy, radiusX, radiusY, degrees) {

    // invert negative degrees and clamp degrees from 0..359.9999
    var d = degrees < 0 ? 360 + (degrees % 360) : (degrees % 360);

    return {
        x: cx + radiusX * Math.cos(algo.core.degreesToRadians(d)),
        y: cy + radiusY * Math.sin(algo.core.degreesToRadians(d))
    };

};

/**
 * a predictable random number generator. You can either use a replacement for Math.random or just
 * monkey patCh Math.random e.g. Math.random = algo.core.random();
 * Large, prime numbers are the best seed but anything > 0 will work
 * This method returns random number generator, not a random number!
 * e.g.
 *
 * var r = algo.core.random();
 * var x = r();
 *
 * @param seed
 * @returns {random}
 */
algo.core.random = function (_seed) {

    // seeds <= zero are not acceptable seed is also optional so use a constant if not provided.

    var seed = (_seed < 0 ? _seed * -1 : _seed) || 12347;

    function random() {

        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280.0;
    }

    return random;
};

/**
 * returns a generator for random integers in the range min -> max - 1
 * It make it predictable supply algo.core.random() or it will use Math.random()
 * For example to generate random array indices...
 * var a = [1,2,3,4,5,6,7,8,9,10];
 * var r = algo.core.randomInteger(0, a.length);
 * @param {number} min
 * @param {number} max
 * @param {Function} [_rgen ]- a function that returns a random number between 0..1
 * @returns {Function}
 */
algo.core.randomInteger = function (_min, _max, _rgen) {

    var rgen = _rgen || Math.random;
    var max = _max;
    var min = _min;

    function random() {

        return (min + rgen() * (max - min)) >> 0;
    }

    return random;
};

/**
 * returns a generator for random floats in the range min -> max - 1
 * It make it predictable supply algo.core.random() or it will use Math.random()
 * For example to generate random array indices...
 * var a = [1,2,3,4,5,6,7,8,9,10];
 * var r = algo.core.randomInteger(0, a.length);
 * @param {number} min
 * @param {number} max
 * @param {Function} [_rgen ]- a function that returns a random number between 0..1
 * @returns {Function}
 */
algo.core.randomFloat = function (_min, _max, _rgen) {

    var rgen = _rgen || Math.random;
    var max = _max;
    var min = _min;

    function random() {

        return (min + rgen() * (max - min));
    }

    return random;
};

/**
 * although JavaScript strings have array like properties they are not true arrays. This returns
 * the string as a native array
 * @param {string} s
 * @returns {Array|*}
 */
algo.core.stringToArray = function (s) {
    return s.split('');
};

/**
 * One of several ways to reverse a string in javascript. Works by first splitting into an array of
 * strings of length 1 ( since javascript does not have a char type ) and then reverse the array
 * and join back together as a string.
 * @param {string} s - the string to reverse
 * @returns {string} s reversed
 */
algo.core.reverseString = function (s) {

    return s.split('').reverse().join('');
};

/**
 * sort the string using the standard lexographical order e.g. "Seven minus Two is 5!" returns "    !5STeeiimnnossuvw"
 * @param s
 * @returns {*}
 */
algo.core.sortLetters = function (s) {

    if (s) {
        var a = s.split('');
        a.sort();
        return a.join('');
    }
    return null;
};

/**
 * return true if obj has all the properties in the variable argument list
 * @param obj
 * @param (...properties) - properties to test
 */
algo.core.hasProperties = function (obj) {

    for (var i = 1; i < arguments.length; i += 1) {
        if (!_.has(obj, arguments[i])) {
            return false;
        }
    }

    return true;
};

/**
 * return true if obj has any of the properties in the variable argument list
 * @param obj
 * @param (...properties) - properties to test
 */
algo.core.hasAny = function (obj) {

    for (var i = 1; i < arguments.length; i += 1) {
        if (_.has(obj, arguments[i])) {
            return true;
        }
    }

    return false;
};

/**
 * true if the obj has point line properties ( x/y )
 * @param {object} - the object to test
 * @returns {boolean}
 */
algo.core.isPointLike = function (obj) {

    return algo.core.hasProperties(obj, 'x', 'y');
};

/**
 * true if the obj has line properties ( x1/y1/x2/y2 )
 * @param {object} - the object to test
 * @returns {boolean}
 */
algo.core.isLineLike = function (obj) {

    return algo.core.hasProperties(obj, 'x1', 'y1', 'x2', 'y2');
};

/**
 * true if the obj has rectangle line properties ( x/y/w/h )
 * @param {object} - the object to test
 * @returns {boolean}
 */
algo.core.isRectLike = function (obj) {

    return algo.core.hasProperties(obj, 'x', 'y', 'w', 'h');
};

/**
 * true if the obj has circle like properties ( x/y/radius )
 * @param {object} - the object to test
 * @returns {boolean}
 */
algo.core.isCircleLike = function (obj) {

    return algo.core.hasProperties(obj, 'x', 'y', 'radius');
};

/**
 * base class for all data structure objects in Algomation. Provides helper methods for invoking methods
 * defined in our options object etc.
 * @constructor
 */
algo.core.DataStructure = function (options) {

    // save a shallow copy of the options object
    this.options = _.clone(options || {});
};

/**
 * call the named function in our options object with the arguments passed to this method
 * @param functionName
 * @param va_args...
 * @returns {*}
 */
algo.core.DataStructure.prototype.invoke = function (functionName) {

    if (this.hasFunction(functionName)) {
        var args = _.toArray(arguments).slice(1);
        return this.options[functionName].apply(this, args);
    }
    return undefined;
};

/**
 * true if our options object contains the named function
 * @param functionName
 */
algo.core.DataStructure.prototype.hasFunction = function (functionName) {

    return this.options && this.options[functionName];
};

/**
 * Generic graph class. Supports vertices and edge insertion, deletion. Multiple edge connections between vertices,
 * directed edges, self connected vertices.
 * @constructor
 */
algo.core.Graph = function (options) {

    // progenitor initialization
    algo.core.DataStructure.call(this, options);

    // set of vertices, vertex.id is the key
    this.vertices = {};

    // set of edges, edge.id is the key
    this.edges = {};

    // used to allocate unique id's to vertices and edges
    this.nextVertexId = this.nextEdgeId = 0;

};

/* Allowed formats for the graph seeding .data property
 var data = {
 'a': ['b', 'c'],
 'b': ['a', 'c'],
 'c': ['a', 'b']
 };

 var data = {
 'a': {
 label: 'a-vertex',
 edges     : ['b', 'c']
 },
 'b': ['a', 'c'],
 'c': ['a', 'b']
 };

 var data = {
 'a': {
 label: 'a-vertex',
 edges: [
 {
 'b': {label: 'a-b', weight: 1.0}
 },
 {
 'c': {label: 'a-c', weight: 0.5}
 }
 ]
 },
 'b': ['a', 'c'],
 'c': ['a', 'b']
 };
 */

/**
 * graph extends DataStructure
 */
algo.core.extends(algo.core.DataStructure, algo.core.Graph);

/**
 * add a vertex to the graph and invoke the optional callback
 * @param properties
 * @returns {algo.core.GraphVertex}
 */
algo.core.Graph.prototype.addVertex = function (properties) {

    // create the vertex with the given properties and add to the map of vertices
    var vertex = new algo.core.GraphVertex(this.nextVertexId++, properties);
    this.vertices[vertex.id] = vertex;

    // invoke the createVertex callback to obtain the element for the vertex
    vertex.element = this.invoke.call(this, 'createVertex', vertex, this);

    return vertex;
};

/**
 * remove a vertex from the graph
 * @param {algo.core.GraphVertex} vertex
 * @returns {Array} any edges that were removed in addition to the vertex that was removed
 */
algo.core.Graph.prototype.removeVertex = function (vertex) {

    // first destroy the vertex element if any, if no destroy method was provided do it ourselves
    if (vertex.element) {

        if (this.hasFunction('destroyVertex')) {
            this.invoke('destroyVertex', vertex, vertex.element, this);
        } else {
            vertex.element.destroy();
            vertex.element = null;
        }
    }

    // remove out/in edges then in edges.
    // NOTE: For self connected vertices we might process that same edge twice, so we use
    // a union to combine the out/in edges into a set

    var u = _.union(_.values(vertex.outEdges), _.values(vertex.inEdges));

    _.each(u, function (edge) {
        this.removeEdge(edge);
    }, this);

    // remove vertex itself
    delete this.vertices[vertex.id];

    // return the list of removed edges

    return u;
};

/**
 * add a new edge to the graph
 * @param source
 * @param target
 * @param properties
 * @returns {algo.core.GraphEdge}
 */
algo.core.Graph.prototype.addEdge = function (source, target, properties) {

    // create new edge
    var edge = new algo.core.GraphEdge(this.nextEdgeId++, source, target, properties);
    this.edges[edge.id] = edge;

    // get visual element if the user has supplied the appropriate callback
    edge.element = this.invoke('createEdge', edge, this);

    return edge;
};

/**
 * remove an edge from the graph. Removed references to that edge from each vertex
 * @param edge
 */
algo.core.Graph.prototype.removeEdge = function (edge) {

    // if the edge has a visual element, destroy it first, if not provided do it ourselves
    if (edge.element) {

        if (this.hasFunction('destroyEdge')) {
            this.invoke('destroyEdge', edge, edge.element, this);
        } else {
            edge.element.destroy();
            edge.element = null;
        }
    }

    // remove from edges map
    delete this.edges[edge.id];

    // remove from source/target edge sets
    delete edge.source.outEdges[edge.id];
    delete edge.target.inEdges[edge.id];
};

/**
 * helper for making pretty graphs. Remove any vertex that has no edge
 */
algo.core.Graph.prototype.removeEdgelessVertices = function () {

    _.each(this.vertices, _.bind(function(v) {

        if (_.keys(this.getVertexEdges(v)).length === 0) {

            this.removeVertex(v);
        }

    }, this));
};

/**
 * find all vertices with a given property value.
 * @param property
 * @param value
 */
algo.core.Graph.prototype.findVertices = function (property, value) {

    // search all vertices with the given property of the given value
    return _.filter(this.vertices, function (vertex) {
        return vertex[property] === value;
    }, this);
};

/**
 * return all directed edges from v1 -> v2
 * @param v1
 * @param v2
 */
algo.core.Graph.prototype.getEdges = function (source, target) {

    return _.filter(source.outEdges, function (edge) {
        return edge.target.id === target.id;
    });
};

/**
 * return true if there is an edge between source, target
 * @param source
 * @param target
 * @returns boolean
 */
algo.core.Graph.prototype.hasEdge = function (source, target) {

    return this.getEdges(source, target).length > 0;
};

/**
 * return all edges that are either in or out of the vertex
 * @param vertex
 * @return {Array} all the edges attached to this vertex regardless of direction
 */
algo.core.Graph.prototype.getVertexEdges = function (vertex) {

    // we use union to ensure that an edge connecting a vertex to itself is only present once in the list
    return _.union(_.values(vertex.outEdges), _.values(vertex.inEdges));
};

/**
 * return a set of vertices that have edges pointing at the given vertex. Since multi-edges are supported
 * we ensure a set is returned
 * @param {algo.core.GraphVertex} vertex
 * @return {Array} - array of algo.core.GraphVertex
 */
algo.core.Graph.prototype.getInVertices = function(vertex) {

    return _.uniq(_.map(vertex.inEdges, function(e) {
        return e.source;
    }, this));
};

/**
 * return a set of vertices that are connected to the given vertex by an out bound edge
 * @param {algo.core.GraphVertex} vertex
 * @return {Array} - array of algo.core.GraphVertex
 */
algo.core.Graph.prototype.getOutVertices = function(vertex) {

    return _.uniq(_.map(vertex.outEdges, function(e) {
        return e.target;
    }, this));

};

/**
 * return a set of vertices that are connected to the given vertex or vertex list by an in or out edge
 * NOTE: The list does not include the starting vertex or vertices.
 * @param {algo.core.GraphVertex | Array} vertex
 * @return {Array} - array of algo.core.GraphVertex
 */
algo.core.Graph.prototype.getAdjacentVertices = function(vertex) {

    var a = _.isArray(vertex) ? vertex : [vertex];

    var list = [];
    _.each(a, function(v) {
        list = list.concat(this.getInVertices(v)).concat(this.getOutVertices(v));
    }, this);

    // ensure the list contains only a single reference to a vertex AND that we do not include
    // an vertices in the original list
    return _.filter(_.uniq(list), function(v) {
        return a.indexOf(v) < 0;
    }, this);
};

/**
 * a useful helper function for testing and simple visualization, adds a random edge between two random vertices
 * that are not already connected in either direction
 */
algo.core.Graph.prototype.addRandomEdge = function (properties) {

    // get an array of all vertices in random order
    var vrandom = _.shuffle(_.values(this.vertices));

    // there must be at least two vertices
    if (vrandom.length < 2) {
        return null;
    }

    // try to connect the ith vertex and its successor, try all subsequent pairs. It may possible
    // that all possible edges already exist in which case we return null

    var i = 0;
    while (i < vrandom.length) {
        var j = (i + 1) % vrandom.length;
        // if there no edges connecting these two vertices then create and return the edge
        var v1 = vrandom[i], v2 = vrandom[j];
        if (this.getEdges(v1, v2).length + this.getEdges(v2, v1).length === 0) {
            return this.addEdge(v1, v2, properties);
        }
        // v1->v2 or v2->v1 already exists, so try next pair
        i += 1;
    }

    // if here no possible could be created

    return null;
};

/**
 * return a list of list of vertices where each sublist defines a discrete/connected component of the graph.
 * The components are sorted according to size with the largest components first.
 */
algo.core.Graph.prototype.getComponents = function () {

    // start with an empty list of components
    var components = [];

    // list of vertices still to process
    var unconnected = _.values(this.vertices);

    // recursive depth first component builder function
    function depthFirstSearch(component, vertex) {

        // if the vertex is not a member of the component then process it
        if (component.indexOf(vertex) < 0) {

            // remove the vertex from the unconnected list and add to the component
            component.push(unconnected.splice(unconnected.indexOf(vertex), 1)[0]);

            // recur into any connected vertices
            _.each(this.getAdjacentVertices(vertex), function (v) {
                depthFirstSearch.call(this, component, v);
            }, this);
        }

        return component;
    }

    // build the components until all the unconnected vertices have been consumed
    while (unconnected.length) {

        // create a new connected component, starting with the first unconnected vertex
        components.push(depthFirstSearch.call(this, [], unconnected[0]));

    }

    // return the components sorted by size

    return components.sort(function(a, b) {
        return b.length - a.length;
    });

};

/**
 * graph vertex for algo.core.Graph class
 * You can add additional properties to the vertices e.g. mass for layout algorithms but the id property
 * must be treated as read-only.
 *
 * @param id
 * @param {object} properties - used defined properties of the vertex
 * @constructor
 */
algo.core.GraphVertex = function (id, properties) {

    // save our id and initialize lists of out / in edges
    this.id = id;
    this.outEdges = {};
    this.inEdges = {};

    // extend ourselves with user defined properties
    _.extend(this, properties);

    // save our extended property names in case want to swap properties with another vertex later

    this.propertyNames = properties ? _.keys(properties) : [];
};

/**
 * edges connect two vertices or a single vertex
 * @param {number} id
 * @param {algo.core.GraphVertex} source
 * @param {algo.core.GraphVertex} target
 * @constructor
 */
algo.core.GraphEdge = function (id, source, target, properties) {

    // save id and source/target vertex

    this.id = id;
    this.source = source;
    this.target = target;

    // extend with user properties

    _.extend(this, properties);

    // update the out / in edges of each vertex

    source.outEdges[this.id] = this;
    target.inEdges[this.id] = this;
};

/**
 * change target of existing edge
 * @param edge
 * @param newTarget
 */
algo.core.GraphEdge.prototype.setTarget = function (newTarget) {

    delete this.target.inEdges[this.id];
    this.target = newTarget;
    this.target.inEdges[this.id] = this;
};

/**
 * change source of existing edge
 * @param edge
 * @param newSource
 */
algo.core.GraphEdge.prototype.setSource = function (newSource) {

    delete this.source.outEdges[this.id];
    this.source = newSource;
    this.source.outEdges[this.id] = this;
};

/**
 * @returns {boolean} returns true if the edge is connected to itself
 */
algo.core.GraphEdge.isSelfConnected = function () {
    return this.source.id === this.target.id;
};

// **BinaryTree** is just a special kind of direct acyclic graph and can therefore be created from the **GenericGraph** class
algo.core.BinaryTree = function (options) {

    // call progenitor to initialize instance
    algo.core.Graph.call(this, options);

};
// **BinaryTree** inherits functionality from **Graph**
algo.core.extends(algo.core.Graph, algo.core.BinaryTree);

// This must be called after any changes to the BinaryTree. It sets the .parent property of each
// vertex to its current parent. Operations like add, remove, balance etc will disturb the trees
// topology. Fixing up the parent property afterwards makes the code much simpler, but less effecient,
// than incrementally updating the parent property.
algo.core.BinaryTree.prototype.setParents = function (currentNode, parent) {

    if (currentNode) {
        currentNode.parent = parent;
        this.setParents(currentNode.left, currentNode);
        this.setParents(currentNode.right, currentNode);
    }
};

// **addVertex** replaces the progenitors version with a version that inserts a vertex into
// the binary tree structure and updates edges as necessary
algo.core.BinaryTree.prototype.addVertex = function (properties) {

    // create extended object TreeVertex versus GraphVertex
    var n = new algo.core.TreeVertex(this, this.nextVertexId++, properties);
    this.vertices[n.id] = n;

    // invoke the createVertex callback to obtain the element for the vertex
    n.element = this.invoke.call(this, 'createVertex', n, this);

    // find insertion point
    if (this.root) {

        var c = this.root;

        while (true) {

            // compare new value to value at the current vertex
            var comp = algo.core.compareItems(n.value, c.value, this.options.comparator);

            // ignore duplicates
            if (comp === 0) {
                this.removeVertex(n);
                return null;
            }

            // seek into left branch of vertex?
            if (comp < 0) {
                if (c.left) {
                    c = c.left;
                } else {
                    // create the .left property as a direct reference to the new left vertex and
                    c.left = n;
                    break;
                }

            } else {

                // go right

                if (c.right) {
                    c = c.right;
                } else {
                    // create the .right property as a direct reference to the new right vertex
                    c.right = n;
                    break;
                }
            }
        }

    } else {

        // if the tree was empty simply make this vertex the root of the tree
        this.root = n;
    }

    // update parent references since the topology of tree has changed
    this.setParents(this.root, null);

    return n;
};

/**
 * add a value to the tree, just syntactic sugar for addVertex
 * @param value
 */
algo.core.BinaryTree.prototype.add = function (value) {

    return this.addVertex({value: value});

};

// **removeVertex** is overloaded so we can rearrange the topology of the tree as we remove
// the vertex
algo.core.BinaryTree.prototype.removeVertex = function (v) {

    // number of children is significant, each case 0,1 or 2 are handled slightly differently.
    var childCount = (v.left ? 1 : 0) + (v.right ? 1 : 0);

    // we need to remember of the removed vertex was the root
    var wasRoot = v === this.root;

    switch (childCount) {

        case 0:
        {

            // childless vertex just needs the parent fixed up, if the vertex was the root
            // we just need to reset the root
            if (wasRoot) {
                this.root = null;
            } else {
                if (v.parent.left === v) {
                    v.parent.left = null;
                } else {
                    v.parent.right = null;
                }
            }
            break;
        }

        case 1:
        {
            // if was the root then there is no parent to fix up and the new root is the child
            if (wasRoot) {
                this.root = v.left || v.right;
                break;
            }
            // assign children to left or right of parent where the removed vertex used to be
            if (v.parent.left === v) {
                v.parent.left = v.left || v.right;
            } else {
                v.parent.right = v.left || v.right;
            }
            break;
        }

        case 2:
        {
            // find min of right sub tree
            var min = this.min(v.right, v);

            // insert in place of n, if there was a parent
            if (v.parent) {
                if (v.parent.left === v)
                    v.parent.left = min;
                else
                    v.parent.right = min;
            }

            // left sub tree can simply be attached to replacement for removed node
            min.left = v.left;

            // if min was the next right node
            if (min !== v.right) {
                // remove min from old parent and replace with mins right branch if any
                min.parent.left = min.right;
                // make the replacement right tree the same as the old right tree
                min.right = v.right;
            }

            // make root if root was remove
            if (wasRoot)
                this.root = min;

            break;
        }
    }

    // update parent references since the topology of tree has changed
    this.setParents(this.root, null);

    // use the progenitor object to remove the vertex and attached edges
    algo.core.Graph.prototype.removeVertex.call(this, v);

};

/**
 * remove a vertex using its value, syntactic sugar for removeVertex
 * @param value
 */
algo.core.BinaryTree.prototype.remove = function (value) {

    var vertex = this.findVertex(value);

    if (vertex) {
        this.removeVertex(vertex);
    }
};

/**
 * find the TreeVertex with the given value.
 * @param value
 * @returns {algo.core.TreeVertex|*|algo.core.BinaryTree.root}
 */
algo.core.BinaryTree.prototype.findVertex = function (value) {

    // start at the root of course
    var current = this.root;

    // continue until we find the value or run out of vertices to examine
    while (current) {

        // compare current vertex value with the goal
        var c = algo.core.compareItems(current.value, value, this.options.comparator);

        // found it?
        if (c === 0) {
            break;
        }

        // go left or right in tree according to result of logical comparison between current vertex value and value
        current = c > 0 ? current.left : current.right;

    }

    // current is either the last vertex examined or null if the value is not present
    return current;
};

// return the minimum value vertex of the subtree rooted at **n**. This is a used during various tree
// operations e.g. remove, rotates etc
// It is implemented as a recursive function for simplicity. Since smaller values are always to the left
// of their parent we don't need to actually examine the value, we just follow the left edges as far
// as we can.

algo.core.BinaryTree.prototype.min = function (n) {

    if (n && n.left) {
        return this.min(n.left);
    }

    return n;
};

// return maximum value vertex of the subtree rooted at **n**. The same procedure as **min** but
// follows the right edges
algo.core.BinaryTree.prototype.max = function (n) {

    if (n && n.right) {
        return this.max(n.right);
    }
    return n;
};

// **TreeVertex** extends the **GraphVertex** class and adds getters and setters for .left, .right and .parent
// that automate the progress
algo.core.TreeVertex = function (tree, id, properties) {

    // call progenitor to initialize instance
    algo.core.GraphVertex.call(this, id, properties);

    // save the tree/graph we belong to so we can add/remove edges
    this.tree = tree;

    // left vertex. Use this property to automate the creation of edge connecting this vertex to
    // its left child
    Object.defineProperty(this, 'left', {
        enumerable: true,
        get       : function () {
            return this.leftVertex;
        },
        set       : function (v) {

            // tries to preserve existing edge if possible
            if (v !== this.leftVertex) {

                this.leftVertex = v;
                if (!this.leftVertex && this.leftEdge) {
                    this.tree.removeEdge(this.leftEdge);
                    this.leftEdge = null;
                } else if (this.leftEdge) {
                    this.leftEdge.setTarget(this.leftVertex);
                } else {
                    this.leftEdge = this.tree.addEdge(this, this.leftVertex);
                }
            }
        }
    });

    // likewise for the right child
    Object.defineProperty(this, 'right', {
        enumerable: true,
        get       : function () {
            return this.rightVertex;
        },
        set       : function (v) {
            // tries to preserve existing edge if possible
            if (v !== this.rightVertex) {

                this.rightVertex = v;
                if (!this.rightVertex && this.rightEdge) {
                    this.tree.removeEdge(this.rightEdge);
                    this.rightEdge = null;
                } else if (this.rightEdge) {
                    this.rightEdge.setTarget(this.rightVertex);
                } else {
                    this.rightEdge = this.tree.addEdge(this, this.rightVertex);
                }
            }
        }
    });

    // parent is just a reference to our parent vertex, it is NOT an actual
    // edge in the graph
    Object.defineProperty(this, 'parent', {
        enumerable: true,
        get       : function () {
            return this.parentVertex;
        },
        set       : function (v) {
            this.parentVertex = v;
        }
    });

};

// **TreeVertex** extends the **GraphVertex** prototype
algo.core.extends(algo.core.GraphVertex, algo.core.TreeVertex);

/**
 * A classic heap ( priority queue ) data structure. The heap exists in the graph name space because it uses a binary tree
 * structure to manage itself, but its implementation is array based.
 * @param options
 * @constructor
 */
algo.core.Heap = function (options) {

    // save options etc

    algo.core.DataStructure.call(this, options);

    // reset to empty heap

    this.nodes = [];

    this.n = 0;
};

algo.core.extends(algo.core.DataStructure, algo.core.Heap);

/**
 * we are empty when n is zero
 * @returns {boolean}
 */
algo.core.Heap.isEmpty = function () {

    return this.n === 0;
};

/**
 * root element in heap is always at this index
 * @const {number}
 */
algo.core.Heap.kROOT = 1;

/**
 * getter for the value property of a heap item identified by index
 * @param i
 * @returns {*}
 */
algo.core.Heap.prototype.value = function (i) {
    return this.nodes[i].value;
};

/**
 * getter for the payload property of a heap item identified by index
 * @param i
 * @returns {*}
 */
algo.core.Heap.prototype.payload = function (i) {
    return this.nodes[i].payload;
};

/**
 * getter for the elememt property of a heap item identified by index
 * @param i
 * @returns {algo.render.Element}
 */
algo.core.Heap.prototype.element = function (i) {
    return this.nodes[i].element;
};

/**
 * swap two items in the heap, used during siftUp and siftDown operations
 * @param i
 * @param j
 */
algo.core.Heap.prototype.swap = function (i, j) {

    var temp = this.nodes[i];

    this.nodes[i] = this.nodes[j];

    this.nodes[j] = temp;
};

/**
 * return left child of item
 * @param i
 * @returns {number}
 */
algo.core.Heap.prototype.leftChild = function (i) {

    return 2 * i;
};

/**
 * return right child of item
 * @param i
 * @returns {number}
 */
algo.core.Heap.prototype.rightChild = function (i) {

    return 2 * i + 1;
};

/**
 * return parent item of item
 * @param i
 * @returns {*}
 */
algo.core.Heap.prototype.parent = function (i) {

    return i >> 1;
};

/**
 * true if the index is out of bounds
 * @param i
 * @returns {boolean}
 */
algo.core.Heap.prototype.isNull = function (i) {

    return i < algo.core.Heap.kROOT || i > this.n;
};

/**
 * return true if the item is empty
 * @returns {boolean}
 */
algo.core.Heap.prototype.isEmpty = function () {
    return this.n === 0;
};

/**
 * add an item to the heap. The value, v should always be a number but the associated payload can be any object
 * @param v
 */
algo.core.Heap.prototype.enqueue = function (v, payload) {

    // insert at end of heap then sift upwards toward root until final resting place is found

    this.nodes[algo.core.Heap.kROOT + this.n] = {
        value  : v,
        payload: payload,
        element: this.invoke.call(this, 'createVertex', v, this)
    };

    this.siftUp(algo.core.Heap.kROOT + this.n++);
};

/**
 * remove an item from the heap, returning a object of the form {value:number, payload: object}
 * @returns {*}
 */
algo.core.Heap.prototype.dequeue = function () {

    // the root is always the min value

    var min = this.nodes[algo.core.Heap.kROOT];

    // if there is an element destroy it
    if (min.element) {
        this.invoke('destroyVertex', min.value, min.element, this);
    }

    // if there are any items left then we need to perform the following:
    // move the last item to the root, then siftDown until it reaches its correct location.
    // If siftDown always swaps with the smallest child then the 'shape' of the tree is maintained

    this.n--;

    // if we just removed the last item then the queue is empty and we are done

    if (this.n > 0) {

        // get the old last ( right most / deepest ) item

        this.nodes[algo.core.Heap.kROOT] = this.nodes[algo.core.Heap.kROOT + this.n];

        // sift the root item down until it reaches a leaf or both its children and >= to it

        this.siftDown(algo.core.Heap.kROOT);
    }

    // return the old root of the heap

    return min;
};

/**
 * move the item at i down the tree until it reaches a suitable resting place.
 * @param i
 */
algo.core.Heap.prototype.siftDown = function (i) {

    // if no more children we are done

    var left = this.leftChild(i);

    var right = this.rightChild(i);

    var hasLeft = !this.isNull(left);

    var hasRight = !this.isNull(right);

    while (hasLeft || hasRight) {

        // get child to swap with

        var leftValue = hasLeft ? this.value(left) : Number.MAX_VALUE;

        var rightValue = hasRight ? this.value(right) : Number.MAX_VALUE;

        // if current is less than or equal to both children then it is in the right place

        var v = this.value(i);

        if (v < leftValue && v < rightValue) {
            return;
        }

        // if no left branch or right branch has a lower value then go right

        var swapIndex = leftValue < rightValue ? left : right;

        // swap current with swapIndex

        this.swap(i, swapIndex);

        i = swapIndex;

        left = this.leftChild(i);

        right = this.rightChild(i);

        hasLeft = !this.isNull(left);

        hasRight = !this.isNull(right);
    }

};

/**
 * move the item at i up the tree until it reaches a suitable resting place. We will use the comparator function
 * supplied to the constructor or we will just treat our items as intrinsic types and compare with === <= etc.
 * @param i
 */
algo.core.Heap.prototype.siftUp = function (i) {

    var v = this.value(i);

    while (!this.isNull(this.parent(i)) && this.value(this.parent(i)) > v) {

        // swap i and parent

        this.swap(i, this.parent(i));

        i = this.parent(i);
    }
};

/**
 * Very simple pixel buffer data structure. Works with the algo.layout.PixelViewer class.
 * This class is design for extremely low resolution buffers for demonstrating things like
 * Bresenham's line drawing algorithms for example
 * @constructor
 */
algo.core.PixelBuffer = function (options) {

    // progenitor initialization
    algo.core.DataStructure.call(this, options);

    // save width and height for shorter statements
    this.w = options.width;
    this.h = options.height;

    // create our pixel buffer. Each pixels starts out as zero which indicates no pixel color has been set.
    this.pb = algo.core.createMultiArray(this.w, this.h);

    // create corresponding array of elements used to represent non null pixels
    this.e = algo.core.createMultiArray(this.w, this.h);
};

algo.core.extends(algo.core.DataStructure, algo.core.PixelBuffer);

/**
 * get pixel value at x, y
 * @param {number} x
 * @param {number} y
 */
algo.core.PixelBuffer.prototype.getPixel = function (x, y) {

    // range check

    if (x < 0 || x >= this.w || y < 0 || y >= this.h) {
        throw new Error("Pixel index out of bounds");
    }

    // if the pixel is zero it has not been set, so return null, otherwise return the color object

    return this.pb[x][y] === 0 ? null : this.pb[x][y];
};

/**
 * set pixel value at x, y
 * @param {number} x
 * @param {number} y
 * @param {algo.Color|Object} v - either an algo.Color object or something that can be used to construct one.
 */
algo.core.PixelBuffer.prototype.setPixel = function (x, y, v) {

    if (x < 0 || x >= this.w || y < 0 || y >= this.h) {
        throw new Error("Pixel index out of bounds");
    }

    // set the pixel with the given algo.Color instance or create one from the object
    var pixel = v;

    if (!(pixel instanceof algo.Color)) {
        pixel = new algo.Color(pixel);
    }

    this.pb[x][y] = pixel;

    // if there was no old pixel then we have to create one

    if (!this.e[x][y]) {
        this.e[x][y] = this.invoke.call(this, 'createPixel', x, y);
    }

    // update pixel element if there is one

    if (this.e[x][y]) {
        this.invoke.call(this, 'updatePixel', x, y, this.pb[x][y], this.e[x][y]);
    }
};

/**
 * reset pixel value at x, y
 * @param {number} x
 * @param {number} y
 */
algo.core.PixelBuffer.prototype.clearPixel = function (x, y) {

    if (x < 0 || x >= this.w || y < 0 || y >= this.h) {
        throw new Error("Pixel index out of bounds");
    }

    this.pb[x][y] = 0;

    if (this.e[x][y]) {
        this.invoke.call(this, 'destroyPixel', x, y, this.e[x][y]);
        this.e[x][y] = 0;
    }
};

/**
 * reset/clear the entire buffer
 */
algo.core.PixelBuffer.prototype.clear = function () {

    for (var y = 0; y < this.h; y += 1) {
        for (var x = 0; x < this.w; x += 1) {
            this.clearPixel(x, y);
        }
    }
};

/**
 * construct a new Array DataStructure. These are simple 1 dimensional arrays with basic add/remove operations.
 *
 * @param options
 * @constructor
 */
algo.core.Array = function (options) {

    // start with an empty array and an empty set of elements

    this.a = [];

    // save a shallow copy of the options object

    this.options = _.clone(options);

    // if initial data was provided then add it

    _.each(this.options.data, function (e) {
        this.push(e);
    }, this);

    // make a length property

    Object.defineProperty(this, 'length', {
        enumerable: true,
        get       : function () {
            return this.a.length;
        }
    });
};

algo.core.extends(algo.core.DataStructure, algo.core.Array);

/**
 * throw an exception if the given index is invalid
 * @param index
 */
algo.core.Array.prototype.validateIndex = function (index) {

    if (index < 0 || index >= this.a.length) throw new Error("Invalid Index");
};

/**
 * invoke updateElement on all elements. Since we don't know how the array is display ( maybe its in a circle? )
 * we update all elements after any CRUD operation.
 * @private
 */
algo.core.Array.prototype.updateElements = function () {

    // invoke update for elements that have been set

    for (var index = index + 1; index < this.a.length; index += 1) {

        var item = this.a[index];

        if (item.element) {
            this.invoke('updateElement', item.value, index, item.element);
        }
    }
};

/**
 * add a new value at the given index
 * @param {*} value - anything
 * @param {number} index - the index to insert at
 */
algo.core.Array.prototype.insertAt = function (value, index) {

    // since we are adding a value the current length of the array is a valid index

    if (index < 0 || index > this.a.length) throw new Error("Invalid Index");

    // add to our array while fetching the element for the index

    this.a.splice(index, 0, {
        value  : value,
        element: this.invoke('createElement', value, index)
    });

    // update all elements.

    this.updateElements();

};

/**
 * add a new value to the end of the array
 * @param value
 */
algo.core.Array.prototype.push = function (value) {

    this.insertAt(value, this.a.length);
};

/**
 * remove an item at the given index which must be valid
 * @param index
 */
algo.core.Array.prototype.removeAt = function (index) {

    // validate first

    this.validateIndex(index);

    // remove and get a reference to the remove item

    var item = this.a.splice(index, 1)[0];

    // invoke the remove method for the item

    if (item.element) {
        this.invoke('destroyElement', item.element);
    }

    this.updateElements();
};

/**
 * remove the last item in the array
 */
algo.core.Array.prototype.pop = function () {

    this.removeAt(this.a.length - 1);
};

/**
 * get the value at the given index
 * @param index
 */
algo.core.Array.prototype.getValue = function (index) {

    this.validateIndex(index);
    return this.a[index].value;
};

/**
 * returns a read only accessor for the values
 * @returns {Function} - a function that can be called with the index of the required element
 */
algo.core.Array.prototype.getValueAccessor = function () {

    return _.bind(function (index) {

        this.validateIndex(index);

        return this.a[index].value;

    }, this);
};

/**
 * get the element at the given index
 * @param index
 */
algo.core.Array.prototype.getElement = function (index) {

    this.validateIndex(index);
    return this.a[index].element;
};

/**
 * returns a read only accessor for the elements
 * @returns {*}
 */
algo.core.Array.prototype.getElementAccessor = function () {

    return _.bind(function (index) {

        this.validateIndex(index);

        return this.a[index].element;

    }, this);
};

/**
 * get the item at the given index
 * @param index
 */
algo.core.Array.prototype.getItem = function (index) {

    // validate first

    this.validateIndex(index);

    return this.a[index];
};

/**
 * set the value at the given index
 * @param index
 */
algo.core.Array.prototype.setValue = function (index, value) {

    // validate first

    this.validateIndex(index);

    var item = this.a[index];

    item.value = value;

    // call the update function

    if (item.element) {
        this.invoke('updateElement', item.value, index, item.element);
    }

};

/**
 * swap the two items at x and y, calling update on each
 * @param index
 */
algo.core.Array.prototype.swap = function (x, y) {

    // validate first

    this.validateIndex(x);
    this.validateIndex(y);

    // swap items

    var temp = this.a[x];
    this.a[x] = this.a[y];
    this.a[y] = temp;

    // call the swap function for both elements if they exist. Use the 'swapElement' function if
    // provided otherwise try just updateElement

    if (this.a[x].element) this.invoke('swapElement', this.a[x].value, x, y, this.a[x].element);
    if (this.a[y].element) this.invoke('swapElement', this.a[y].value, y, x, this.a[y].element);
};








