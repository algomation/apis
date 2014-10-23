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

/*globals _, document, window, $*/
"use strict";

/**
 * namespaces for the render library
 * @namespace algo
 */
var algo = algo || {};

/**
 * @namespace
 */
algo.render = algo.render || {};

/**
 * the base class of renderable elements e.g. algo.render.Rectangle etc.
 * @class
 * @param _options
 * @constructor
 * @abstract
 */
algo.render.Element = function (_options) {

    // clone options and extend the options with defaults

    var options = _.defaults(_.clone(_options || {}), {
        type       : 'Element',
        strokeWidth: 1,
        fontSize   : '40px',
        rotation   : 0
    });

    // All elements will use the state:algo.render.kS_NORMAL ** UNLESS they specify another state or any of the
    // properties fill, stroke, pen in their constructor options.

    if (!algo.core.hasAny(options, 'state', 'stroke', 'fill', 'pen')) {
        options.state = algo.render.kS_NORMAL;
    }

    // default x/y to zero UNLESS they are already set ( including via a shape )
    if (!options.x && !options.shape) {
        options.x = 0;
    }
    if (!options.y && !options.shape) {
        options.y = 0;
    }

    // create our ID and add to static map of elements

    this.id = 'algoid-' + algo.render.Element.nextID++;
    algo.render.Element.map[this.id] = this;

    // create empty child collection
    this.children = new algo.render.ElementGroup();

    // add default states, this must be done before applying caller initial configuration since that may reference
    // these states
    this.addStates([
        {
            name      : algo.render.kS_NORMAL,
            properties: {fill: algo.Color.iWHITE, stroke: algo.Color.iBLUE, pen: algo.Color.iBLUE}
        },
        {
            name      : algo.render.kS_FADED,
            properties: {fill: algo.Color.iWHITE, stroke: algo.Color.iGRAY, pen: algo.Color.iGRAY}
        },
        {
            name      : algo.render.kS_BLUE,
            properties: {fill: algo.Color.iBLUE, stroke: algo.Color.iBLUE, pen: algo.Color.iWHITE}
        },
        {
            name      : algo.render.kS_GRAY,
            properties: {fill: algo.Color.iGRAY, stroke: algo.Color.iGRAY, pen: algo.Color.iWHITE}
        },
        {
            name      : algo.render.kS_ORANGE,
            properties: {fill: algo.Color.iORANGE, stroke: algo.Color.iORANGE, pen: algo.Color.iWHITE}
        },
        {
            name      : algo.render.kS_RED,
            properties: {fill: algo.Color.iRED, stroke: algo.Color.iRED, pen: algo.Color.iWHITE}
        },
        {
            name      : algo.render.kS_GREEN,
            properties: {fill: algo.Color.iGREEN, stroke: algo.Color.iGREEN, pen: algo.Color.iWHITE}
        },
        {
            name      : algo.render.kS_CYAN,
            properties: {fill: algo.Color.iCYAN, stroke: algo.Color.iCYAN, pen: algo.Color.iWHITE}
        }
    ]);

    // apply options to elements
    this.set(options);
};

/* The following are constants for use with the 'state' property of elements */
/**
 * @const The normal display state
 */
algo.render.kS_NORMAL = 'ks_normal';

/**
 * @const The faded / disabled display state
 */
algo.render.kS_FADED = 'ks_faded';

/**
 * @const The blue display state
 */
algo.render.kS_BLUE = 'ks_blue';

/**
 * @const The deselected display state
 */
algo.render.kS_GRAY = 'ks_gray';

/**
 * @const The orange display state
 */
algo.render.kS_ORANGE = 'ks_orange';

/**
 * @const The red display state
 */
algo.render.kS_RED = 'ks_red';

/**
 * @const The green display state
 */
algo.render.kS_GREEN = 'ks_green';

/**
 * @const The cyan display state
 */
algo.render.kS_CYAN = 'ks_cyan';

/**
 * return the given CSS property name appropriately prefixed for the browser we are on.
 * Since method will only work correctly when inside the DOM, and therefore is only
 * available to the element through methods like updateDOM.
 * NOTE. It is also dumb, its simple prefixes the given string with the browser prefix.
 *
 * @param {string} propertyName
 */
algo.render.Element.prefixed = function (propertyName) {

    // generate browser prefix if this is the first call

    if (!algo.render.Element.browserPrefix) {

        var styles = window.getComputedStyle(document.documentElement, ''),
            pre = (Array.prototype.slice
                .call(styles)
                .join('')
                .match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
            )[1],
            dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1];

        algo.render.Element.browserPrefix = {
            dom      : dom,
            lowercase: pre,
            css      : '-' + pre + '-',
            js       : pre[0].toUpperCase() + pre.substr(1)
        };
    }

    return algo.render.Element.browserPrefix.css + propertyName;
};

/**
 * apply the properties of the state specified by name e.g. algo.render.kS_BLUE, but could be any name including custom
 * states supplied by user
 * @param {string} stateName
 */
algo.render.Element.prototype.setState = function (stateName) {

    this.states = this.states || {};
    var state;

    // element properties can be values or arrays of values, so handle both

    if (_.isArray(stateName)) {

        // we have an array of state names e.g.  [ "S1", "S2", "S3" ], representing potentially different sets of properties.
        // We need to translate these state names into arrays of properties to set e.g. fill: [1,2,3], stroke: [a,b,c]

        var properties = {};

        // iterate each state named in the array

        _.each(stateName, _.bind(function (name) {

            state = this.states[name];
            if (!state) {
                throw new Error("Attempt to apply unregistered state ( " + stateName + " ) to element:" + this.id);
            }

            // take the properties of the state and add the master list
            _.each(state.properties, _.bind(function (value, key) {

                // create properties value array as needed and add the value
                properties[key] = properties[key] || [];
                properties[key].push(value);

            }, this));

            // so here an array of states if now an object containing property name keys and values, which
            // we can set directly

            this.set(properties);

        }, this));

    } else {

        state = this.states[stateName];
        if (state) {
            this.set(state.properties);
        } else {
            throw new Error("Attempt to apply unregistered state ( " + stateName + " ) to element:" + this.id);
        }
    }
};

/**
 * when you want to reset the element class i.e. when restarting the animation.
 */
algo.render.Element.resetClass = function () {

    // reset ID and map of elements ID's to elements

    algo.render.Element.nextID = 0;

    algo.render.Element.map = {};
};

/**
 * start history mode which basically means remember currently allocated elements and reset
 */
algo.render.Element.enterHistoryMode = function () {

    if (algo.render.Element.history) {
        throw new Error("Element class is already in history mode");
    }

    algo.render.Element.history = {
        nextID: algo.render.Element.nextID,
        map   : algo.render.Element.map
    };

    algo.render.Element.resetClass();
};

/**
 * exit history mode
 */
algo.render.Element.exitHistoryMode = function () {

    if (!algo.render.Element.history) {
        throw new Error("Element class was not in history mode");
    }

    algo.render.Element.nextID = algo.render.Element.history.nextID;
    algo.render.Element.map = algo.render.Element.history.map;

    delete algo.render.Element.history;
};

/**
 * find an element by its id
 * @param id
 */
algo.render.Element.findElement = function (id) {

    return algo.render.Element.map[id];
};

/**
 * get the value for the given property from the object or the nearest parent where it is set.
 * if the property is not found in the chain then return the default value
 * @param key
 */
algo.render.Element.prototype.getInheritedValue = function (key, defaultValue) {

    var obj = this;

    while (obj) {

        if (obj.hasOwnProperty(key)) {
            return obj[key];
        }

        obj = obj.parent;
    }

    // if here nobody has the property so return the default

    return defaultValue;
};

/**
 * get the value for the given property from the object if set otherwise return the default value
 * @param key
 */
algo.render.Element.prototype.getOwnValue = function (key, defaultValue) {

    if (this.hasOwnProperty(key)) {
        return this[key];
    }

    return defaultValue;
};

/**
 * shallow clone the properties from the object, using inheritance to fill values if not present on the object.
 * Values that are not present will be left untouched and therefore can be pre-filled with defaults.
 * @param properties
 * @return {object} a new properties objects with requested values.
 */
algo.render.Element.prototype.get = function (properties) {

    var p = _.clone(properties);

    _.each(p, function (defaultValue, key) {

        p[key] = this.getInheritedValue(key, defaultValue);

    }, this);

    return p;

};


/**
 * apply all the properties in options. child class should overload by but call the base class to ensure
 * base class properties are set as well.
 * @param options
 * @depth {number} depth - is the how deep in the child tree should be apply the options. Its defaults to zero
 *                         which means it will apply only to the element. If called with 1, the options will apply
 *                         to the element and its immediately children and so on.
 *                         Since depth is only tested for truthiness at each level and decremented on recursive calls
 *                         omitting (undefined) or setting to NaN, -1 etc will cause the options to be applied at all levels of the child tree.
 */
algo.render.Element.prototype.set = function (options, _depth) {

    // count changes to the element, if it is zero after applying the options we don't need to update it

    var changes = 0;

    var depth = _depth || 0;

    if (options) {

        // set other properties

        _.each(options, function (value, key) {

            // set all options

            switch (key) {

                case 'parent':
                {
                    // if already parent then remove from existing parent

                    if (this.parent) {
                        this.parent.removeChild(this);
                    }

                    // add ourselves as a child of the given value, count this is a change

                    value.addChild(this);

                    changes += 1;
                }
                    break;

                case 'states':
                {
                    this.addStates(value);

                    // this doesn't count as a change ! since defining states doesn't produce any difference
                    // until the state is changed

                }
                    break;

                case 'state':
                {

                    // apply a set of properties from the named state

                    this.setState(value);

                    changes += 1;

                }
                    break;

                case 'shape':
                {

                    // shape is a generic property that is meaningful to the particular class only e.g.
                    // an algo.render.Line instance can have its x1/y1/x2/y2 properties set by any shape with
                    // the same properties e.g. algo.render.Line, algo.layout.Line, {x1:0, y1: 0 x2: 0, y2: 0} etc

                    this.fromShape(value);

                    // fromShape will just write to the appropriate properties, so we must mark as a change

                    changes += 1;

                }
                    break;

                // all other options simply set properties on the element of the same name

                default:
                {
                    if (this[key] !== value) {
                        this[key] = value;
                        changes += 1;
                    }
                }
                    break;
            }

        }, this);

        // create update command, but apply only if there were changes

        if (changes) {
            algo.SURFACE.elementUpdated(this, options);
        }

        // if we have no parent AND no parent was specified AND this is not the root element then append to the root

        if (!this.parent && !options.parent && !options.root && this.id !== 'algoid-0') {
            algo.SURFACE.root.addChild(this);
        }

    }

    // apply properties to children if depth if truthy

    if (depth) {
        _.each(this.children.elements, function (child) {

            // decrease depth when applying to children.

            child.set(options, depth - 1);

        }, this);
    }
};

/**
 * add new states in the given object
 * @param states
 */
algo.render.Element.prototype.addStates = function (states) {

    this.states = this.states || {};
    _.each(states, function (state) {
        this.states[state.name] = {properties: _.clone(state.properties)};
    }, this);
};

/**
 * this is static version of the algo.render.Element.prototype.set
 * Since it does not operate on a specific instance it accepts a variable number of arguments with an
 * optional final depth parameter which defaults to zero. The optional arguments must be individual element instances
 * or arrays or elements or objects with properties that are elements. You can supply objects or arrays which do not exclusively hold
 * element, objects of other types will be ignored.
 * The .set method of each element will be called e.g.
 *
 * algo.render.Element.set({x:0}, element1, "abc", element2, [element3, element4, { element: element5}, 3.1415;
 *
 * would invoke set on element1, element2, element3, element4, element5
 *
 * @param options
 * @param {...elements} var_args - zero or more element instances or arrays of element instances
 * @param [depth] - if the last argument is a number it is passed as the depth parameter to the instances set method
 * @static
 */
algo.render.Element.set = function (options) {

    // set depth to zero or the supplied value

    var args = _.toArray(arguments);
    var depth = _.isNumber(_.last(args)) ? args.pop() : 0;

    // iterate elements following required options argument
    for (var i = 1; i < args.length; i += 1) {

        // check the type, might be an array, and object or an instance of an element
        var x = args[i];

        if (x instanceof algo.render.Element) {
            // for an instance of Element we call directly.
            x.set(options, depth);
        } else {
            // for arrays of object or objects with properties that are elements we need to iterate
            _.each(x, function (y) {
                if (y instanceof algo.render.Element) {
                    y.set(options, depth);
                }
            }, this);
        }
    }
};

/**
 * get our geometry from some other shape. This is meaningfully implemented in progeny objects
 * @param {Object} shape - any object that shares the geometrical properties of the
 * @abstract
 */
algo.render.Element.prototype.fromShape = function (shape) {

};

/**
 * return a CSS color specification from any object / string that can be used to construct an algo.Color
 * @param {String|algo.Color} obj
 * @returns {String} - for colors with alpha === 1.0 it will be '#xxxxxx', otherwise 'rgba(x,x,x,x)'
 * NOTE: This should have been static but its too late now...just use algo.render.Element.prototype.getCSSColor.call(null, obj)
 */
algo.render.Element.prototype.getCSSColor = function (obj) {

    var color = obj;

    if (!(obj instanceof algo.Color)) {
        color = new algo.Color(obj);
    }

    return color.toCSS();
};

/**
 * each element is assigned a unique ID upon construction. This ID is used as an attribute within the element
 * to make finding the element in the DOM easier.
 */
algo.render.Element.nextID = 0;

/**
 * if true then new elements get the fade in keyframe animation. During history update the fade in effect is
 * unattractive since you are skipping between frames quickly
 * @type {boolean}
 */
algo.render.Element.fadeIn = true;

/**
 * create the DOM element for this instance. The base class is simply an absolutely positioned div
 */
algo.render.Element.prototype.createDOM = function () {

    var s = _.sprintf('<div class="algo-element algo-transition %s"><div class="algo-element-text algo-transition"></div></div>',
        algo.render.Element.fadeIn ? "algo-element-fadein" : "");

    this.dom = $(s);

    // add our ID as an attribute

    this.dom.attr('id', this.id);

    this.textSpan = $('.algo-element-text', this.dom);

    // append to parent if we have one

    if (this.parent) {

        this.dom.appendTo(this.parent.dom);
    }
};

/**
 * get an object with our CSS properties. These are combined with those of inheriting classes
 * to construct the full set of CSS properties for this element
 */
algo.render.Element.prototype.updateDOM = function () {

    // holds properties for the primary DOM element

    var prop = {};

    // holds properties for the text span

    var tprop = {};

    // fill property is applied to the background

    prop['background-color'] = this.getCSSColor(this.getInheritedValue('fill', 'transparent'));

    // gradients are set via the css3 background-image property

    prop['background-image'] = this.getInheritedValue('gradient', 'none');

    // stroke width is applied to the border width

    var sw = this.getInheritedValue('strokeWidth', 0);

    prop.border = sw + 'px solid ' + this.getCSSColor(this.getInheritedValue('stroke', 'transparent'));

    // opacity

    prop.opacity = this.getInheritedValue('opacity', 1);

    // visibility

    prop.visibility = this.getInheritedValue('visible', 'visible');

    // z is converted to z-index

    prop['z-index'] = this.getOwnValue('z', 0);

    // pen color is applied to text

    tprop.color = this.getCSSColor(this.getInheritedValue('pen', 'black'));

    // font-size is applied to text

    tprop['font-size'] = this.getInheritedValue('fontSize', '12px');

    // text align is also applied to text element

    tprop['text-align'] = this.getInheritedValue('textAlign', 'center');

    // basic position, scaling and rotation use inherited values except for x/y which must be set on each
    // element that uses them.

    var x = this.x,
        y = this.y,
        sx = this.getOwnValue('scaleX', 1),
        sy = this.getOwnValue('scaleY', 1),
        r = this.getOwnValue('rotation', 0);

    // property name must be prefixed

    var transform = algo.render.Element.prefixed('transform');

    prop[transform] = _.sprintf('translate3d(%.0fpx, %.0fpx, 0) rotate(%.2fdeg) scale(%.2f, %.2f)', x, y, r, sx, sy);

    // apply to element and text element

    this.dom.css(prop);

    this.textSpan.css(tprop);

    // set text, which is never inherited

    this.textSpan.text(this.text);
};

/**
 * ensure the DOM is created and updated and apply the same procedure to our children
 */
algo.render.Element.prototype.update = function () {

    if (!this.dom) {

        this.createDOM();
    }

    this.updateDOM();

    _.each(this.children.elements, function (c) {

        c.update();

    }, this);

};

/**
 * add a child element
 * @param e
 */
algo.render.Element.prototype.addChild = function (e) {

    // add the new child using its id as the key
    this.children.add(e);

    // set the elements parent to ourselves, record the ID since the parent object is not transmitted between worker and DOM

    e.parent = this;
    e.parentID = this.id;

};

/**
 * remove the child from this elements child collection
 * @param e
 */
algo.render.Element.prototype.removeChild = function (e) {

    this.children.remove(e);

    delete e.parent;

    delete e.parentID;
};

/**
 * destroyy the element, remove from parent. Destroy all children first, then ourselves.
 */
algo.render.Element.prototype.destroy = function () {

    // can only be destroyed once

    if (this.destroyed) {
        throw new Error("Destroy already called in Element::destroy");
    }

    // destroy children first

    this.children.destroy();

    // now, ourselves, remove from parent

    if (this.parent) {

        this.parent.removeChild(this);
    }

    // remove DOM if present

    if (this.dom) {

        this.dom.remove();

        delete this.dom;
    }

    // tell surface we have been removed

    algo.SURFACE.elementDestroyed(this);

    // remove from element map

    if (!algo.render.Element.map[this.id]) {
        throw new Error("Missing Element");
    }

    delete algo.render.Element.map[this.id];

    // flag as destroyed

    this.destroyed = true;
};

/**
 * position / size the element within the given algo.render.Box object. The meaning is deferred to inheriting classes
 * @param layout
 */
algo.render.Element.prototype.layout = function (box) {

    // base class just centers itself in the box

    this.set({
        x: box.cx,
        y: box.cy
    });
};

/**
 * position and size to fill the given box
 * @param layout
 */
algo.render.Element.prototype.fillBox = function (box) {

    // base class just centers itself in the box

    this.set({
        x: box.x,
        y: box.y,
        w: box.w,
        h: box.h
    });
};

/**
 * a box object representing our bounds
 */
algo.render.Element.prototype.getBounds = function () {

    // base class returns an empty box centered on our position

    return new algo.layout.Box(this.x, this.y, 0, 0);
};

/* ---------------------------------------------------- RECTANGLE ----------------------------------------------------*/

// **Rectangle** object constructor
/**
 * @class algo.render.Rectangle
 * @augments algo.render.Element
 * @param _options
 * @constructor
 */
algo.render.Rectangle = function (_options) {

    // options object gets modified so pass along a clone so we don't change the users object

    var options = _.clone(_options || {});

    // base class constructor with defaults

    algo.render.Element.call(this, _.defaults(options, {

        type        : 'Rectangle',
        cornerRadius: 0

    }));

};
/**
 * Rectangle extends Element
 */
algo.core.extends(algo.render.Element, algo.render.Rectangle);

/**
 * create a rectangle with the most basic options. Syntactic sugar
 * @param box
 * @param stroke
 * @param fill
 * @param strokeWidth
 */
algo.render.Rectangle.create = function (box, stroke, fill, strokeWidth) {

    return new algo.render.Rectangle({
        shape      : box,
        stroke     : stroke,
        fill       : fill,
        strokeWidth: strokeWidth
    });
};

/**
 * get the DOM element for this rectangle.
 */
algo.render.Rectangle.prototype.createDOM = function () {

    // our dom is identical the base element DOM

    algo.render.Element.prototype.createDOM.call(this);
};

algo.render.Rectangle.prototype.updateDOM = function () {

    // super class first

    algo.render.Element.prototype.updateDOM.call(this);

    // then this instance ( using integer widths seems to improve rendering on FireFox )

    var w = this.getInheritedValue('w', 0) >> 0,
        h = this.getInheritedValue('h', 0) >> 0,
        cr = this.getInheritedValue('cornerRadius', 0);


    // then this instance

    var prop = {
        width          : w + 'px',
        height         : h + 'px',
        'border-radius': cr + 'px'
    };

    // NOTE: There is a problem with scaled rectangles with a 1px stroke. One or more borders may randomly
    // disappear as the element is scaled since border widths are scaled as well.
    // There are no good fixes for this problem ( how do you draw a line that is 0.5 of a pixel thick? ) but
    // you can fake it by setting a corner radius of at least 1px! This forces the browser to anti-alias the border
    // as a curve so helping to make the border re-appear

    if (this.strokeWidth === 1 && cr === 0) {
        prop['border-radius'] = '1px'
    }

    this.dom.css(prop);

};

/**
 * position / size the element within the given algo.render.Box object. The meaning is deferred to inheriting classes
 * @param {algo.layout.Box}
 */
algo.render.Rectangle.prototype.layout = function (box) {

    // for now just center ourselves in the box

    this.set({
        x: box.cx - this.w / 2,
        y: box.cy - this.h / 2
    });
};

/**
 * get our geometry from some other rectangle or circle like object.
 * @param {Object} shape - some line like object
 */
algo.render.Rectangle.prototype.fromShape = function (shape) {

    if (algo.core.isCircleLike(shape)) {
        this.set({x: shape.x - shape.radius, y: shape.y - shape.radius, w: shape.radius * 2, h: shape.radius * 2});
    } else if (algo.core.isRectLike(shape)) {
        this.set({x: shape.x, y: shape.y, w: shape.w, h: shape.h});
    } else if (algo.core.isPointLike(shape)) {
        this.set({x: shape.x - this.w / 2, y: shape.y - this.h / 2});
    } else {
        throw new Error("algo.render.Rectangle.fromShape called with unrecognized shape");
    }
};

/**
 * center on the given x/y location
 * @param layout
 */
algo.render.Rectangle.prototype.center = function (x, y) {

    // for now just center ourselves in the box

    this.set({
        x: x - this.w / 2,
        y: y - this.h / 2
    });
};

/**
 * a box object representing our bounds
 */
algo.render.Rectangle.prototype.getBounds = function () {

    // return our bounds

    return new algo.layout.Box(this.x, this.y, this.w, this.h);
};

/* ------------------------------------------------------ LETTER TILE -------------------------------------------------*/

/**
 * A rectangle with center text and optional text at top right. It is useful for displaying strings for example where
 * you want to display both the character and the index at each location.
 * @constructor
 */
algo.render.LetterTile = function (_options) {

    // options object gets modified so pass along a clone so we don't change the users object

    var options = _.defaults(_.clone(_options || {}, {
        type        : 'LetterTile',
        cornerRadius: 0
    }));

    // if not shape or w/h was set then make them 50...for backwards compatibility

    if (!options.shape && !options.w) {
        options.w = 50;
    }

    if (!options.shape && !options.h) {
        options.h = 50;
    }

    // base class constructor with defaults

    algo.render.Rectangle.call(this, options);

};

algo.core.extends(algo.render.Rectangle, algo.render.LetterTile);

/**
 * set is overloaded so we can keep the value element sized correctly and displaying the correct text
 * @param options
 * @param _depth
 */
algo.render.LetterTile.prototype.set = function (options, _depth) {

    // base class first
    algo.render.Rectangle.prototype.set.call(this, options, _depth);

    // create the text label that is positioned at the top of us.

    // NOTE: For the DOM side zombie we don't need to create the child in the ctor
    // since the calls to children's ctor are captured as commands and passed to the DOM side

    if (algo.SURFACE.isWorker && !this.valueElement) {

        this.valueElement = new algo.render.Rectangle({

            x          : 0,
            y          : 0,
            w          : 0,
            h          : 0,
            parent     : this,
            fill       : algo.Color.iTRANSPARENT,
            strokeWidth: 0,
            fontSize   : 16,
            textAlign  : 'right',
            text       : ''

        });
    }

    // now update the value element
    if (this.valueElement) {

        var fontSize = 12;
        var inset = 4;

        this.valueElement.set({
            y       : inset,
            w       : this.w - inset,
            h       : fontSize,
            pen     : this.pen,
            fontSize: fontSize + 'px',
            text    : this.value
        });
    }
};

/**
 * circle class, positioned via center
 * @param _options
 * @constructor
 */
algo.render.Circle = function (_options) {

    // options object gets modified so pass along a clone so we don't change the users object

    var options = _.clone(_options || {});

    // add our type into the options

    algo.render.Element.call(this, _.defaults(options, {
        type: 'Circle'
    }));

};
/**
 * Circle extends Element
 */
algo.core.extends(algo.render.Element, algo.render.Circle);

/**
 * get our geometry from some other circle or rectangle like object.
 * @param {Object} shape - some line like object
 */
algo.render.Circle.prototype.fromShape = function (shape) {

    if (algo.core.isCircleLike(shape)) {
        this.set({
            x: shape.x,
            y: shape.y,
            radius: shape.radius
        });
    } else if (algo.core.isRectLike(shape)) {
        this.set({
            x: shape.x + shape.w / 2,
            y: shape.y + shape.h / 2,
            radius: Math.min(shape.w, shape.h) / 2
        });
    } else if (algo.core.isPointLike(shape)) {
        this.set({
            x: shape.x,
            y: shape.y
        });
    } else {
        throw new Error("algo.render.Circle.fromShape called with unrecognized shape");
    }

};
/**
 * get the DOM element for this circle.
 */
algo.render.Circle.prototype.createDOM = function () {

    // our dom is identical the base element DOM

    algo.render.Element.prototype.createDOM.call(this);

};

/**
 * update to current properties
 */
algo.render.Circle.prototype.updateDOM = function () {

    // super class first

    algo.render.Element.prototype.updateDOM.call(this);

    // then this instance

    var x = this.x,
        y = this.y,
        sx = this.getOwnValue('scaleX', 1),
        sy = this.getOwnValue('scaleY', 1),
        r = this.getOwnValue('rotation', 0),
        R = this.getInheritedValue('radius', 10),
        sw = this.getInheritedValue('strokeWidth', 0);

    // circles are positioned via center, calculate the negative offset required

    var o = -(R + sw);

    // width and height
    var size = _.sprintf('%.0fpx', R << 1);

    var prop = {
        width          : size,
        height         : size,
        'border-radius': '100%'
    };

    //var transform = 'translate3d(' + (x + o) + 'px,' + (y + o) + 'px' + ',0) ' +
    //    'rotate(' + r + 'deg) ' +
    //    'scale(' + sx + ',' + sy + ')';

    var transform = _.sprintf('translate3d(%.0fpx, %.0fpx, 0px) rotate(%.2fdeg) scale(%.2f, %.2f)', x + o, y + o, r, sx, sy);

    // apply with and without browser prefix

    prop[algo.render.Element.prefixed('transform')] = transform;
    prop.transform = transform;

    this.dom.css(prop);
};

/**
 * layout bounds
 * @returns {algo.layout.Box}
 */
algo.render.Circle.prototype.getBounds = function () {

    return new algo.layout.Box(this.x, this.y, this.R * 2, this.R * 2);
};

/**
 * stroked and filled line, defined by properties x/y/x2/y2
 * NOTE: Due to the way CSS transforms are applied the stroke, if any, will be included as part of the line.
 * For now I recommend not using strokes on lines.
 */
algo.render.Line = function (_options) {

    // lines use their fill color as their primary color so set adjust their states accordingly
    var lineStates = [
        {
            name      : algo.render.kS_NORMAL,
            properties: {fill: algo.Color.iBLUE}
        },
        {
            name      : algo.render.kS_BLUE,
            properties: {fill: algo.Color.iBLUE}
        },
        {
            name      : algo.render.kS_GRAY,
            properties: {fill: algo.Color.iGRAY}
        },
        {
            name      : algo.render.kS_FADED,
            properties: {fill: algo.Color.iGRAY}
        },
        {
            name      : algo.render.kS_ORANGE,
            properties: {fill: algo.Color.iORANGE}
        },
        {
            name      : algo.render.kS_RED,
            properties: {fill: algo.Color.iRED}
        },
        {
            name      : algo.render.kS_CYAN,
            properties: {fill: algo.Color.iCYAN}
        }
    ];

    // lines required a modification to the default display states since they are rendered using their fill color

    var options = _.clone(_options || {});

    // add the default states to the given states if there are any, allowing the user states to overwrite the defaults
    // if provided

    if (options.states) {
        options.states = lineStates.concat(options.states);
    } else {
        options.states = lineStates;
    }

    // if no display properties were set in the constructor apply the default state

    if (!algo.core.hasAny(options, 'state', 'fill')) {
        options.state = algo.render.kS_NORMAL;
    }

    // progenitor constructor first
    algo.render.Element.call(this, _.defaults(options, {
        type       : 'Line',
        thickness  : 1,
        strokeWidth: 0
    }));

};

// **Line** extends the object **Element**
algo.core.extends(algo.render.Element, algo.render.Line);

/**
 * get the DOM element for this line.
 */
algo.render.Line.prototype.createDOM = function () {

    // our dom is identical the base element DOM

    algo.render.Element.prototype.createDOM.call(this);

};

/**
 * update to current properties
 */
algo.render.Line.prototype.updateDOM = function () {

    // super class first

    algo.render.Element.prototype.updateDOM.call(this);

    // then this instance

    var p = this.get({
        x1         : 0,
        y1         : 0,
        x2         : 0,
        y2         : 0,
        thickness  : 1,
        strokeWidth: 0,
        inset      : 0
    });

    // now calculate the length of the line which becomes the width of the div

    var len = Math.sqrt(((p.x2 - p.x1) * (p.x2 - p.x1)) + ((p.y2 - p.y1) * (p.y2 - p.y1)));

    // if the line is inset then adjust start/end points

    if (p.inset) {

        // clamp inset to 1/2 length, less 2 pixels so that the line never
        // collapses to a point

        p.inset = Math.min((len - 4) / 2, p.inset);

        // get delta x/y

        var dx = p.x2 - p.x1, dy = p.y2 - p.y1;

        // normalize, while avoiding / 0 errors

        var nx = (dx / len) || 0, ny = (dy / len) || 0;

        // get x inset

        var xi = nx * p.inset;

        var yi = ny * p.inset;

        // adjust end points

        p.x1 += xi;

        p.y1 += yi;

        p.x2 -= xi;

        p.y2 -= yi;

    }

    // first calculate the angle from this.x/this.y to this.p.x2/this.p.y2

    var rads = Math.atan2(p.y2 - p.y1, p.x2 - p.x1);

    // atan2 return negative PI radians for the 180-360 degrees ( 9 o'clock to 3 o'clock )

    if (rads < 0) {

        rads = 2 * Math.PI + rads;
    }

    // now calculate the length of the line which becomes the width of the div

    len = Math.sqrt(((p.x2 - p.x1) * (p.x2 - p.x1)) + ((p.y2 - p.y1) * (p.y2 - p.y1)));

    // get total thickness or line

    var t = p.thickness + p.strokeWidth * 2;

    // set DOM with our transform, thickness and width (len)

    var prop = {
        width          : _.sprintf('%.0fpx', len),
        height         : _.sprintf('%.0fpx', p.thickness),
        'border-radius': _.sprintf('%.0fpx', t / 2)
    };

    var origin = _.sprintf('0px %.0fpx', t / 2);

    var transform = _.sprintf('translate(%.0fpx, %.0fpx) rotate(%.2frad)', p.x1, p.y1 - t / 2, rads);

    prop[algo.render.Element.prefixed('transform-origin')] = origin;

    prop[algo.render.Element.prefixed('transform')] = transform;

    prop['transform-origin'] = origin;

    prop.transform = transform;

    this.dom.css(prop);

};

/**
 * line instances are isomorphic with Line so we can
 * @param other
 * @returns {point|min.point|algo.layout.Intersection.point|Function|algo.point}
 */
algo.render.Line.prototype.intersectWithLine = function (other) {

    return algo.layout.Line.prototype.intersectWithLine.call(this, other).point;
};

algo.render.Line.prototype.intersectWithBox = function (other) {

    return algo.layout.Line.prototype.intersectWithBox.call(this, other).points;
};

/**
 * get our geometry from some other line like object.
 * @param {Object} shape - some line like object
 */
algo.render.Line.prototype.fromShape = function (shape) {

    if (!algo.core.isLineLike(shape)) {
        throw new Error("Not line like shape in algo.render.Line::fromShape");
    }

    this.set({
        x1: shape.x1,
        y1: shape.y1,
        x2: shape.x2,
        y2: shape.y2
    });

};

/**
 * Due to limitations of CSS arrows are constrained to 1px thickness. Arrows are a fixed size also.
 * use startArrow: [true,false] and endArrow: [true, false] to control the visibility of the arrow heads.
 * @class algo.render.Arrow
 * @constructor
 * @inherits algo.render.Element
 */
algo.render.Arrow = function (options) {

    // base class constructor

    algo.render.Line.call(this, _.defaults(options, {
        type      : 'Arrow',
        startArrow: true,
        endArrow  : true
    }));

};

algo.core.extends(algo.render.Line, algo.render.Arrow);

/**
 * get the DOM element for this line.
 */
algo.render.Arrow.prototype.createDOM = function () {

    // our dom is identical the base element DOM

    algo.render.Element.prototype.createDOM.call(this);

    // but then... we add two additional divs with the appropriate CSS classes for the arrows

    this.startElement = $('<div class="algo-startarrow algo-transition"></div>');
    this.startElement.appendTo(this.dom);

    this.endElement = $('<div class="algo-endarrow algo-transition"></div>');
    this.endElement.appendTo(this.dom);

};

/**
 * update to current properties
 */
algo.render.Arrow.prototype.updateDOM = function () {

    // all the line css will be set by the base class

    algo.render.Line.prototype.updateDOM.call(this);

    // .. we just need to control the visibility and color of the arrows and set arrow color correctly

    var startCSS = {display: 'none'}, endCSS = {display: 'none'};

    if (this.startArrow) {

        // the color of the arrow is set on the object is ancestor or as a last resort is the ancestors fill color

        startCSS = {
            display             : 'block',
            'border-right-color': this.getCSSColor(this.getInheritedValue('startArrowColor', this.getInheritedValue('fill', algo.Color.iBLUE)))
        };
    }

    if (this.endArrow) {

        // the color of the arrow is set on the object is ancestor or as a last resort is the ancestors fill color

        endCSS = {
            display            : 'block',
            'border-left-color': this.getCSSColor(this.getInheritedValue('endArrowColor', this.getInheritedValue('fill', algo.Color.iBLUE)))
        };
    }

    this.startElement.css(startCSS);

    this.endElement.css(endCSS);
};

// ---------------------------------------------------------------------------------------------------------------------

/**
 * an element group is any related or unrelated set of elements to which you want to apply properties in unison.
 * The constructor accepts arrays or individual elements or a map or elements e.g. the children properties of an element
 *
 * new algo.render.ElementGroup(element1, element2)
 *
 * or
 *
 * new algo.render.ElementGroup(elementArray, element1, anotherElementArray, element2)
 *
 * or
 *
 * new algo.render.ElementGroup(element.children)
 */
algo.render.ElementGroup = function () {

    this.elements = [];

    // process the arguments, processing according to type

    _.each(_.toArray(arguments), function (arg) {

            if (arg instanceof algo.render.Element) {

                this.elements.push(arg);

            } else if (_.isArray(arg)) {

                this.elements = _.union(this.elements, arg);
            }
            else if (_.isObject(arg)) {

                this.elements = _.union(this.elements, _.values(arg));

            }

        }, this
    );
};

/**
 * apply the properties to all the members of the group
 * @param options
 */
algo.render.ElementGroup.prototype.set = function (options) {

    _.each(this.elements, function (e) {

        e.set(options);

    }, this);
};

/**
 * add an element to the group
 * @param {algo.render.Element} e - the element to add to the group
 */
algo.render.ElementGroup.prototype.add = function (e) {

    if (this.elements.indexOf(e) < 0) {
        this.elements.push(e);
    }
};

/**
 * remove an element from the group
 * @param {algo.render.Element} e - the element to remove from the group
 */
algo.render.ElementGroup.prototype.remove = function (e) {

    var index = this.elements.indexOf(e);

    if (index >= 0) {
        this.elements.splice(index, 1);
    }
};

/**
 * remove all elements from the group
 */
algo.render.ElementGroup.prototype.clear = function () {
    this.elements.length = 0;
};

/**
 * call destroy on all the elements of the group
 * @param options
 */
algo.render.ElementGroup.prototype.destroy = function () {

    // work from a cloned list since element groups are used to hold the children of elements and might therefore
    // be modified as part of the destroy function call graph

    _.each(_.toArray(this.elements), function (e) {

        e.destroy();

    }, this);

    this.elements.length = 0;
};

/**
 * a linear gradient is the angle of the gradient and the start and end color
 * @param angle
 * @param start
 * @param end
 * @constructor
 */
algo.render.LinearGradient = function (angle, start, end) {

    this.angle = angle;
    this.start = start;
    this.end = end;
};

// TODO, include in 2.0 and get grid of gradient property.
///**
// * return a CSS representation of ourselves
// */
//algo.render.LinearGradient.prototype.toCSS = function() {
//
//    // get a string representation of our start/end colors, however they are represented
//    var c1 = algo.render.Element.prototype.getCSSColor.call(this, this.start);
//    var c2 = algo.render.Element.prototype.getCSSColor.call(this, this.end);
//
//    return _.sprintf('linear-gradient(%sdeg, %s, %s)', this.angle, c1, c2 );
//
//};






