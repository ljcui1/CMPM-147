"use strict";

/* global XXH */
/* exported --
    p3_preload
    p3_setup
    p3_worldKeyChanged
    p3_tileWidth
    p3_tileHeight
    p3_tileClicked
    p3_drawBefore
    p3_drawTile
    p3_drawSelectedTile
    p3_drawAfter
*/

// stores alive cells i,j position as a string "i,j"
let aliveCells = new Set();
let seenCells = new Set();
let nextGen = new Set();
let paused = false;
let lastUpdate = 0;
let updateInterval = 500; // ms

function calculateNeighbors(i, j) {
  return [
    [i - 1, j - 1],
    [i, j - 1],
    [i + 1, j - 1],
    [i - 1, j],
    [i + 1, j],
    [i - 1, j + 1],
    [i, j + 1],
    [i + 1, j + 1],
  ];
}

function posToString(i, j) {
  return `${i},${j}`;
}

function stringToPos(cell) {
  return cell.split(",").map(Number); // [i,j]
}

function computeNextGen() {
  nextGen.clear();
  let deadCells = new Map(); // stores the number of alive cell neighbors for dead cells

  for (let cell of aliveCells) {
    let [i, j] = stringToPos(cell);
    let liveNeighbors = 0;

    for (let [newi, newj] of calculateNeighbors(i, j)) {
      let key = posToString(newi, newj);
      if (aliveCells.has(key)) {
        // if the neighboring cell is alive, add 1 count to current cell
        liveNeighbors++;
      } else {
        // if the neighboring cell is dead add 1 to neighbor cell
        let cells = (deadCells.get(key) || 0) + 1;
        deadCells.set(key, cells);
      }
    }
    if (liveNeighbors == 2 || liveNeighbors == 3) {
      // cell lives
      nextGen.add(cell);
    }
  }
  // loop over deadcells and add them to new gen
  for (let [key, cells] of deadCells) {
    if (cells == 3) {
      nextGen.add(key);
    }
  }
  aliveCells = new Set(nextGen);

  return nextGen;
}

function p3_preload() {}

function p3_setup() {
  let pauseButton = $("#pause-button");
  // pauseButton.addEventListener("click", () => {
  //   paused = !paused;
  //   pauseButton.html(`pause: ${paused}`);
  // })
  pauseButton.on("click", () => {
    paused = !paused;
    pauseButton.html(`pause: ${paused}`);
  });
}

let worldSeed;

function p3_worldKeyChanged(key) {
  worldSeed = XXH.h32(key, 0);
  clearAllCells();
  noiseSeed(worldSeed);
  randomSeed(worldSeed);
}

function p3_tileWidth() {
  return 32;
}
function p3_tileHeight() {
  return 16;
}

let [tw, th] = [p3_tileWidth(), p3_tileHeight()];

let clicks = {};

function p3_tileClicked(i, j) {
  let key = [i, j];
  clicks[key] = 1 + (clicks[key] | 0);
}

function p3_drawBefore() {}

function calculateNeighbors2(i, j) {
  return [
    [i - 2, j - 2],
    [i - 1, j - 2],
    [i, j - 2],
    [i + 1, j - 2],
    [i + 2, j - 2],
    [i - 2, j - 1],
    [i - 1, j - 1],
    [i, j - 1],
    [i + 1, j - 1],
    [i + 2, j - 1],
    [i - 2, j],
    [i - 1, j],
    [i + 1, j],
    [i + 2, j],
    [i - 2, j + 1],
    [i - 1, j + 1],
    [i, j + 1],
    [i + 1, j + 1],
    [i + 2, j + 1],
    [i - 2, j + 2],
    [i - 1, j + 2],
    [i, j + 2],
    [i + 1, j + 2],
    [i + 2, j + 2],
  ];
}

function computeNeighborCells(i, j) {
  let height = 0;
  // checks if neighbors neighbors has alive cells
  for (let [newi, newj] of calculateNeighbors2(i, j)) {
    let key = posToString(newi, newj);
    if (aliveCells.has(key)) {
      height++;
    }
  }
  return height;
}

function clearAllCells() {
  aliveCells = new Set();
  seenCells = new Set();
  nextGen = new Set();
}

function p3_drawTile(i, j, cx, cy) {
  noStroke();
  colorMode(HSB);
  // https://editor.p5js.org/aferriss/sketches/BJuQLbkcz
  // HSB colormode stands for hue, saturation, brightness
  // hue goes from 0 (red) - 360 (also red) 180 is cyan
  // saturation goes from 0 - 100 (black and white to color)
  // brightness goes from 0 - 100 (black to white)

  let key = posToString(i, j);

  // only repopulates it once
  if (!seenCells.has(key)) {
    seenCells.add(key);
    if (XXH.h32("tile:" + [i, j], worldSeed) % 10 == 0) {
      aliveCells.add(key);
    }
  }

  // constantly repopulates
  // if (!aliveCells.has(key) && XXH.h32("tile:" + [i, j], worldSeed) % 10 == 0) {
  //   aliveCells.add(key);
  // }

  // computes for all cells
  let neighbors = computeNeighborCells(i, j);
  // let height = -8*neighbors; // comment back in to allow for not active neighbors to be heightmapped too
  let height = 0;
  let H = 200; // adjust this to change color
  let S = 0;
  let B = 100;

  if (aliveCells.has(key)) {
    height = -8 * neighbors;
    H = abs(H - abs(neighbors) * 3) % 360;
    S = 100;
  } else if (neighbors > 0) {
    H = abs(H - abs(8)) % 360;
    S = 50;
  }
  let baseColor = color(H, S, B);
  drawCell(baseColor, height);

  let n = clicks[[i, j]] | 0; // number of clicks for i,j
  if (n % 2 == 1) {
    // placment of cells
    if (aliveCells.has(key)) {
      aliveCells.delete(key);
    } else {
      aliveCells.add(key);
    }
    p3_tileClicked(i, j);
  }
}

function drawCell(cellColor, height) {
  let cellSideColor = color(
    hue(cellColor),
    saturation(cellColor) - 10,
    brightness(cellColor) - 20
  );
  let cellLeftSideColor = color(
    hue(cellColor),
    saturation(cellColor) - 20,
    brightness(cellColor) - 40
  );
  fill(cellColor, 255);
  push();

  translate(0, height);
  // ground
  beginShape();
  vertex(-tw, 0);
  vertex(0, th);
  vertex(tw, 0);
  vertex(0, -th);
  endShape(CLOSE);
  // https://chatgpt.com/share/680c6d92-c770-8007-9004-0f4de70a75ae
  // Left side face
  fill(cellLeftSideColor, 255);
  beginShape();
  vertex(-tw, 0); // top left
  vertex(0, th); // top center
  vertex(0, th - height); // bottom center (at ground)
  vertex(-tw, -height); // bottom left (at ground)
  endShape(CLOSE);

  // Right side face
  fill(cellSideColor, 255);
  beginShape();
  vertex(0, th); // top center
  vertex(tw, 0); // top right
  vertex(tw, -height); // bottom right (at ground)
  vertex(0, th - height); // bottom center (at ground)
  endShape(CLOSE);
  pop();
}

function drawCircle() {
  fill(0, 0, 0, 32);
  ellipse(0, 0, 10, 5);
  translate(0, -10);
  fill(255, 255, 100, 128);
  ellipse(0, 0, 10, 10);
}

function p3_drawSelectedTile(i, j, cx, cy) {
  noFill();
  stroke(0, 255, 0, 128);

  beginShape();
  vertex(-tw, 0);
  vertex(0, th);
  vertex(tw, 0);
  vertex(0, -th);
  endShape(CLOSE);

  noStroke();
  fill(0);
  text("tile " + [i, j], 0, 0);
  stroke(255, 0, 0);
  // line(0, 0, mouseX - cx, mouseY - cy);
}

function p3_drawAfter() {
  if (!paused) {
    let now = millis(); // num ms sketch has run
    if (now - lastUpdate > updateInterval) {
      // runs every second
      computeNextGen();
      lastUpdate = now;
    }
    text(frameRate(), 20, 20);
  }
}