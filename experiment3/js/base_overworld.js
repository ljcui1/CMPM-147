// sketch.js - purpose and description here
// Author: Your Name
// Date:

// Here is how you might set up an OOP p5.js project
// Note that p5.js looks for a file called sketch.js

// Constants - User-servicable parts
// In a longer project I like to put these in a separate file
new p5(function(p) {
// Globals
let canvasContainer;
var centerHorz, centerVert;

function resizeScreen() {
  centerHorz = p.width / 2; // Adjusted for drawing logic
  centerVert = p.height / 2; // Adjusted for drawing logic
  console.log("Resizing...");
  p.resizeCanvas(p.width, p.height);
  // redrawCanvas(); // Redraw everything based on new size
}

/* exported preload, setup, draw, placeTile */

/* global generateGrid drawGrid */

let seed = 0;
let tilesetImage;
let currentGrid = [];
let numRows, numCols;
let cloudGraphic;
let cloudOffsetX = 0;

p.preload = function() {
  tilesetImage = p.loadImage(
    "https://cdn.glitch.com/25101045-29e2-407a-894c-e0243cd8c7c6%2Ftileset.png?v=1611654020438"
  );
}

function reseed() {
  seed = (seed | 0) + 1109;
  p.randomSeed(seed);
  p.noiseSeed(seed);
  p.select("#seedReportO").html("seed " + seed);
  regenerateGrid();
}

function regenerateGrid() {
    p.select("#asciiBoxO").value(gridToString(generateGrid(numCols, numRows)));
  reparseGrid();
}

function reparseGrid() {
  currentGrid = stringToGrid(p.select("#asciiBoxO").value());
}

function gridToString(grid) {
  let rows = [];
  for (let i = 0; i < grid.length; i++) {
    rows.push(grid[i].join(""));
  }
  return rows.join("\n");
}

function stringToGrid(str) {
  let grid = [];
  let lines = str.split("\n");
  for (let i = 0; i < lines.length; i++) {
    let row = [];
    let chars = lines[i].split("");
    for (let j = 0; j < chars.length; j++) {
      row.push(chars[j]);
    }
    grid.push(row);
  }
  return grid;
}

p.setup = function() {
  numCols = p.select("#asciiBoxO").attribute("rows") | 0;
  numRows = p.select("#asciiBoxO").attribute("cols") | 0;

  canvasContainer = p.select("#canvasContainerO");

  p.createCanvas(16 * numCols, 16 * numRows).parent("canvasContainerO");
  cloudGraphic = p.createGraphics(p.width, p.height);
  p.select("canvas").elt.getContext("2d").imageSmoothingEnabled = false;

  p.select("#reseedButtonO").mousePressed(reseed);
  p.select("#asciiBoxO").input(reparseGrid);

  reseed();

  $(window).resize(function() {
    resizeScreen();
  });
  resizeScreen();
}


p.draw = function() {
    p.randomSeed(seed);
  drawGrid(currentGrid);
  cloudAnim();
}

function placeTile(i, j, ti, tj) {
    p.image(tilesetImage, 16 * j, 16 * i, 16, 16, 8 * ti, 8 * tj, 8, 8);
}

function cloudAnim() {
    cloudOffsetX += 0.2; // Speed of cloud drift

    cloudGraphic.clear(); // Clear the buffer
    cloudGraphic.noStroke();
    cloudGraphic.fill(255, 255, 255, 50); // soft white

    // Layered cloud passes
    const layers = [
        { scale: 0.004, alpha: 20, offsetMult: 0.5, size: 25 },
        { scale: 0.006, alpha: 50, offsetMult: 1.5, size: 18 }
    ];

    for (let layer of layers) {
        for (let y = 0; y < p.height; y += 10) {
            for (let x = 0; x < p.width; x += 10) {
                let n = p.noise(
                (x + cloudOffsetX * layer.offsetMult) * layer.scale,
                y * layer.scale
                );
                if (n > 0.5) {
                    cloudGraphic.fill(255, 255, 255, layer.alpha);
                    cloudGraphic.ellipse(x, y, layer.size, layer.size * 0.75);
                }
            }
        }
    }
    p.image(cloudGraphic, 0, 0);
}

/* exported generateGrid, drawGrid */
/* global placeTile */

function generateGrid(numCols, numRows) {
    let grid = [];
    for (let i = 0; i < numRows; i++) {
      let row = [];
      for (let j = 0; j < numCols; j++) {
        row.push("G");
      }
      grid.push(row);
    }
    
    //water restrictions
    let water = [];
    let waterNum = 7;
    let minWaterSize = 3;
    let maxWaterSize = 10;
    
    //random water
    for (let i = 0; i < waterNum; i++) {
      let w = Math.floor(p.random(minWaterSize, maxWaterSize));
      let h = Math.floor(p.random(minWaterSize, maxWaterSize));
      let x = Math.floor(p.random(0, numCols - w));
      let y = Math.floor(p.random(0, numRows - h));
      
      //make and store water in array
      for (let s = y; s < y + h; s++) {
        for (let t = x; t < x + w; t++) {
          grid[s][t] = "W";
        }
      }
      
      water.push({x: x + Math.floor(w / 2), y: y + Math.floor(h / 2) });
    
        // add a ROCK randomly in the rooms
        if (p.random() < 0.5) {
            let chestX = Math.floor(p.random(x + 1, x + w - 1));
            let chestY = Math.floor(p.random(y + 1, y + h - 1));
            grid[chestY][chestX] = "R";
        }
    }
    
    //random generate houses
    for (let h = 0; h < p.random(20, 30); h++) {
        let placed = false;
        while (!placed) {
            let x = Math.floor(p.random(grid.length));
            let y = Math.floor(p.random(grid[0].length));

            if (grid[x][y] === "G") {
                grid[x][y] = "H";
                placed = true;
            }
        }
    }

    //random generate forests
    for (let f = 0; f < p.random(5, 15); f++) {
        //random grass tile
        let x, y;
        let tries = 0;
        do {
            x = p.floor(p.random(numCols));
            y = p.floor(p.random(numRows));
            tries++;
        } while (grid[y][x] !== "G" && tries < 100);

        // grow a small cluster around that point
        for (let i = 0; i < p.random(5, 20); i++) {
            let nx = x + p.floor(p.random(-2, 3));
            let ny = y + p.floor(p.random(-2, 3));

            if (
            nx >= 0 && ny >= 0 &&
            nx < numCols && ny < numRows &&
            grid[ny][nx] === "G"
            ) {
            grid[ny][nx] = "T";
            }
        }
    }

    return grid;
  }
  
  function drawGrid(grid) {
    p.background(128);
  
    for(let i = 0; i < grid.length; i++) {
      for(let j = 0; j < grid[i].length; j++) {
        //grass
        if (grid[i][j] == 'G') {
          placeTile(i, j, (p.floor(p.random(4))), 0);
        }
        //WATER
        if (gridCheck(grid, i, j, "W")) {
          placeTile(i, j, (p.floor(p.random(4))), 13);
          drawContext(grid, i, j, "G", 9, 0);
          drawContext(grid, i, j, "H", 9, 0);
          drawContext(grid, i, j, "T", 9, 0);
        }

        //rocks tile
        if (gridCheck(grid, i, j, "R")) {
            placeTile(i, j, (p.floor(p.random(4))), 13);
            placeTile(i, j, 14, 9);
        }

        //house tile
        if (gridCheck(grid, i, j, "H")) {
            placeTile(i, j, (p.floor(p.random(4))), 0);
            placeTile(i, j, 26, p.floor(p.random(4)));
            
        }

        //tree tile
        if (gridCheck(grid, i, j, "T")) {
            placeTile(i, j, (p.floor(p.random(4))), 0);
            placeTile(i, j, 14, p.random([0, 6, 15]));
        }
        
        /*if(grid[i][j] == '.'){
          //room floor
          placeTile(i, j, (floor(random(11, 14))), (floor(random(22, 25))));
          //room wall
          if(grid[i-1][j] == '_'){
            //top
            placeTile(i, j, 5, 0);
            //corners (left then right)
            if(grid[i][j-1] == '_'){
              placeTile(i, j, 4, 0);
            }
            if(grid[i][j+1] == '_'){
              placeTile(i, j, 6, 0);
            }
          }
          
          if(grid[i+1][j] == '_'){
            //bottom
            placeTile(i, j, 5, 2);
            //corners (left then right)
            if(grid[i][j-1] == '_'){
              placeTile(i, j, 4, 2);
            }
            if(grid[i][j+1] == '_'){
              placeTile(i, j, 6, 2);
            }
          }
          
          if(grid[i][j-1] == '_'){
            //left
            placeTile(i, j, 4, 1);
          }
          if(grid[i][j+1] == '_'){
            //right
            placeTile(i, j, 6, 1);
          }
        }*/
      }
    }
  }
  
  //If location i,j is inside the grid (not out of bounds), does grid[i][j]==target? Otherise, return false.
  function gridCheck(grid, i, j, target) {
    if (i < 0 || j < 0 || i >= grid.length || j >= grid[0].length) {
      return false;
    }
    return grid[i][j] === target;
  }
  
  //Form a 4-bit code using gridCheck on the north/south/east/west neighbors of i,j for the target code. You might use an example like (northBit<<0)+(southBit<<1)+(eastBit<<2)+(westBit<<3).
  function gridCode(grid, i, j, target) {
    let northBit = gridCheck(grid, i-1, j, target) ? 1 : 0;
    let southBit = gridCheck(grid, i+1, j, target) ? 1 : 0;
    let eastBit = gridCheck(grid, i, j+1, target) ? 1 : 0;
    let westBit = gridCheck(grid, i, j-1, target) ? 1 : 0;

    return (northBit << 0) + (southBit << 1) + (eastBit << 2) + (westBit << 3);
  }
  
  //Get the code for this location and target. Use the code as an array index to get a pair of tile offset numbers.
  function drawContext(grid, i, j, target, dti, dtj) {
    const code = gridCode(grid, i, j, target);
    const [tiOffset, tjOffset] = lookupO[code];

    //calculate tile position offset for correct border placement
    let northBit = gridCheck(grid, i-1, j, target) ? 1 : 0;
    let southBit = gridCheck(grid, i+1, j, target) ? 1 : 0;
    let eastBit = gridCheck(grid, i, j+1, target) ? 1 : 0;
    let westBit = gridCheck(grid, i, j-1, target) ? 1 : 0;
    
    //border offset
    let xOffset = (-northBit) + (southBit);
    let yOffset = (-eastBit) + (westBit);

    placeTile(i, j, dti + tiOffset, dtj + tjOffset);
  }
  
  //A global variable referring to an array of 16 elements. Fill this with hand-typed tile offset pairs, e.g. [2,1], so that drawContext does not need to handle any special cases.
  const lookupO = [
    [1, 1],
    [1, 0],
    [1, 2],
    [1, 1],
    [2, 1],
    [2, 0],
    [2, 2],
    [2, 1],
    [0, 1],
    [0, 0],
    [0, 2],
    [0, 1],
    [1, 1],
    [1, 0],
    [1, 2],
    [1, 1]
  ];

});