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

let playerX, playerY;

function p3_preload() {}

function p3_setup() {}

let worldSeed;

function p3_worldKeyChanged(key) {
  console.log("World key changed. New player position:", playerX, playerY);

  worldSeed = XXH.h32(key, 0);
  noiseSeed(worldSeed);
  randomSeed(worldSeed);
  
  //player start pos based on worldSeed
  playerX = (XXH.h32("start:i", worldSeed) % 11) - 5;
  playerY = (XXH.h32("start:j", worldSeed) % 40) - 20;
  
  // Ensure the player spawns on a raised tile
  while (!isRaisedTile(playerX, playerY)) {
    playerX += 1;  // Try moving to the next tile along X axis
    if (playerX > 5) {  // If we exceed the right limit, move to a new row
      playerX = -5;
      playerY += 1;
    }
    if (playerY > 20) {  // If we exceed the bottom limit, reset position
      playerY = -20;
      playerX = -5;
    }
  }
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
  /*if (i < -5 || i > 5) return; // limit to 10 columns
  let key = [i, j];
  clicks[key] = 1 + (clicks[key] | 0);*/
}

function p3_drawBefore() {}

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

function p3_drawTile(i, j) {
  if (i < -5 || i > 5) return; // limit to 10 columns
  
  noStroke();

  /*if (XXH.h32("tile:" + [i, j], worldSeed) % 4 == 0) {
    fill(240, 200);
  } else {
    fill(255, 200);
  }*/
  let solid = isRaisedTile(i, j);
  if (solid) {
    let c = color(252, 121, 138);
    drawCell(c,-8) // darker gray
    translate(0, -8); // raise tile
  } else {
    fill(91, 221, 235, 200);
  }

  push();

  beginShape();
  vertex(-tw, 0);
  vertex(0, th);
  vertex(tw, 0);
  vertex(0, -th);
  endShape(CLOSE);

  let n = clicks[[i, j]] | 0;
  if (n % 2 == 1) {
    fill(0, 0, 0, 32);
    ellipse(0, 0, 10, 5);
    translate(0, -10);
    fill(255, 255, 100, 128);
    ellipse(0, 0, 10, 10);
  }
  
  //draw character
  if (i === playerX && j === playerY) {
    console.log("Drawing player at", playerX, playerY);  // Debugging
    fill(50, 150, 255);
    translate(0, -10);
    ellipse(0, 0, 12, 12);
  }

  pop();
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

function p3_drawAfter() {}


//jump logic written with help of ChatGPT
let lastDirection = null; // Track the last movement direction

function keyPressed() {
  // Define the next potential position based on key press
  let nextX = playerX;
  let nextY = playerY;

  // Movement keys (WASD)
  if (key === 'W' || key === 'w') {
    nextY -= 1;
    lastDirection = 'W'; // Track last movement direction
  } else if (key === 'S' || key === 's') {
    nextY += 1;
    lastDirection = 'S'; // Track last movement direction
  } else if (key === 'D' || key === 'd') {
    nextX -= 1;
    lastDirection = 'D'; // Track last movement direction
  } else if (key === 'A' || key === 'a') {
    nextX += 1;
    lastDirection = 'A'; // Track last movement direction
  } 
  
  // Jump with spacebar
  if (key === ' ' || key === 'Spacebar') {
    // Only apply jump if the player has moved recently
    if (lastDirection) {
      // Skip over one tile in the direction of movement
      if (lastDirection === 'W') {
        nextY -= 2; // Jump 2 tiles up
      } else if (lastDirection === 'S') {
        nextY += 2; // Jump 2 tiles down
      } else if (lastDirection === 'D') {
        nextX -= 2; // Jump 2 tiles right
      } else if (lastDirection === 'A') {
        nextX += 2; // Jump 2 tiles left
      }
    }
  }

  // Check if the next tile is raised and update player position accordingly
  if (isRaisedTile(nextX, nextY)) {
    playerX = nextX;
    playerY = nextY;
  }
}


function isRaisedTile(i, j) {
  return XXH.h32("tile:" + [i, j], worldSeed) % 2 == 0;
}

window.getPlayerPos = function() {
  return [playerX, playerY];
}