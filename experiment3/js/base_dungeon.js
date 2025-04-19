// sketch.js - purpose and description here
// Author: Your Name
// Date:

// Here is how you might set up an OOP p5.js project
// Note that p5.js looks for a file called sketch.js

// Constants - User-servicable parts
// In a longer project I like to put these in a separate file
(function() {
// Globals
let canvasContainer;
var centerHorz, centerVert;

function resizeScreen() {
  centerHorz = width / 2; // Adjusted for drawing logic
  centerVert = height / 2; // Adjusted for drawing logic
  console.log("Resizing...");
  resizeCanvas(width, height);
  // redrawCanvas(); // Redraw everything based on new size
}

/* exported preload, setup, draw, placeTile */

/* global generateGrid drawGrid */

let seed = 0;
let tilesetImage;
let currentGrid = [];
let numRows, numCols;

//vignette graphic variable
let vignetteGraphics;

window.preload = function() {
  tilesetImage = loadImage(
    "https://cdn.glitch.com/25101045-29e2-407a-894c-e0243cd8c7c6%2Ftileset.png?v=1611654020438"
  );
}

function reseed() {
  seed = (seed | 0) + 1109;
  randomSeed(seed);
  noiseSeed(seed);
  select("#seedReportD").html("seed " + seed);
  regenerateGrid();
}

function regenerateGrid() {
  select("#asciiBoxD").value(gridToString(generateGrid(numCols, numRows)));
  reparseGrid();
}

function reparseGrid() {
  currentGrid = stringToGrid(select("#asciiBoxD").value());
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

window.setup = function() {
  numCols = select("#asciiBoxD").attribute("rows") | 0;
  numRows = select("#asciiBoxD").attribute("cols") | 0;

  canvasContainer = select("#canvasContainerD");

  createCanvas(16 * numCols, 16 * numRows).parent("canvasContainerD");
  vignetteGraphics = createGraphics(width, height);
  select("canvas").elt.getContext("2d").imageSmoothingEnabled = false;

  select("#reseedButtonD").mousePressed(reseed);
  select("#asciiBoxD").input(reparseGrid);

  reseed();

  $(window).resize(function() {
    resizeScreen();
  });
  resizeScreen();
}


window.draw = function() {
  randomSeed(seed);
  drawGrid(currentGrid);

  //run drawVignette to animate drifting vignette
  drawVignette();
}

function placeTile(i, j, ti, tj) {
  image(tilesetImage, 16 * j, 16 * i, 16, 16, 8 * ti, 8 * tj, 8, 8);
}

function drawVignette() {
  //put vignette pixels into array
  vignetteGraphics.loadPixels();
  let d = vignetteGraphics.pixelDensity();
  let w = vignetteGraphics.width;
  let h = vignetteGraphics.height;

  //perlin noise movement based on time
  let time = millis();
  let offsetX = noise(time * 0.0005) * 100 - 50;
  let offsetY = noise(time * 0.0005 + 100) * 100 - 50;

  //changing alpha value of pixels depending on distance to center
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      let dx = (x - w / 2 + offsetX) / (w / 2);
      let dy = (y - h / 2 + offsetY) / (h / 2);
      let dSQ = dx * dx + dy * dy;

      let alpha = map(dSQ, 0.4, 1.0, 0, 150);
      alpha = constrain(alpha, 0, 150);

      for (let i = 0; i < d; i++) {
        for (let j = 0; j < d; j++) {
          let index = 4 * ((y * d + j) * w * d + (x * d + i));
          vignetteGraphics.pixels[index + 0] = 0;
          vignetteGraphics.pixels[index + 1] = 0;
          vignetteGraphics.pixels[index + 2] = 0;
          vignetteGraphics.pixels[index + 3] = alpha;
        }
      }
    }
  }

  vignetteGraphics.updatePixels();
  image(vignetteGraphics, 0, 0);
}

/* exported generateGrid, drawGrid */
/* global placeTile */

function generateGrid(numCols, numRows) {
  let grid = [];
  for (let i = 0; i < numRows; i++) {
    let row = [];
    for (let j = 0; j < numCols; j++) {
      row.push("S");
    }
    grid.push(row);
  }
  
  //room restrictions
  let rooms = [];
  let roomNum = 7;
  let minRoomSize = 2;
  let maxRoomSize = 8;
  
  //random rooms
  for (let i = 0; i < roomNum; i++) {
    let w = Math.floor(random(minRoomSize, maxRoomSize));
    let h = Math.floor(random(minRoomSize, maxRoomSize));
    let x = Math.floor(random(0, numCols - w));
    let y = Math.floor(random(0, numRows - h));
    
    //make and store room in array
    for (let s = y; s < y + h; s++) {
      for (let t = x; t < x + w; t++) {
        grid[s][t] = "D";
      }
    }
    
    rooms.push({x: x + Math.floor(w / 2), y: y + Math.floor(h / 2) });
  
      // add a chest randomly in the rooms
      if (random() < 0.5) {
          let chestX = Math.floor(random(x + 1, x + w - 1));
          let chestY = Math.floor(random(y + 1, y + h - 1));
          grid[chestY][chestX] = "C";
      }
  }
  
  //connect rooms with paths
  for (let i = 1; i < rooms.length; i++) {
    let a = rooms[i - 1];
    let b = rooms[i];
    
    //horizontal path
    for (let x = Math.min(a.x, b.x); x <= Math.max(a.x, b.x); x++) {
      if (grid[a.y][x] !== "D") grid[a.y][x] = "P"; 
    }
    //vertical path
    for (let y = Math.min(a.y, b.y); y <= Math.max(a.y, b.y); y++) {
      if (grid[y][b.x] !== "D") grid[y][b.x] = "P"; 
    }
  }
  //random generate towers
  for (let h = 0; h < random(3, 20); h++) {
      let placed = false;
      while (!placed) {
          let x = Math.floor(random(grid.length));
          let y = Math.floor(random(grid[0].length));

          if (grid[x][y] === "S") {
              grid[x][y] = "T";
              placed = true;
          }
      }
  }

  return grid;
}

function drawGrid(grid) {
  background(128);

  for(let i = 0; i < grid.length; i++) {
    for(let j = 0; j < grid[i].length; j++) {
      //grass
      if (grid[i][j] == 'S') {
        placeTile(i, j, (floor(random(4))), 12);
      }
      //room
      if (gridCheck(grid, i, j, "D")) {
        placeTile(i, j, (floor(random(11, 14))), (floor(random(22, 25))));
        drawContext(grid, i, j, "S", 9, 12);
        drawContext(grid, i, j, "T", 9, 12);
      }

      //path tile
      if (gridCheck(grid, i, j, "P")) {
        placeTile(i, j, 8, 24);
      }

      //chest tile
      if (gridCheck(grid, i, j, "C")) {
        placeTile(i, j, (floor(random(11, 14))), (floor(random(22, 25))));
        placeTile(i, j, floor(random(3, 5)), floor(random(28, 30)));
      }

      //tower tile
      if (gridCheck(grid, i, j, "T")) {
        let yTile = random([1, 3]);
        let xTile = floor(random(28, 30));
        placeTile(i, j, (floor(random(4))), 12);
        placeTile(i, j, xTile, yTile);
        if ((i-1) != null) {
            placeTile(i-1, j, xTile, yTile-1);
        }
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
  const [tiOffset, tjOffset] = lookup[code];

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
const lookup = [
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

})();