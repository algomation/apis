Algomation API Repository.
==========================

This repository contains the sources, documentation, tests and minified versions of the public API's available on Algomation.com

Algorithms developed and running on algomation are developed in conjunction with these apis.

This repository does not contain the sources for the actual algomation.com website or associated tools.

All code within this repository is released under the MIT license below:

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

API 1.0
=======

- color.js       Is taken directly from the excellent library https://github.com/brehaut/color-js
                 the default namespace of the library is mapped to algo.Color
- dagre.js       The awesome directed graph layout library https://github.com/cpettitt/dagre
- core.js        Includes core/graph/heap/array functions etc.
- element.js     Includes the rendering / graphics classes e.g. algo.render.Element/Rectangle/Line
- layout.js      Include the layout and visualizer classes e.g. algo.layout.GridLayout etc
- surface.js     The surface classes in which all algorithms and graphical elements appear
- worker_core.js This is the web worker based loader for algorithm, so you can understand how your algorithm
                 and associated libraries are loaded.




