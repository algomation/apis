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

/*global algo,_*/

var globalScope = this;

/**
 * handle and respond to messages from our owing page/application
 * @param event
 */
self.onmessage = function (event) {

    // handle named events

    switch (event.data.name) {

        // initialization message

        case "M_Initialize":
        {
            // create the singleton app for this worker and supply the worker object so it can send messages

            new WorkerApp(this, event.data.algorithmURI, event.data.api);
        }
            break;

        // After the user acknowledges a pause we continue with the algorithm

        case "M_Continue":
        {
            WorkerApp.I.pauseOrContinue();
        }
            break;

    }
};


/**
 * the application class that runs in this worker
 * @constructor
 */
var WorkerApp = function (worker, algorithmURI, api) {

    // save the worker object so we can post messages using it

    this.worker = worker;

    // make ourselves the singleton instance

    WorkerApp.I = this;

    /* when the algorithm is being edited the full source code is used for all files, including underscore and the regenerator
     modules. When the player is running stand alone ( or embedded ) the uglified / compressed source is used.
     If we are part of the minified library that global/namespace algo will exist, otherwise it won't.
     */

    if (!globalScope['algo']) {

        // NOTE: This block must be kept in synch with the grunt task: uglify::workerjs to ensure the correct files
        // are imported or compressed in the a single file

        importScripts(
            '/javascripts/underscore.js',
            '/javascripts/underscore-string.js',
            '/javascripts/regenerator-runtime.js',
            '/javascripts/apis/' + api + '/core.js',
            '/javascripts/apis/' + api + '/color.js',
            '/javascripts/apis/' + api + '/layout.js',
            '/javascripts/apis/' + api + '/element.js',
            '/javascripts/apis/' + api + '/surface.js',
            '/javascripts/apis/' + api + '/dagre.js'

        );

    }

    // add underscore string mixin
    _.mixin(_.str.exports());

    // create our surface and tell it that it is running in a worker not the DOM

    this.surface = new algo.render.Surface({

        // TODO, this size must match algo.Player.kSW, kSH in player.js, find a good way to do that
        location: algo.render.Surface.WORKER,
        bounds  : new algo.layout.Box(0, 0, 900, 556)

    });

    // load the actual file containing the algorithm.

    importScripts(algorithmURI);

    // create the users algorithm as a generator and start running it

    try {

        this.userAlgorithm = algorithm();

    } catch (error) {

        this.postError(error);
        return;
    }

    // send acknowledgement that we are initialized

    this.worker.postMessage({
        "name": "M_Initialize_ACK"
    });

    // call continue to start the algorithm

    this.continue();

};

/**
 * continue with the algorithm
 */
WorkerApp.prototype.continue = function () {

    // run until we hit the first yield


    var y;

    try {

        y = this.userAlgorithm.next();

    } catch (error) {

        this.postError(error);

    }

    // send results of yield to the DOM side or signal the algorithm is complete

    if (y.done) {
        this.done();
    } else {
        this.pause(y.value);
    }
};

/**
 * post the exception to the main thread. The worker is usually terminated on exceptions so we don't need to do anything
 * else.
 * @param error
 */
WorkerApp.prototype.postError = function(error) {

    this.worker.postMessage({

        name          : 'M_Exception',
        message       : error.message,
        stack         : error.stack
    });

};

/**
 * called whenever the algorithm yields
 * @param options
 */
WorkerApp.prototype.pause = function (pauseParameters) {

    // save the current commands, update commands with arrays instead of values are sent one a time

    this.currentCommands = this.surface.flushCommands();

    // process options, which converts arrays of values to single values and marks then options objects
    // as containing more commands

    var activeCommands = [];

    _.each(this.currentCommands, function (command) {

        // only update commands can contain arrays

        if (command.name === "updateElement") {

            activeCommands.push({
                name   : command.name,
                options: this.surface.processOptions(command.options)
            });

        } else {

            // all other commands just get copied in ( currently only the delete command )
            activeCommands.push(command);
        }

    }, this);

    // send a pause event to the DOM and supply all current commands and options

    this.worker.postMessage({

        name          : 'M_Pause',
        renderCommands: activeCommands,
        options       : pauseParameters
    });

};

/**
 * if we are done with the last set of render commands then call continue otherwise send the next batch
 * @param options
 */
WorkerApp.prototype.pauseOrContinue = function () {

    // scan all commands and send those with remaining options

    var activeCommands = [];

    _.each(this.currentCommands, function (command) {

        if (command.name === "updateElement" && command.options.more) {

            activeCommands.push({
                name   : command.name,
                options: this.surface.processOptions(command.options)
            });
        }

    }, this);

    // if there are still active commands then send them otherwise continue

    if (activeCommands.length) {

        this.worker.postMessage({

            name          : 'M_Pause',
            renderCommands: activeCommands,
            options       : {autoskip: true}     // force an autoskip when chaining updates

        });
    } else {

        // no remaining commands so continue

        this.continue();
    }

};

/**
 * called whenever the algorithm is completed
 * @param options
 */
WorkerApp.prototype.done = function () {

    // signal the algorithm is complete and flush any remaining graphics commands

    this.worker.postMessage({

        name          : 'M_Done',
        renderCommands: this.surface.flushCommands()
    });

};