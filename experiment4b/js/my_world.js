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
    keyPressed
*/

// set alive cells as it scrolls up (isRaisedTile)
// draw after 
  // if time > x 
  // set alive cells = nextgen set
  // nextgen set = computenextgen(alivecells)
// draw 
  // draw the alive cells 
  // draw the next gen set -- opacity lowered, different color, no height

// modify player to only be able to walk on cells not alive
// if a cell becomes alive with a player on it, destroy the player

// additional memory problem the longer the game goes on, 
// need a way to clear the alive cells that are off screen behind the player
// j is constantly decreasing, so maybe in compute next gen if an alive cell is less than the max j, delete it
// need function to get the max j

// for funsies 
// -- display score as total time before dying or num steps you took
// -- draw the tiles fading in and out near the top and bottom

let playerX, playerY;

// stores alive cells i,j position as a string "i,j"
let aliveCells = new Set();
let previewCells = new Set();
let seenCells = new Set();
let paused = false;
let lastUpdate = 0;
let updateInterval = 1500; // ms

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

function computeNextGen(cellSet) {
  let nextGen = new Set();
  let deadCells = new Map(); // stores the number of alive cell neighbors for dead cells

  for (let cell of cellSet) {
    let [i, j] = stringToPos(cell);
    let liveNeighbors = 0;

    for (let [newi, newj] of calculateNeighbors(i, j)) {
      let key = posToString(newi, newj);
      if (cellSet.has(key)) {
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
  // prune offscreen next gen from player position to reduce storage
  const maxJ = playerY + 30;
  console.log(maxJ);
  for (let cell of nextGen) {
    let [i,j] = stringToPos(cell);
    if (j > maxJ) {
      console.log(j);
      nextGen.delete(cell);
    }
  }

  return nextGen;
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

function clearAllCells() {
  aliveCells = new Set();
  seenCells = new Set();
  previewCells = new Set();
}


function p3_preload() {}

function p3_setup() {}

let worldSeed;

function p3_worldKeyChanged(key) {
  console.log("World key changed. New player position:", playerX, playerY);
  // clearAllCells();
  worldSeed = XXH.h32(key, 0);
  noiseSeed(worldSeed);
  randomSeed(worldSeed);
  playerRespawn();
}

function playerRespawn() {
  //player start pos based on worldSeed
  playerX = (XXH.h32("start:i", worldSeed) % 11) - 5;
  playerY = (XXH.h32("start:j", worldSeed) % 40) - 20;
  
  // Ensure the player spawns on a raised tile
  // while (isWalkableTile(playerX, playerY)) {
  //   playerX += 1;  // Try moving to the next tile along X axis
  //   if (playerX > 5) {  // If we exceed the right limit, move to a new row
  //     playerX = -5;
  //     playerY += 1;
  //   }
  //   if (playerY > 20) {  // If we exceed the bottom limit, reset position
  //     playerY = -20;
  //     playerX = -5;
  //   }
  // }
}

function p3_tileWidth() {
  return 32;
}
function p3_tileHeight() {
  return 16;
}

let [tw, th] = [p3_tileWidth(), p3_tileHeight()];

let clicks = {};

// function p3_tileClicked(i, j) {
//   /*if (i < -5 || i > 5) return; // limit to 10 columns
//   let key = [i, j];
//   clicks[key] = 1 + (clicks[key] | 0);*/
// }

function p3_drawBefore() {
  // previewCells = new Set(computeNextGen(aliveCells));
}

function p3_drawTile(i, j) {
  if (i < -5 || i > 5) return; // limit to 10 columns
  
  noStroke();

  /*if (XXH.h32("tile:" + [i, j], worldSeed) % 4 == 0) {
    fill(240, 200);
  } else {
    fill(255, 200);
  }*/
  
  
  let key = posToString(i, j);
  let spawnRate = 10;

  // only repopulates it once
  if (!seenCells.has(key)) {
    seenCells.add(key);
    if (XXH.h32("tile:" + [i, j], worldSeed) % 2 == 0) {
      aliveCells.add(key);
    }
  }
  // if (!aliveCells.has(key) && XXH.h32("tile:" + [i, j], worldSeed) % spawnRate == 0) {
  //   aliveCells.add(key);
  //   previewCells.add(key);
  // }
  
  // if (!previewCells.has(key) && aliveCells.has(key)) { // cell that is going to dissapear
  //   drawCell(200, -16);
  // } else if (aliveCells.has(key)){
  console.log("alive cell count:", aliveCells.size);
  console.log("preview cell count:", previewCells.size);
  
  if (aliveCells.has(key)) {
    drawCell(100, -16);
  } else if (previewCells.has(key)) {
    drawCell(100, 0);
  } else {
    drawCell(255,0);
  }

  //draw character
  if (i === playerX && j === playerY) {
    console.log("Drawing player at", playerX, playerY);  // Debugging
    fill(50, 150, 255);
    translate(0, -2);
    ellipse(0, 0, 12, 12);
  }

  // pop();
}

function p3_drawSelectedTile(i, j) {
  if (i < -5 || i > 5) return; // limit to 10 columns
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
}

function p3_drawAfter() {
  if (!paused) {
    let now = millis(); // num ms sketch has runa
    if (now - lastUpdate > updateInterval) {
      aliveCells = new Set(computeNextGen(aliveCells));
      previewCells = new Set(computeNextGen(aliveCells));
      lastUpdate = now;
    }
  }
  if (aliveCells.has(posToString(playerX,playerY))) {
    console.log("dead");
  }
}


function keyPressed() {
  // Define the next potential position based on key press
  let nextX = playerX;
  let nextY = playerY;

  if (key === 'W' || key === 'w') {
    nextY -= 1;
  } else if (key === 'S' || key === 's') {
    nextY += 1;
  } else if (key === 'D' || key === 'd') {
    nextX -= 1;
  } else if (key === 'A' || key === 'a') {
    nextX += 1;
  }

  // // Check if the next tile is raised and update player position accordingly
  if (isWalkableTile(nextX, nextY)) {
    playerX = nextX;
    playerY = nextY;
  }
  console.log("Player position:", playerX, playerY);
}

function isWalkableTile(i,j) {
  return !aliveCells.has(posToString(i,j));
}

// function isRaisedTile(i, j) { // change to isWalkableTile -- return !aliveCell(i,j)
//   return XXH.h32("tile:" + [i, j], worldSeed) % 2 == 0;
// }

window.getPlayerPos = function() {
  return [playerX, playerY];
}