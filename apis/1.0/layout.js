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

/*globals _, dagre*/
"use strict";
/**
 * namespaces for the layout algorithms
 * @namespace algo
 */
var algo = algo || {};

/**
 * @namespace
 */
algo.layout = algo.layout || {};

/**
 * the progenitor object for all visual layout strategies. It is constructed with the DataStructure it operates
 * on. Each time its .update method is called it will invoke methods on the dataStructure as appropriate.
 * @param {algo.core.DataStructure} dataStructure
 * @constructor
 */
algo.layout.Strategy = function (dataStructure) {

    this.dataStructure = dataStructure;
};

/**
 * call after making changes to the data structure. This will invoke various methods on the data structure as
 * appropriate.
 */
algo.layout.Strategy.prototype.update = function () {

};

/**
 * the simplest of the graph layout strategies. Arranges graph vertices around the circumference of an ellipse.
 * @param {algo.core.Graph} dataStructure
 * @constructor
 */
algo.layout.GraphCircular = function (dataStructure) {

    algo.layout.Strategy.call(this, dataStructure);

};

algo.core.extends(algo.layout.Strategy, algo.layout.GraphCircular);

/**
 * arrange the vertices on the circumference of the given box
 * @param {algo.layout.Box} box
 */
algo.layout.GraphCircular.prototype.update = function (box) {

    // x/y radius is derived from our bounding box
    var rX = box.w >> 1, rY = box.h >> 1;

    // keep a temporary map of the vertex positions, since we supply those to the edge update function
    var vertexPositions = {};

    // iterate over an array of the graph vertices, which provides us with an index in the callback
    var vertices = _.values(this.dataStructure.vertices);

    _.each(vertices, function (v, index) {

        // degrees around the circle is simple index * ( 360 / number of vertices )
        var degrees = index * (360 / vertices.length);

        // return an empty box centered on the correct location
        var p = algo.core.pointOnEllipse(box.cx, box.cy, rX, rY, degrees);

        // save vertex position for edge update
        vertexPositions[v.id] = p;

        // update vertex
        this.dataStructure.invoke('updateVertex', v, v.element, p, this.dataStructure);

    }, this);

    // process all edges
    _.each(this.dataStructure.edges, function (edge) {

        var p1 = vertexPositions[edge.source.id];
        var p2 = vertexPositions[edge.target.id];
        this.dataStructure.invoke('updateEdge', edge, edge.element, p1, p2, this.dataStructure);

    }, this);
};

/**
 * The binary tree layout strategy. s
 * @param {algo.core.BinaryTree} dataStructure
 * @constructor
 */
algo.layout.BinaryTree = function (dataStructure) {

    algo.layout.Strategy.call(this, dataStructure);
};

algo.core.extends(algo.layout.Strategy, algo.layout.BinaryTree);

/**
 * perform Knuth layout on binary tree graph
 * @param {algo.layout.Box} box
 */
algo.layout.BinaryTree.prototype.update = function (box) {

    // uses Knuth's simple binary tree layout algorithm. This results
    // in a simple x/y (column/row) position for each vertex. We then
    // use a algo.layout.GridLayout object to position each vertex
    // within the given bounding box

    // x position of nodes is a global while we perform the traversal,
    // maxDepth tracks how deep the tree is. vertexMap is used to store
    // the x/y position for each vertex for later updates

    var x = 0, maxDepth = 0, vertexMap = {};

    // the recursive function that traverses the tree and updates x, maxDepth
    // and vertexMap

    function traverseLayout(vertex, depth) {

        if (vertex) {

            // keep track of max depth
            maxDepth = Math.max(maxDepth, depth);

            // go left first
            traverseLayout(vertex.left, depth + 1);

            // save position for this vertex
            vertexMap[vertex.id] = {
                x: x++,
                y: depth
            };

            // go right
            traverseLayout(vertex.right, depth + 1);
        }
    }

    // traverse from root, depth 1
    traverseLayout(this.dataStructure.root, 0);

    // create a grid layout using the calculate rows and columns required
    var grid = new algo.layout.GridLayout(box, maxDepth + 1, x);

    // now update the vertex position...and then the edges since edge positions depend on vertices
    var p, b;

    _.each(this.dataStructure.vertices, function (v) {

        // get position
        p = vertexMap[v.id];

        // get corresponding box from grid layout
        b = grid.getBox(p.y, p.x);

        // invoke the update method of the tree
        this.dataStructure.invoke('updateVertex', v, v.element, {x: b.cx, y: b.cy});

    }, this);

    _.each(this.dataStructure.vertices, function (v) {

        p = vertexMap[v.id];
        b = grid.getBox(p.y, p.x);

        // update its left and right edges if they exist
        if (v.left) {
            this.dataStructure.invoke('updateEdge', v.leftEdge, v.leftEdge.element, v, v.left);
        }
        if (v.right) {
            this.dataStructure.invoke('updateEdge', v.rightEdge, v.rightEdge.element, v, v.right);
        }

    }, this);

};

/**
 * The force directed graph layout strategy.
 * @param {algo.core.Graph} dataStructure
 * @constructor
 */
algo.layout.GraphForceDirected = function (dataStructure, options) {

    algo.layout.Strategy.call(this, dataStructure);

    // syntactic sugar
    this.graph = dataStructure;

    // clone and save options and suppy defaults
    this.options = _.defaults(_.clone(options || {}), {
        stiffness: 400,
        repulsion: 400,
        damping  : 0.5
    });

    // extend ourselves with the options so we don't have to write this.options.stiffness etc
    _.extend(this, this.options);

    this.vertexPoints = {};                         // keep track of points associated with vertices
    this.edgeSprings = {};                          // keep track of springs associated with edges
};

algo.core.extends(algo.layout.Strategy, algo.layout.GraphForceDirected);

/**
 * Start the layout algorithm and run for the specified number of ms OR until the total energy
 * in the system goes below a threshold
 * @param {box} box - the bounding box for the layout
 * @param {number} ms - the maximum number of milliseconds to run the simulation for
 */
algo.layout.GraphForceDirected.prototype.update = function (box, ms) {

    // set bounding box for graph   
    this.box = box;
    // calculate time to stop at, or default to 100ms from now
    var stop = Date.now() + (ms || 100);
    // iteratively improve the layout until time limit reached or the total energy in the system has decayed below
    // a certain threshold
    while (true) {

        this.applyCoulombsLaw();
        this.applyHookesLaw();
        this.attractToCentre();
        this.updateVelocity(0.03);
        this.updatePosition(0.03);

        if (this.totalEnergy() < 0.01 || Date.now() >= stop) {
            break;
        }
    }

    // update the simulations bounding box and size after the layout
    this.simBounds = this.getBoundingBox();
    this.simSize = this.simBounds.topright.subtract(this.simBounds.bottomleft);

    // update all vertices first
    _.each(this.graph.vertices, function (vertex) {
        if (vertex.element) {
            this.graph.invoke('updateVertex', vertex, vertex.element, this.getVertexPosition(vertex));
        }
    }, this);

    // now edges
    _.each(this.graph.edges, function (edge) {

        // get screen positions of end points of edge springs
        var spring = this.spring(edge);
        var p1 = this.simToScreen(spring.point1.p);
        var p2 = this.simToScreen(spring.point2.p);
        if (edge.element) {
            this.graph.invoke('updateEdge', edge, edge.element, p1, p2);
        }
    }, this);
};

/**
 * get the location within our bounds for the given vertex.
 * @param vertex
 * @return {algo.layout.Vector}
 */
algo.layout.GraphForceDirected.prototype.getVertexPosition = function (vertex) {

    return this.simToScreen(this.vertexPoints[vertex.id].p);
};

/**
 * convert the simulation point to a point within our current bounding box.
 * Assumes that this.simBounds is up to date.
 * @param p
 */
algo.layout.GraphForceDirected.prototype.simToScreen = function (p) {

    var sx = p.subtract(this.simBounds.bottomleft).divide(this.simSize.x).x * this.box.w;

    var sy = p.subtract(this.simBounds.bottomleft).divide(this.simSize.y).y * this.box.h;

    // allow for non zero position of bounding box

    sx += this.box.x;

    sy += this.box.y;

    // return vector representing location

    return new algo.layout.Vector(sx, sy);

};

/**
 * return a point representing a vertex, the point is added to the vertexPoints set on creation
 * @param vertex
 * @returns {algo.layout.GraphForceDirected.Point}
 */
algo.layout.GraphForceDirected.prototype.point = function (vertex) {
    if (!(vertex.id in this.vertexPoints)) {
        var mass = vertex.mass || 1.0;
        this.vertexPoints[vertex.id] = new algo.layout.GraphForceDirected.Point(algo.layout.Vector.random(), mass);
    }

    return this.vertexPoints[vertex.id];
};

/**
 * create a sprint from a graph edge
 * @param edge
 * @returns {algo.layout.GraphForceDirected.Spring}
 */
algo.layout.GraphForceDirected.prototype.spring = function (edge) {
    if (!(edge.id in this.edgeSprings)) {
        var length = edge.length || 1.0;

        var existingSpring = false;

        var from = this.graph.getEdges(edge.source, edge.target);
        from.forEach(function (e) {
            if (existingSpring === false && e.id in this.edgeSprings) {
                existingSpring = this.edgeSprings[e.id];
            }
        }, this);

        if (existingSpring !== false) {
            return new algo.layout.GraphForceDirected.Spring(existingSpring.point1, existingSpring.point2, 0.0, 0.0);
        }

        var to = this.graph.getEdges(edge.target, edge.source);
        from.forEach(function (e) {
            if (existingSpring === false && e.id in this.edgeSprings) {
                existingSpring = this.edgeSprings[e.id];
            }
        }, this);

        if (existingSpring !== false) {
            return new algo.layout.GraphForceDirected.Spring(existingSpring.point2, existingSpring.point1, 0.0, 0.0);
        }

        this.edgeSprings[edge.id] = new algo.layout.GraphForceDirected.Spring(
            this.point(edge.source), this.point(edge.target), length, this.stiffness
        );
    }

    return this.edgeSprings[edge.id];
};

/**
 * callback for each vertex in the graph. The callback is invoked with (vertex, point)
 * @param callback
 */
algo.layout.GraphForceDirected.prototype.eachVertex = function (callback) {

    var t = this;
    _.values(this.graph.vertices).forEach(function (n) {
        callback.call(t, n, t.point(n));
    });
};

/**
 * callback for each edge in the graph. Callback is invoked with (edge, spring)
 * @param callback
 */
algo.layout.GraphForceDirected.prototype.eachEdge = function (callback) {
    var t = this;
    _.values(this.graph.edges).forEach(function (e) {
        callback.call(t, e, t.spring(e));
    });
};

/**
 * callback for each spring in the visualizer. Callback is invoked with (spring)
 * @param callback
 */
algo.layout.GraphForceDirected.prototype.eachSpring = function (callback) {
    var t = this;
    _.values(this.graph.edges).forEach(function (e) {
        callback.call(t, t.spring(e));
    });
};

/**
 * apply the repulsive force to each vertex against each other vertex
 */
algo.layout.GraphForceDirected.prototype.applyCoulombsLaw = function () {
    this.eachVertex(function (n1, point1) {
        this.eachVertex(function (n2, point2) {
            if (point1 !== point2) {
                var d = point1.p.subtract(point2.p);
                var distance = d.magnitude() + 0.1; // avoid massive forces at small distances (and divide by zero)
                var direction = d.normalise();

                // apply force to each end point
                point1.applyForce(direction.multiply(this.repulsion).divide(distance * distance * 0.5));
                point2.applyForce(direction.multiply(this.repulsion).divide(distance * distance * -0.5));
            }
        });
    });
};

/**
 * apply Hookes spring law ( attractive force ) on each spring in the visualizer
 */
algo.layout.GraphForceDirected.prototype.applyHookesLaw = function () {
    this.eachSpring(function (spring) {
        var d = spring.point2.p.subtract(spring.point1.p); // the direction of the spring
        var displacement = spring.length - d.magnitude();
        var direction = d.normalise();

        // apply force to each end point
        spring.point1.applyForce(direction.multiply(spring.k * displacement * -0.5));
        spring.point2.applyForce(direction.multiply(spring.k * displacement * 0.5));
    });
};

/**
 * all vertices/points are generally attracted to the center
 */
algo.layout.GraphForceDirected.prototype.attractToCentre = function () {
    this.eachVertex(function (vertex, point) {
        var direction = point.p.multiply(-1.0);
        point.applyForce(direction.multiply(this.repulsion / 50.0));
    });
};

/**
 * update the velocity of each vertex
 * @param timestep
 */
algo.layout.GraphForceDirected.prototype.updateVelocity = function (timestep) {
    this.eachVertex(function (vertex, point) {
        // Is this, along with updatePosition below, the only places that your
        // integration code exist?
        point.v = point.v.add(point.a.multiply(timestep)).multiply(this.damping);
        point.a = new algo.layout.Vector(0, 0);
    });
};

/**
 * update the position of each point
 * @param timestep
 */
algo.layout.GraphForceDirected.prototype.updatePosition = function (timestep) {
    this.eachVertex(function (vertex, point) {
        // Same question as above; along with updateVelocity, is this all of
        // your integration code?
        point.p = point.p.add(point.v.multiply(timestep));
    });
};

/**
 * return the total energy in the system. This is used to short circuit the update
 * when a near stable arrangement is obtained
 * @returns {number}
 */
algo.layout.GraphForceDirected.prototype.totalEnergy = function () {
    var energy = 0.0;
    this.eachVertex(function (vertex, point) {
        var speed = point.v.magnitude();
        energy += 0.5 * point.m * speed * speed;
    });

    return energy;
};

/**
 * get the bounding box of the visualizer layout. This is within the visualizers internal
 * coordinate system. Not screen or surface space
 *
 * @returns {{bottomleft: algo.layout.Vector, topright: algo.layout.Vector}}
 */
algo.layout.GraphForceDirected.prototype.getBoundingBox = function () {
    var bottomleft = new algo.layout.Vector(-2, -2);
    var topright = new algo.layout.Vector(2, 2);

    this.eachVertex(function (n, point) {
        if (point.p.x < bottomleft.x) {
            bottomleft.x = point.p.x;
        }
        if (point.p.y < bottomleft.y) {
            bottomleft.y = point.p.y;
        }
        if (point.p.x > topright.x) {
            topright.x = point.p.x;
        }
        if (point.p.y > topright.y) {
            topright.y = point.p.y;
        }
    });

    return {bottomleft: bottomleft, topright: topright};
};

/**
 * point instances are used to represent vertices in the graph along with their physical properties
 * @param position
 * @param mass
 * @constructor
 */
algo.layout.GraphForceDirected.Point = function (position, mass) {
    this.p = position;                      // position
    this.m = mass;                          // mass
    this.v = new algo.layout.Vector(0, 0);  // velocity
    this.a = new algo.layout.Vector(0, 0);  // acceleration
};

/**
 * apply a force to a point
 * @param force
 */
algo.layout.GraphForceDirected.Point.prototype.applyForce = function (force) {
    this.a = this.a.add(force.divide(this.m));
};

/**
 * springs represent edges in the force directed layout visualizer
 * @param point1
 * @param point2
 * @param length
 * @param k
 * @constructor
 */
algo.layout.GraphForceDirected.Spring = function (point1, point2, length, k) {
    this.point1 = point1;
    this.point2 = point2;
    this.length = length;       // spring length at rest
    this.k = k;                 // spring constant (See Hooke's law) .. how stiff the spring is
};

/**
 * the generic results of various types of intersection test.
 * For valid intersections the points property is an array of
 * algo.layout.Vector objects. There is also a point property that returns
 * the first point in the points array. The status property is a string that indicates why the intersection test
 * failed if any
 * @constructor
 * @param {object} arg - can be a vector or a status string or nothing
 */
algo.layout.Intersection = function (arg) {

    if (arg instanceof algo.layout.Vector) {
        this.points = [arg];
    } else {
        if (_.isString(arg)) {
            this.status = arg;
        }
        this.points = [];
    }

    /**
     * return the first point of our results, or null if no points
     */
    Object.defineProperty(this, 'point', {
        enumerable: true,
        get       : function () {
            if (this.points && this.points.length > 0) {
                return this.points[0];
            }

            return null;
        }
    });

    // status of intersection

    Object.defineProperty(this, 'status', {
        enumerable: true,
        get       : function () {
            return this._status;
        },
        set       : function (s) {
            this._status = s;
            return this;
        }
    });
};

/**
 * add an object with x/y values to the results
 * @param p
 */
algo.layout.Intersection.prototype.addPoint = function (p) {

    if (p) {

        this.points = this.points || [];

        this.points.push(new algo.layout.Vector(p.x, p.y));
    }

    return this;
};

/**
 * basic vector class, not to be confused with a line which is not
 * necessarily anchored at the origin
 * @param x
 * @param y
 * @constructor
 */
algo.layout.Vector = function (x, y) {

    this.x = x;
    this.y = y;
};

/**
 * return a new vector that is lerped toward that by the parametric value t
 * @param {algo.layout.Vector} that
 * @param {number} t
 * @returns {algo.layout.Vector}
 */
algo.layout.Vector.prototype.lerp = function (that, t) {
    return new algo.layout.Vector(
            this.x + (that.x - this.x) * t,
            this.y + (that.y - this.y) * t
    );
};

/**
 * make a random vector between -0.5 and + 0.5
 * @return {algo.layout.Vector}
 */
algo.layout.Vector.random = function () {

    return new algo.layout.Vector(Math.random() - 0.5, Math.random() - 0.5);
};

/**
 * add v2 and return a new vector
 * @param v2
 * @returns {algo.layout.Vector}
 */
algo.layout.Vector.prototype.add = function (v2) {
    return new algo.layout.Vector(this.x + v2.x, this.y + v2.y);
};

/**
 * subtract v2 and return a new vector
 * @param v2
 * @returns {algo.layout.Vector}
 */
algo.layout.Vector.prototype.subtract = function (v2) {
    return new algo.layout.Vector(this.x - v2.x, this.y - v2.y);
};

/**
 * multiple by n and return a new vector
 * @param n
 * @returns {algo.layout.Vector}
 */
algo.layout.Vector.prototype.multiply = function (n) {
    return new algo.layout.Vector(this.x * n, this.y * n);
};

/**
 * divide self by n and return a new vector
 * @param n
 * @returns {algo.layout.Vector}
 */
algo.layout.Vector.prototype.divide = function (n) {
    return new algo.layout.Vector((this.x / n) || 0, (this.y / n) || 0); // Avoid divide by zero errors..
};

/**
 * magnitude of the vector
 * @returns {number}
 */
algo.layout.Vector.prototype.magnitude = function () {
    return Math.sqrt(this.x * this.x + this.y * this.y);
};

/**
 * normal of the vector
 * @returns {algo.layout.Vector}
 */
algo.layout.Vector.prototype.normal = function () {
    return new algo.layout.Vector(-this.y, this.x);
};

/**
 * normalize the vector, returns a new vector
 * @returns {*}
 */
algo.layout.Vector.prototype.normalise = function () {
    return this.divide(this.magnitude());
};

/**
 * clone into new Vector
 * @returns {algo.layout.Vector}
 */
algo.layout.Vector.prototype.clone = function () {

    return new algo.layout.Vector(this.x, this.y);
};

/**
 * get the angle between this Vector and another in degrees
 * @param {algo.layout.Vector} other
 * @returns {number} polar angle between two points in degrees
 */
algo.layout.Vector.prototype.angle = function(other) {

    // first calculate the angle from this.x/this.y to this.p.x2/this.p.y2

    var rads = Math.atan2(other.y - this.y, other.x - this.x);

    // atan2 return negative PI radians for the 180-360 degrees ( 9 o'clock to 3 o'clock )

    if (rads < 0) {

        rads = 2 * Math.PI + rads;
    }

    return algo.core.radiansToDegrees(rads);

};

/**
 * a line object. Has vector like properties as well an intersection testing.
 * Most usefully, it has a static getConnector method that returns a line attached to the boundary of
 * any pair of objects with vector/line/circle/box type properties
 * @param x1
 * @param y1
 * @param x2
 * @param y2
 * @constructor
 */
algo.layout.Line = function (x1, y1, x2, y2) {

    this.x1 = x1;

    this.y1 = y1;

    this.x2 = x2;

    this.y2 = y2;

    // x extent of line

    Object.defineProperty(this, 'dx', {
        enumerable: true,
        get       : function () {
            return this.x2 - this.x1;
        }
    });

    // y extent of line

    Object.defineProperty(this, 'dy', {
        enumerable: true,
        get       : function () {
            return this.y2 - this.y1;
        }
    });

    // length of line ( magnitude )

    Object.defineProperty(this, 'length', {
        enumerable: true,
        get       : function () {
            return Math.sqrt(this.dx * this.dx + this.dy * this.dy);
        }
    });
};

/**
 * return a line representing the top edge of any box/rectangle like object
 * @param {*} r - a rectangle like object
 * @returns {algo.layout.Line}
 */
algo.layout.Line.topEdge = function (r) {
    return new algo.layout.Line(r.x, r.y, r.x + r.w, r.y);
};
/**
 * return a line representing the bottom edge of any box/rectangle like object
 * @param {*} r - a rectangle like object
 * @returns {algo.layout.Line}
 */
algo.layout.Line.bottomEdge = function (r) {
    return new algo.layout.Line(r.x, r.y + r.h, r.x + r.w, r.y + r.h);
};
/**
 * return a line representing the left edge of any box/rectangle like object
 * @param {*} r - a rectangle like object
 * @returns {algo.layout.Line}
 */
algo.layout.Line.leftEdge = function (r) {
    return new algo.layout.Line(r.x, r.y, r.x, r.y + r.h);
};
/**
 * return a line representing the right edge of any box/rectangle like object
 * @param {*} r - a rectangle like object
 * @returns {algo.layout.Line}
 */
algo.layout.Line.rightEdge = function (r) {
    return new algo.layout.Line(r.x + r.w, r.y, r.x + r.w, r.y + r.h);
};

/**
 * return a line object that connects the boundary of start to the boundary of end.
 * degenerates cases (overlapping objects etc) will return a line connecting the center of the objects.
 * start and end can be any combination of point like, rectangle like or circle like objects e.g.
 * algo.layout.Vector or {x:0, y:0} or algo.layout.Rect or algo.render.Rect etc.
 *

 *
 * @param start - see above
 * @param end - see above
 */
algo.layout.Line.getConnector = function (start, end) {

    // these will become the start and end of the line, initially we set them to the center of the objects
    // so we intersect the results vector with the shape boundaries
    var p1, p2, temp;

    if (algo.core.isRectLike(start)) {

        p1 = new algo.layout.Vector(start.x + start.w / 2, start.y + start.h / 2);

    } else if (algo.core.isCircleLike(start)) {

        p1 = new algo.layout.Vector(start.x, start.y);

    } else if (algo.core.isPointLike(start)) {

        p1 = new algo.layout.Vector(start.x, start.y);

    } else {
        throw new Error("Unrecognized object passed to Line::getConnector");
    }

    if (algo.core.isRectLike(end)) {

        p2 = new algo.layout.Vector(end.x + end.w / 2, end.y + end.h / 2);

    } else if (algo.core.isCircleLike(end)) {

        p2 = new algo.layout.Vector(end.x, end.y);

    } else if (algo.core.isPointLike(end)) {

        p2 = new algo.layout.Vector(end.x, end.y);

    } else {
        throw new Error("Unrecognized object passed to Line::getConnector");
    }

    // now p1->p2 is a line from the center of each shape, adjust to boundary for circles and rectangle

    var line = new algo.layout.Line(p1.x, p1.y, p2.x, p2.y);

    // start adjustment

    if (algo.core.isRectLike(start)) {

        temp = line.intersectWithBox(start);
        if (temp.point) {
            line.x1 = temp.point.x;
            line.y1 = temp.point.y;
        }
    } else {
        if (algo.core.isCircleLike(start)) {

            temp = line.intersectWithCircle(start);
            if (temp.point) {
                line.x1 = temp.point.x;
                line.y1 = temp.point.y;
            }
        }
    }

    // end adjustment

    if (algo.core.isRectLike(end)) {

        temp = line.intersectWithBox(end);
        if (temp.point) {
            line.x2 = temp.point.x;
            line.y2 = temp.point.y;
        }
    } else {
        if (algo.core.isCircleLike(end)) {

            temp = line.intersectWithCircle(end);
            if (temp.point) {
                line.x2 = temp.point.x;
                line.y2 = temp.point.y;
            }
        }
    }

    return line;

};

/**
 * intersection of this line with another line.
 * @param {algo.layout.Line} other - other line segment to intersect with
 * @returns {algo.layout.Vector}
 */
algo.layout.Line.prototype.intersectWithLine = function (other) {

    var result;

    var ua_t = (other.x2 - other.x1) * (this.y1 - other.y1) - (other.y2 - other.y1) * (this.x1 - other.x1);
    var ub_t = (this.x2 - this.x1) * (this.y1 - other.y1) - (this.y2 - this.y1) * (this.x1 - other.x1);
    var u_b = (other.y2 - other.y1) * (this.x2 - this.x1) - (other.x2 - other.x1) * (this.y2 - this.y1);

    if (u_b !== 0) {
        var ua = ua_t / u_b;
        var ub = ub_t / u_b;

        if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {

            result = new algo.layout.Intersection(new algo.layout.Vector(
                    this.x1 + ua * (this.x2 - this.x1),
                    this.y1 + ua * (this.y2 - this.y1)
            ));

            result.status = "Intersection";

        } else {
            result = new algo.layout.Intersection("No Intersection");
        }
    } else {
        if (ua_t === 0 || ub_t === 0) {
            result = new algo.layout.Intersection("Coincident");
        } else {
            result = new algo.layout.Intersection("Parallel");
        }
    }

    return result;
};

/**
 * intersect the line with a Box. This can result in 0,1,2 points of intersection.
 * @param box - any rectangle like object
 * @returns {algo.layout.Intersection}
 */
algo.layout.Line.prototype.intersectWithBox = function (box) {

    var result = new algo.layout.Intersection();

    result.addPoint(this.intersectWithLine(algo.layout.Line.topEdge(box)).point);
    result.addPoint(this.intersectWithLine(algo.layout.Line.rightEdge(box)).point);
    result.addPoint(this.intersectWithLine(algo.layout.Line.bottomEdge(box)).point);
    result.addPoint(this.intersectWithLine(algo.layout.Line.leftEdge(box)).point);

    result.status = result.points ? "Intersection" : "No Intersection";

    return result;
};

/**
 * line with circle intersection from
 * @param circle - circle like object (x/y/radius)
 * @returns {algo.layout.Intersection} - containing 0 or 1 or 2 points
 */
algo.layout.Line.prototype.intersectWithCircle = function (c) {

    var a1 = new algo.layout.Vector(this.x1, this.y1),
        a2 = new algo.layout.Vector(this.x2, this.y2),
        r = c.radius;

    var result;

    var a = (a2.x - a1.x) * (a2.x - a1.x) +
        (a2.y - a1.y) * (a2.y - a1.y);
    var b = 2 * ( (a2.x - a1.x) * (a1.x - c.x) +
        (a2.y - a1.y) * (a1.y - c.y)   );
    var cc = c.x * c.x + c.y * c.y + a1.x * a1.x + a1.y * a1.y -
        2 * (c.x * a1.x + c.y * a1.y) - r * r;
    var deter = b * b - 4 * a * cc;

    if (deter < 0) {
        result = new algo.layout.Intersection("Outside");
    } else if (deter === 0) {
        result = new algo.layout.Intersection("Tangent");
        // NOTE: should calculate this point
    } else {
        var e = Math.sqrt(deter);
        var u1 = ( -b + e ) / ( 2 * a );
        var u2 = ( -b - e ) / ( 2 * a );

        if ((u1 < 0 || u1 > 1) && (u2 < 0 || u2 > 1)) {
            if ((u1 < 0 && u2 < 0) || (u1 > 1 && u2 > 1)) {
                result = new algo.layout.Intersection("Outside");
            } else {
                result = new algo.layout.Intersection("Inside");
            }
        } else {
            result = new algo.layout.Intersection("Intersection");

            if (0 <= u1 && u1 <= 1)
                result.points.push(a1.lerp(a2, u1));

            if (0 <= u2 && u2 <= 1)
                result.points.push(a1.lerp(a2, u2));
        }
    }

    return result;
};

/**
 * get the angle in radians between the start and the end of the line
 * @return {number} angle in radians between start and end of line
 */
algo.layout.Line.prototype.angleStartEnd = function () {

    // first calculate the angle from this.x/this.y to this.p.x2/this.p.y2

    var rads = Math.atan2(this.y2 - this.y1, this.x2 - this.x1);

    // atan2 return negative PI radians for the 180-360 degrees ( 9 o'clock to 3 o'clock )

    if (rads < 0) {

        rads = 2 * Math.PI + rads;
    }

    return rads;
};

/**
 * a basic circle class.
 * @param cx
 * @param cy
 * @param radius
 * @constructor
 */
algo.layout.Circle = function (x, y, radius) {

    this.x = x;
    this.y = y;
    this.radius = radius;
};

/**
 * return a cloned copy of this
 */
algo.layout.Circle.prototype.clone = function () {

    return new algo.layout.Circle(this.x, this.y, this.radius);
};

/**
 * return a new Cicle inflated by the given signed delta
 * @param inflateX
 * @param inflateY
 */
algo.layout.Circle.prototype.inflate = function (delta) {

    return new algo.layout.Circle(this.x, this.y, this.radius + delta);
};

/**
 * axis aligned box
 * @param x
 * @param y
 * @param w
 * @param h
 * @constructor
 */
algo.layout.Box = function (x, y, w, h) {

    // initialize

    this.x = x || 0;
    this.y = y || 0;
    this.w = w || 0;
    this.h = h || 0;

    Object.defineProperty(this, 'r', {
        enumerable: true,
        get       : function () {

            return this.x + this.w;
        },
        set       : function (_r) {

            this.w = _r - this.x;
        }
    });

    Object.defineProperty(this, 'b', {
        enumerable: true,
        get       : function () {

            return this.y + this.h;
        },
        set       : function (_b) {

            this.h = _b - this.y;
        }
    });

    Object.defineProperty(this, 'cx', {
        enumerable: true,
        get       : function () {

            return this.x + this.w / 2;
        },
        set       : function (cx) {

            this.x = cx - this.w / 2;
        }
    });

    Object.defineProperty(this, 'cy', {
        enumerable: true,
        get       : function () {

            return this.y + this.h / 2;
        },
        set       : function (cy) {

            this.y = cy - this.h / 2;
        }
    });

    /**
     * get/set center as point/vector
     */
    Object.defineProperty(this, 'center', {
        enumerable: true,
        get       : function () {
            return new algo.layout.Vector(this.cx, this.cy);
        },
        set       : function (v) {

            this.cx = v.x;
            this.cy = v.y;
        }
    });

};

/**
 * return a new box that is this box multiplied by the given vector. This is useful for scaling boxes
 * @param {algo.layout.Vector} v
 * @return {algo.layout.Box}
 */
algo.layout.Box.prototype.mul = function (v) {

    return new algo.layout.Box(this.x * v.x, this.y * v.y, this.w * v.x, this.h * v.y);
};

/**
 * return a new box that is offset by the given vector
 * @param {algo.layout.Vector} v
 * @return {algo.layout.Box}
 */
algo.layout.Box.prototype.add = function (v) {

    return new algo.layout.Box(this.x + v.x, this.y + v.y, this.w, this.h);
};

/**
 * return a cloned copy of this
 */
algo.layout.Box.prototype.clone = function () {

    return new algo.layout.Box(this.x, this.y, this.w, this.h);
};

/**
 * return a new Box inflated by the given signed amount
 * @param inflateX
 * @param inflateY
 */
algo.layout.Box.prototype.inflate = function (inflateX, inflateY) {

    var b = new algo.layout.Box(this.x, this.y, this.w + inflateX * 2, this.h + inflateY * 2);
    b.cx = this.cx;
    b.cy = this.cy;
    return b;
};

/**
 * return true if the box have zero or negative extents in either axis
 */
algo.layout.Box.prototype.isEmpty = function () {

    return this.w <= 0 || this.h <= 0;
};

/**
 * horizontally align this box within another box using the given alignment [left, center, right]
 * @param {algo.layout.Box} other - the box which we are to be aligned in
 * @param {string} alignment - one of left,center,right
 */
algo.layout.Box.prototype.halign = function (other, alignment) {

    switch (alignment) {

        case 'center':
        {
            this.x = other.x + (other.w - this.w) / 2;
        }
            break;

        case 'right':
        {
            this.x = other.r - this.w;
        }
            break;

        default:
        {
            this.x = other.x;
        }
            break;
    }
};

/**
 * vertically align this box within another box using the given alignment [top, center, bottom]
 * @param {algo.layout.Box} other - the box which we are to be aligned in
 * @param {string} alignment - one of top, center, bottom
 */
algo.layout.Box.prototype.valign = function (other, alignment) {

    switch (alignment) {

        case 'center':
        {
            this.y = other.y + (other.h - this.h) / 2;
        }
            break;

        case 'bottom':
        {
            this.y = other.b - this.h;
        }
            break;

        default:
        {

            this.y = other.y;
        }

    }
};

/**
 * center ourselves in the given box
 * @param other
 */
algo.layout.Box.prototype.center = function (other) {

    this.halign(other, 'center');
    this.valign(other, 'center');
};

/**
 * return a new box that is the union of this box and some other box/rect like object
 * @param {algo.layout.Box|algo.render.Rectangle|*} box - anything with x,y,w,h properties
 * @returns algo.layout.Box - the union of this and box
 */
algo.layout.Box.prototype.union = function (box) {

    var u = new algo.layout.Box(
        Math.min(this.x, box.x),
        Math.min(this.y, box.y),
        0, 0
    );

    u.r = Math.max(this.r, box.x + box.w);
    u.b = Math.max(this.b, box.y + box.h);

    return u;
};

/**
 * return the union of the given boxes or an empty box if the list is empty
 * @static
 */
algo.layout.Box.union = function (boxes) {

    var u = new algo.layout.Box(0, 0, 0, 0);

    if (boxes && boxes.length) {

        u.x = _.min(boxes, function (box) {
            return box.x;
        }).x;

        u.y = _.min(boxes, function (box) {
            return box.y;
        }).y;

        u.r = _.max(boxes, function (box) {
            return box.r;
        }).r;

        u.b = _.max(boxes, function (box) {
            return box.b;
        }).b;
    }

    return u;
};

/**
 * return the intersection of this box with the other box
 * @param box
 */
algo.layout.Box.intersectWithBox = function (box) {

    // minimum of right edges

    var minx = Math.min(this.r, box.r);

    // maximum of left edges

    var maxx = Math.max(this.x, box.x);

    // minimum of bottom edges

    var miny = Math.min(this.b, box.b);

    // maximum of top edges

    var maxy = Math.max(this.y, box.y);

    // if area is greater than zero there is an intersection

    if (maxx < minx && maxy < miny) {

        var x = Math.min(minx, maxx);

        var y = Math.min(miny, maxy);

        var w = Math.max(minx, maxx) - x;

        var h = Math.max(miny, maxy) - y;

        return new algo.layout.Box(x, y, w, h);

    }

    return null;
};

/**
 * return an array of points or objects within this box. If a callback is provided then the object returns is
 * created by the callback which is invoked with the x/y position. If no callback is provided the resulting array
 * elements are of type algo.layout.Vector
 * @param {number} n - the number of objects to create
 * @param {Function} [callback] - optional callback for creating the object
 */
algo.layout.Box.prototype.pointSet = function (n, callback) {

    var results = [];
    var xgen = algo.core.randomFloat(this.x, this.r),
        ygen = algo.core.randomFloat(this.y, this.b);

    for (var i = 0; i < n; i += 1) {
        var p = new algo.layout.Vector(xgen(), ygen());
        results.push(callback ? callback(p.x, p.y) : p);
    }
    return results;
};

/**
 * create a grid layout within the given box with the given numbers of rows and columns.
 * We keep a reference to the original box object. You can change the bounds, rows and columns layer with
 * setBox and setRowsAndColumns
 */
algo.layout.GridLayout = function (box, rows, columns, options) {

    this.setBox(box);

    this.setRowsAndColumns(rows, columns);

    // clone and extend options.
    // inflateX/Y are values by which the returned boxes are inflated.

    this.options = _.defaults(_.clone(options || {}), {
        inflateX: 0,
        inflateY: 0
    });
};

/**
 * set the bounding box for the grid
 * @param box
 */
algo.layout.GridLayout.prototype.setBox = function (box) {

    this.box = box.clone();
};

/**
 * set the number of rows and columns
 * @param rows
 * @param columns
 */
algo.layout.GridLayout.prototype.setRowsAndColumns = function (rows, columns) {

    this.rows = rows;

    this.columns = columns;
};

/**
 * a box representing the bounds of the given cell.
 * @param {number} rowOrIndex - the row of the grid 0..this.rows-1 OR the index of the box 0..(this.rows * this.columns-1)
 * @param {number} [column] - the column of the grid 0..this.columns-1
 * @returns {algo.layout.Box}
 */
algo.layout.GridLayout.prototype.getBox = function (rowOrIndex, column) {

    // get row and column
    var r = arguments.length === 1 ? Math.floor(rowOrIndex / this.columns) : rowOrIndex;
    var c = arguments.length === 1 ? rowOrIndex % this.columns : column;

    // dimensions of boxes
    var cx = this.box.w / this.columns, cy = this.box.h / this.rows;

    // return box allowing for the optional inflation ( defaults to zero )
    return new algo.layout.Box(this.box.x + c * cx, this.box.y + r * cy, cx, cy).inflate(this.options.inflateX, this.options.inflateY);
};

/**
 * return a rectangle for the given row
 * @param {number} row
 * @returns {algo.layout.Box}
 */
algo.layout.GridLayout.prototype.getRowBox = function(row) {

    return this.getBox(row, 0).union(this.getBox(row, this.columns-1));
};

/**
 * return a rectangle for the given column
 * @param {number} row
 * @returns {algo.layout.Box}
 */
algo.layout.GridLayout.prototype.getColumnBox = function(col) {

    return this.getBox(0, col).union(this.getBox(this.rows-1, col));
};

/**
 * for debugging, create a visual representation of the layout, remove any previous
 * visualization of the layout
 */
algo.layout.GridLayout.prototype.debugShow = function () {

    if (this.debugElements) {
        this.debugElements.destroy();
    }

    this.debugElements = this.debugElements || new algo.render.ElementGroup();

    for (var y = 0; y < this.rows; y += 1) {
        for (var x = 0; x < this.columns; x += 1) {

            var b = this.getBox(y, x);

            var e = new algo.render.Rectangle({

                x          : b.x,
                y          : b.y,
                w          : b.w,
                h          : b.h,
                strokeWidth: 1,
                stroke     : 'lightgray',
                fill       : 'transparent'

            });

            this.debugElements.add(e);
        }
    }
};

/**
 * The binary tree layout strategy for heaps. s
 * @param {algo.core.BinaryTree} dataStructure
 * @constructor
 */
algo.layout.HeapTree = function (dataStructure) {

    algo.layout.Strategy.call(this, dataStructure);

    // make this.heap syntactic sugar for this.dataStructure

    this.heap = this.dataStructure;

    // we create and destroy edges as need. This is a hash of the edges
    // currently in use...The key is simple the index of the child vertex

    this.edgeMap = {};
};

algo.core.extends(algo.layout.Strategy, algo.layout.HeapTree);

/**
 * perform Knuth binary tree layout on a heap
 * @param {algo.layout.Box} box
 */
algo.layout.HeapTree.prototype.update = function (box) {

    // uses Knuth's simple binary tree layout algorithm. This results
    // in a simple x/y (column/row) position for each vertex. We then
    // use a algo.layout.GridLayout object to position each vertex
    // within the given bounding box

    // x position of nodes is a global while we perform the traversal,
    // maxDepth tracks how deep the tree is. vertexMap is used to store
    // the x/y position for each vertex for later updates

    var x = 0, maxDepth = 0, vertexMap = [];

    // the recursive function that traverses the tree and updates x, maxDepth
    // and vertexMap

    function traverseLayout(vertex, depth) {

        if (!this.heap.isNull(vertex)) {

            // keep track of max depth
            maxDepth = Math.max(maxDepth, depth);

            // go left first
            traverseLayout.call(this, this.heap.leftChild(vertex), depth + 1);

            // save position for this vertex
            vertexMap[vertex] = {
                x: x++,
                y: depth
            };

            // go right
            traverseLayout.call(this, this.heap.rightChild(vertex), depth + 1);
        }
    }

    // traverse from root, depth 1
    // TODO: Figure out why I have to use call here to preserve the scope???
    traverseLayout.call(this, algo.core.Heap.kROOT, 0);

    // create a grid layout using the calculate rows and columns required
    var grid = new algo.layout.GridLayout(box, maxDepth + 1, x);

    // now update the vertex and edge positions. Any edges that we are going to reuse will get moved
    // into 'newEdgeMap'. Any that remain in this.edgeMap after the update process will get destroyed.

    var newEdgeMap = {};

    // use a stack to recur into the structure rather than a recursive function.
    var stack = [algo.core.Heap.kROOT];

    while (stack.length) {

        var current = stack.pop();

        if (!this.heap.isNull(current)) {
            // get position for this vertex
            var p = vertexMap[current];
            // get box for this position
            var b = grid.getBox(p.y, p.x);
            // invoke the update method for the vertex, if there is one
            var e = this.heap.element(current);
            if (e) {
                this.heap.invoke('updateVertex', this.heap.value(current), e, {x: b.cx, y: b.cy});
            }
            // update the edge connecting this vertex to its parent
            var edge = this.edgeMap[current];

            // if the current vertex has a parent then we need to create/update its edge
            // otherwise the edge will be destroy at the end of the update process below

            if (!this.heap.isNull(this.heap.parent(current))) {
                if (!edge) {
                    edge = newEdgeMap[current] = this.heap.invoke('createEdge');
                } else {
                    // move to the newEdgeMap and remove from edgeMap so it is not destroyed
                    newEdgeMap[current] = edge;
                    delete this.edgeMap[current];
                }

                // get parent element and current element
                var e1 = this.heap.element(this.heap.parent(current));
                var e2 = this.heap.element(current);

                // update the edge
                this.heap.invoke('updateEdge', edge, e1, e2);
            }

            // repeat for children
            stack.push(this.heap.leftChild(current));
            stack.push(this.heap.rightChild(current));
        }

    }

    // any edges remaining in edgeMap must be destroyed and then we can swap
    // newEdgeMap and edgeMap

    _.each(this.edgeMap, _.bind(function(edge) {
        this.heap.invoke('destroyEdge', edge);
    }, this));

    this.edgeMap = newEdgeMap;

};


/**
 * The directed graph layout strategy is implemented using the dagre js library
 * https://github.com/cpettitt/dagre
 * @param {algo.core.Graph} dataStructure
 * @constructor
 */
algo.layout.GraphDirected = function (dataStructure, options) {

    algo.layout.Strategy.call(this, dataStructure);

    // syntactic sugar
    this.graph = dataStructure;

    // extend ourselves with the options so we don't have to write this.options.stiffness etc
    _.extend(this, _.defaults(options || {}, {

        vertexWidth   : 40,
        vertexHeight  : 40,
        nodeSeparation: 15,
        edgeSeparation: 15,
        rankSeparation: 15,
        direction     : "TB"

    }));

};

/**
 * Start the layout algorithm and run for the specified number of ms OR until the total energy
 * in the system goes below a threshold
 * @param {box} box - the bounding box for the layout
 */
algo.layout.GraphDirected.prototype.update = function (box) {

    // create and populate a dagre using from our graph data, ignore self connected edges and multi edges

    var g = new dagre.Digraph();

    // add all vertices and edges in our graph to the dagre graph

    _.each(this.graph.vertices, _.bind(function (v) {

        g.addNode(v.id, {label: v.id, width: this.vertexWidth, height: this.vertexHeight});

    }, this));

    // add all edges

    _.each(this.graph.edges, _.bind(function (v) {

        g.addEdge(v.id, v.source.id, v.target.id);

    }, this));

    // layout the graph

    var layout = dagre.layout()
        .nodeSep(this.nodeSeparation)
        .edgeSep(this.edgeSeparation)
        .rankSep(this.rankSeparation)
        .rankDir(this.direction)
        .run(g);

    // get graph size
    var graphSize = new algo.layout.Vector(layout.graph().width, layout.graph().height);

    // if the graph is larger than the box it will be scaled, if it is smaller it will be centered
    // these vectors are used to represent the scaling / translation to be applied to vertices and edge geometry

    var S = new algo.layout.Vector(1, 1), T = new algo.layout.Vector(0, 0);

    if (graphSize.x > box.w) {
        S.x = box.w / graphSize.x;
    } else {
        T.x = (box.w - graphSize.x) / 2;
    }

    if (graphSize.y > box.h) {
        S.y = box.h / graphSize.y;
    } else {
        T.y = (box.h - graphSize.y) / 2;
    }

    // add the original position of the box to the translation
    T = T.add(new algo.layout.Vector(box.x, box.y));

    var vertexBoxes = {};

    // update vertices
    layout.eachNode(_.bind(function (nodeName, node) {

        // get bounds of node/vertex
        var b = new algo.layout.Box(node.x - (node.width >> 1), node.y - (node.height >> 1), node.width, node.height);

        // apply scaling and translation
        b = b.mul(S).add(T);

        // save the vertex position for when we layout the edges
        vertexBoxes[nodeName] = b;

        // get vertex from the source graph
        var v = this.graph.vertices[nodeName];

        // call update vertex if owner created an element for this vertex
        if (v.element) {
            this.dataStructure.invoke('updateVertex', v, v.element, b, this.graph);
        }

    }, this));

    layout.eachEdge(_.bind(function (e, u, v, value) {

        // get center of vertices that are connected, the inflection point of the edge
        // will need to be transformed

        var start = vertexBoxes[u].center,
            end = vertexBoxes[v].center,
            middle = new algo.layout.Vector(value.points[0].x, value.points[0].y).multiply(S).add(T);

        // get edge from original graph

        var edge = this.graph.edges[e];

        // update edge if element exists
        if (edge.element) {
            this.dataStructure.invoke('updateEdge', edge, edge.element, start, middle, end, this.graph);
        }

    }, this));
};












































