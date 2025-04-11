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
  centerHorz = canvasContainer.width() / 2; // Adjusted for drawing logic
  centerVert = canvasContainer.height() / 2; // Adjusted for drawing logic
  console.log("Resizing...");
  resizeCanvas(canvasContainer.width(), canvasContainer.height());
  // redrawCanvas(); // Redraw everything based on new size
}

/* exported setup, draw, mousePressed */
let seed = 0;

let lightLines = [];
let driftSpeed = 0.3;

let tileBuffer;

let ripples = [];

function setup() {
  canvasContainer = $("#canvas-container");
  let canvas = createCanvas(canvasContainer.width(), canvasContainer.height());
  canvas.parent("canvas-container");
  // resize canvas is the page is resized

  // create an instance of the class
  myInstance = new MyClass("VALUE1", "VALUE2");

  $(window).resize(function() {
    resizeScreen();
  });
  resizeScreen();
  noFill();
  let regen = createButton("reimagine").mousePressed(() => {seed++; regenerateScene();});
  regen.parent("canvas-container");
  regenerateScene();
}

function regenerateScene() {
  lightLines = [];
  randomSeed(seed); // Apply seed before generating tiles
  tileBuffer = createGraphics(width, height);
  backTile(tileBuffer);
  randomSeed(seed); // Re-apply seed to get consistent light shape positions
  lineAmt();
}

function draw() {
  background(100);
  
  //make background tiles into a graphic
  image(tileBuffer, 0, 0);
  
  randomSeed(seed);
  for (let shape of lightLines) {
    let xOffset = sin(frameCount * 0.01) * driftSpeed; // Horizontal drift using sin
    shape.x += xOffset;
    
    // Draw each shape with drift effect
    whiteLines(shape.x, shape.y, shape.size);
  }
  
  //draw each ripple
  for (let i = ripples.length - 1; i >= 0; i--) {
    let r = ripples[i];
    stroke(0, 150, 255, r.alpha); // Blue with transparency
    strokeWeight(4);
    ellipse(r.x, r.y, r.radius * 2);

    r.radius += 2;
    r.alpha -= 2;

    // remove if fully transparent
    if (r.alpha <= 0) {
      ripples.splice(i, 1);
    }
  }
}

function mousePressed() {
  ripples.push({
    x: mouseX,
    y: mouseY,
    radius: 10,
    alpha: 150
  });
}

function backTile(g) {
  //set tile grout
  g.colorMode(HSB, 360, 100, 100); //HSB color mode
  g.stroke(180, 30, 95); //grout color
  //g.stroke(159, 238, 245);
  g.strokeWeight(1);
  
  for (let i = 0; i < width/10; i++){
    for (let j = 0; j < height/10; j++){
      //set tile color
      // Random turquoise hues
      let h = random(175, 190);     // cyan-blue range
      let s = random(70, 100);      // high saturation
      let b = random(75, 85);      // bright
      g.fill(h, s, b);
      
      //draw tile
      g.rect(i * 40, j * 40, 40, 40);
      
    }
  }
  g.colorMode(RGB, 255);
}

function lineAmt() {
  let cols = width/80;
  let rows = height/75;
  let spacingX = width / cols;
  let spacingY = height / rows;
  //jitter grid for even spacing
  for (let i = -cols; i <= cols; i++) {
    for (let j = -rows; j <= rows; j++) {
      let x = i * spacingX + random(-spacingX * 0.3, spacingX * 0.3);
      let y = j * spacingY + random(-spacingY * 0.3, spacingY * 0.3);
      let size = random(50, 60);

      whiteLines(x, y, size);
      lightLines.push({x, y, size});
    }
  }
}

function whiteLines(x, y, size = 40, complexity = 6) {
  // shadow effect (dark gray shadow)
  let shadowOffset = 3;  
  stroke(50, 50, 50, 75);  // Dark gray color for shadow
  strokeWeight(random(2, 5));
  
  // draw shadow (slightly offset from the original position)
  beginShape();
  for (let i = 0; i < complexity; i++) {
    let angle = map(i, 0, complexity, 0, TWO_PI);
    let radius = size + random(-10, 10); // irregularity
    let px = x + cos(angle) * radius + shadowOffset; 
    let py = y + sin(angle) * radius + shadowOffset;
    vertex(px, py);
  }
  endShape(CLOSE);
  
  
  //set white stroke no fill
  noFill();
  stroke(255, 255, 255, random(200, 255));
  strokeWeight(random(2, 5));
  
  beginShape();
  
  //random shape
  for (let i = 0; i < complexity; i++) {
    let angle = map(i, 0, complexity, 0, TWO_PI);
    let radius = size + random(-10, 10); // irregularity
    let px = x + cos(angle) * radius;
    let py = y + sin(angle) * radius;
    vertex(px, py);
  }
  
  endShape(CLOSE);
}