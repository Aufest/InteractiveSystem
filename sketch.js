//Sketch.js
let capture;
let detector;
let detections = [];
let flowers = []; // 咲かせる花を管理するための配列
let bookPreviouslyDetected = false; // 前回本を検出していたかどうかのフラグ

let rainDrops = [];
let bef_wea = "s"; //sが晴れ、rが雨
let weather = "s"; //現在の天気
let detec = "-"; //雨の時に本を検出したかそうでないか
let state = "stop"; //花を育たせるか
let cnt = 0; //天気の変化
let time = 50 //天気が変わるタイミング

// ----------------------------------------------------------------
// ★★追加点：雨粒のアニメーションを管理するための設計図（クラス）
// ----------------------------------------------------------------
class RainDrop {
  constructor() {
    this.x = random(width);
    this.y = random(-500, -50);
    this.z = random(0, 20);
    this.len = map(this.z, 0, 20, 10, 20);
    this.ySpeed = map(this.z, 0, 20, 4, 10);
  }

  update() {
    this.y += this.ySpeed;
    if (this.y > height) {
      this.y = random(-200, -100);
    }
  }

  display() {
    push();
    stroke(91, 172, 238); // 雨の色
    strokeWeight(map(this.z, 0, 20, 1, 3));
    line(this.x, this.y, this.x, this.y + this.len);
    pop();
  }
}

// ----------------------------------------------------------------
// 花のアニメーションを管理するための設計図（クラス）
// ※この部分は変更ありません
// ----------------------------------------------------------------
class Flower {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 0;
    this.maxSize = random(40, 70);
    this.growthRate = 0.5;
    this.color = color(random(200, 255), random(100, 200), 0);
  }

  update() {
    if (this.size < this.maxSize) {
      this.size += this.growthRate;
    }
  }

  display() {
    push();
    translate(this.x, this.y);
    noStroke();
    fill(this.color);
    for (let i = 0; i < 8; i++) {
      ellipse(this.size * 0.7, 0, this.size, this.size / 2);
      rotate(PI / 4);
    }
    fill(100, 60, 20);
    ellipse(0, 0, this.size * 0.5, this.size * 0.5);
    pop();
  }
}

// ----------------------------------------------------------------
// p5.jsのメインプログラム
// ----------------------------------------------------------------
function setup() {
  createCanvas(640, 480);
  capture = createCapture(VIDEO);
  capture.size(width, height);
  capture.hide();
  detector = ml5.objectDetector("cocossd", modelLoaded);

  // ★★追加点：雨粒を最初に生成しておく
  for (let i = 0; i < 300; i++) {
    rainDrops.push(new RainDrop());
  }
}

function modelLoaded() {
  console.log("モデル読み込み完了！");
  detect();
}

function detect() {
  detector.detect(capture, gotDetections);
}

function gotDetections(error, results) {
  if (error) {
    console.error(error);
  }
  detections = results;
  detect();
}

function draw() {
  image(capture, 0, 0, width, height);

  const book = detections.find(d => d.label === 'microwave' || d.label === 'tv' || d.label === 'cell phone' || d.label === 'book'); //bookでもok

  // もし本が見つかったら
  if (book) {
    // 本の周りに緑の四角を描画する
    stroke(0, 255, 0);
    strokeWeight(4);
    noFill();
    rect(book.x, book.y, book.width, book.height);

    // ★★変更点：前回は本がなく、今回初めて本が現れた瞬間に花を生成する
    if (!bookPreviouslyDetected) {
      createRandomFlowers(book);
      detec = weather;
    }
    bookPreviouslyDetected = true; // 本を検出したことを記録
    console.log("本を検出したことを記録", detec);
  } else {
    bookPreviouslyDetected = false; // 本が見つからなかったので記録をリセット
    detec = "-";
    console.log("本が見つから", detec);
  }

  if (bef_wea == "r" && weather == "s" && detec == "r") { //もし雨が降って明るくなったら
    state = "grow";
  } else if (weather == "r" || detec != "r") {
    state = "stop";
  }

  if (state == "grow") {
    for (const flower of flowers) { // すべての花を更新 & 描画する
      flower.update();
      flower.display();
    }
  } else if (flowers.length > 0) { //  flowers != [] の代わりに .length > 0 を使うのが一般的です
    for (const flower of flowers) { //花を大きくはさせないけど描画はする
      flower.display();
    }
  }

  bef_wea = weather; //前の天気の状態を記録する
  //天気の状態
  if (cnt >= time && cnt < time*2) {
    for (const rainDrop of rainDrops) {
      rainDrop.update();
      rainDrop.display();
    }
    weather = "r";
    detec = "r";
  } else if (cnt >= time*2) {
    cnt = -1;
    weather = "s";
  }
  cnt++;
  console.log("kakuninn", bef_wea, weather)
}

// ★★新しい関数：本の範囲内にランダムな花を3つ生成する
function createRandomFlowers(book) {
  // 古い花をすべて消去する
  flowers = [];
  //等間隔に花を表示させる
  const kankaku = 6; //間隔を決める (決めた数-2)^2個花を出力する
  const cnt_h = (book.height) / kankaku;
  const cnt_w = (book.width) / kankaku;

  for (let y = book.y + cnt_h; y < book.y + book.height - cnt_h; y += cnt_h) {
    for (let x = book.x + cnt_w; x < book.x + book.width - cnt_w; x += cnt_w) {
      flowers.push(new Flower(x, y));
    }
  }
}