// sketch.js - purpose and description here
// Author: Your Name
// Date:

// Here is how you might set up an OOP p5.js project
// Note that p5.js looks for a file called sketch.js

// Constants - User-servicable parts
// In a longer project I like to put these in a separate file
const VALUE1 = 1;
const VALUE2 = 2;

// Globals
let myInstance;
let canvasContainer;
var centerHorz, centerVert;

class MyClass {
    constructor(param1, param2) {
        this.property1 = param1;
        this.property2 = param2;
    }

    myMethod() {
        // code to run when method is called
    }
}

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

function preload() {
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

function setup() {
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


function draw() {
  randomSeed(seed);
  drawGrid(currentGrid);

  //run drawVignette to animate drifting vignette
  drawVignette();
}

function placeTile(i, j, ti, tj) {
  image(tilesetImage, 16 * j, 16 * i, 16, 16, 8 * ti, 8 * tj, 8, 8);
}

function drawVignette() {
  //clearing and setting up vignette
  vignetteGraphics.clear();
  vignetteGraphics.noStroke();

  //time variable to move vignette by
  let time = millis();

  //move vignette position with perlin noise based on time
  let offsetX = noise(time) * 100 - 50;
  let offsetY = noise(time + 100) * 100 - 50;

  //nested loop over every pixel on canvas and calculate distance from center to change the alpha value of the vignette
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let dx = (x - width / 2 + offsetX) / (width / 2);
      let dy = (y - height / 2 + offsetY) / (height / 2);

      let dSQ = dx * dx + dy * dy;

      let alpha = map(dSQ, 0.4, 1.0, 0, 150);
      alpha = constrain(alpha, 0, 150);

      vignetteGraphics.fill(0, alpha);
      vignetteGraphics.rect(x, y, 1, 1);
    }
  }
  image(vignetteGraphics, 0, 0);
}
