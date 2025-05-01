/* exported getInspirations, initDesign, renderDesign, mutateDesign */


function getInspirations() {
  return [
    {
      name: "Toro Inoue in the Bath", 
      assetUrl: "https://cdn.glitch.global/4d07eb84-9b3a-4f0b-89e2-5910227d2b91/IMG_8591-1.jpg?v=1746125145500",
      credit: ""
    },
    {
      name: "Pained Kirby", 
      assetUrl: "https://cdn.glitch.global/4d07eb84-9b3a-4f0b-89e2-5910227d2b91/1.jpg?v=1746125108257",
      credit: ""
    },
    {
      name: "Relish the Thought", 
      assetUrl: "https://cdn.glitch.global/4d07eb84-9b3a-4f0b-89e2-5910227d2b91/20201115_175328.jpg?v=1746125119157",
      credit: "Relish the Thought, California, Lia Cui, 2020"
    },
  ];
}

function initDesign(inspiration) {
  //resize canvas based on og image size
  resizeCanvas(inspiration.image.width / 4, inspiration.image.height / 4);
  if(inspiration.image.width > 1000 && inspiration.image.height > 1000) {
    resizeCanvas(inspiration.image.width / 10, inspiration.image.height / 10);
  }
  if(inspiration.image.width < 500 && inspiration.image.height < 500) {
    resizeCanvas(inspiration.image.width / 2, inspiration.image.height / 2);
  }
  
  //set background color and foreground color array
  let bgColor, fgColor;
  if (inspiration.name == "Toro Inoue in the Bath") {
    bgColor = [233, 218, 175];
    fgColor = [[233, 226, 207], [147, 176, 130]];
    //147, 176, 130 water
  }else if (inspiration.name == "Pained Kirby") {
    bgColor = [204, 205, 200];
    fgColor = [[189, 110, 131], [192, 32, 40]];
    //fgColor = [189, 110, 131];
    //192, 32, 40 red
  }else if (inspiration.name == "Relish the Thought") {
    bgColor = [206, 202, 199];
    fgColor = [[162, 117, 75], [224, 202, 144], [118, 126, 75], [141, 66, 71]];
    //fgColor = [162, 117, 75];
    //224, 202, 144 business card
    //118, 126, 75 green
    //141, 66, 71 red
  }
  
  let design = {
    bg: bgColor,
    fg: []
  }
  
  //randomly choose values and colors
  for(let i = 0; i < 100; i++) {
    design.fg.push({x: random(width),
      y: random(height),
      w: random(width/2),
      h: random(height/2),
      fill: random(fgColor)})
  }
  return design;
}

function renderDesign(design, inspiration) {
  background(design.bg);
  noStroke();
  /*for(let box of design.fg) {
    fill(box.fill, 128);
    rect(box.x, box.y, box.w, box.h);
  }*/
  
  for(let shape of design.fg) {
    /*//change colorMode and fetch HSB values
    colorMode(HSB);
    let h = hue(shape.fill);
    let s = saturation(shape.fill);
    let b = brightness(shape.fill);
    
    //use perlin noise to jitter saturation and brightness

    //create color and convert color to RGB
    */
    let fillAlpha = random(100, 150);
    shape.fill.push(fillAlpha);
    fill(shape.fill);
    let type = random([0, 1]);
    if (type == 0) {
      ellipse(shape.x, shape.y, shape.w, shape.h);
    }else {
      rect(shape.x, shape.y, shape.w, shape.h);
    }
  }
}

//referenced from Wes Modes's example project
function mutateDesign(design, inspiration, rate) {
  design.bg = design.bg.map(c => mut(c, 0, 255, rate)); // mutate bg color components
  for(let shape of design.fg) {
    // mutate each RGB channel individually
    shape.fill = shape.fill.map(c => mut(c, 0, 255, rate));
    shape.x = mut(shape.x, 0, width, rate);
    shape.y = mut(shape.y, 0, height, rate);
    shape.w = mut(shape.w, 0, width/2, rate);
    shape.h = mut(shape.h, 0, height/2, rate);
  }
}

//code provided by Wes Modes
function mut(num, min, max, rate) {
  return constrain(randomGaussian(num, (rate * (max - min)) / 50), min, max);
}
