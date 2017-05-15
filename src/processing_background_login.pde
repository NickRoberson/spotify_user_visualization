var frame_rate = 8;

function setup() {
  createCanvas(800, 600);
  smooth();
  frameRate(frame_rate);
}

function draw() {
  background(30,50,100);

  translate(0, height/2);

  for (var x=80; x <= width-80; x +=15){
      noStroke();
      strokeWeight(10);
      stroke(0, random(150,200), random(200,255));

      var h = random(60, 150);
      line(x, 0-h, x, 0+h);
    }
  }
