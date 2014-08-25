function* algorithm() {

    //=Initialize, display the array/string we are going to reverse
    var WORD = "ALGORITHMS";

    // create and display WORD using letter tiles
    var varray = makeArray();

    // start the algorithm
    var left = 0,
        right = WORD.length - 1;
    yield ({
        step: "The string we are going to reverse. Initialize two indices, left and right to either end of the array.",
        line: "//=Initialize",
        variables: {
            Word: WORD,
            left: left,
            right: right
        }
    });

    // start reversing the array by swapping elements at either end
    //=swap
    while (left < right) {

        yield ({
            step: "Exchange the items in the slots identified by the left and right variables.",
            line: "//=swap",
            variables: {
                left: left,
                right: right
            }
        });

        // swap the two items on the array and reposition their elements
        varray.swap(left, right);

        yield ({
            autoskip: true
        });

        // move left and right indices towards the center of the array
        left += 1;
        right -= 1;
    }

    yield ({
        step: 'The algorithm is complete when the left and right indices either converge on the middle element or pass over each other.'
    });

    // display the WORD variables
    function makeArray() {

        // get bounds of surface we are displayed on
        var bounds = algo.BOUNDS;

        // derive tile size from surface size and word length
        var kS = bounds.w / (WORD.length + 2);

        // we only need a simple single row grid
        var layout = new algo.layout.GridLayout(bounds, 1, WORD.length);

        // create the array wrapper
        return new algo.core.Array({

            // initialize with the word

            data: WORD,

            // called whenever a new item is added to the array, you should return the element used
            // to visualize the item

            createElement: _.bind(function(value, index) {

                // create a new letter tile. Display the letter and the array index in the tile
                var element = new algo.render.LetterTile({
                    text: value,
                    w: kS,
                    h: kS,
                    value: index
                });

                // position within the appropriate row/column of the layout
                element.layout(layout.getBox(0, index));

                return element;

            }, this),

            // Use a path based animation to transition swapped elements to thier new locations
            swapElement: _.bind(function(value, newIndex, oldIndex, element) {

                // get the bounding box of the new and old cell
                var newCell = layout.getBox(0, newIndex),
                    oldCell = layout.getBox(0, oldIndex);

                // get x position for element centered in cell
                var newX = newCell.cx - element.w / 2,
                    oldX = oldCell.cx - element.w / 2;

                // height of the cell is used to move the items above or below the displayed string and
                // the start/end vertical position of the tiles is a constant

                var H = element.h * 1.5,
                    Y = element.y;

                // if item was in the left/lower half of the array move it up and over,
                // if item was in the right/upper half of the array move it down and under

                var yoffset = oldIndex < WORD.length / 2 ? H : -H;

                element.set({
                    y: [Y + yoffset, Y + yoffset, Y],
                    x: [oldX, newX, newX],
                    state: [algo.render.kS_BLUE, algo.render.kS_BLUE, algo.render.kS_FADED]
                });
            })
        });
    }
}