// ---------- P5.js ---------- //

// ★ルーレット回転動作に必要な変数群
var Mode = {
    waiting: 0,
    acceleration: 1,
    constant: 2,
    deceleration: 3,
    result: 4
};

var mode = Mode.waiting;

const ACCEL = 0.01;                     // 加速時の加速度
const DECEL = 0.01;                     // 減速時の加速度
const MAX_SPEED = 1.0;                  // 最大速度
const DECEL_RAND_LEVEL = 10;            // 減速の乱数の幅
const DECEL_RAND_MAGNITUDE = 0.001;     // 減速の乱数の影響力

var speed = 0.0;
var theta = 0.0;
var len = 0;
var resultDisplayed = false;

// ★HTMLフォームの入力内容を保持する変数群
var nameList = [];
var probabilityList = [];
var colorList = [];
var ratioSum = 0;

// ルーレットの結果を保存する

// ★ルーレットの色割り当て関数に使用する定数
const COLOR_ADJ = 0.4;

// ★ルーレット描画に使用する定数（半径）
const RADIUS = 250;


const TRIANGLE_SIZE = 10;
const MARGIN = 10;

function getRandomInt(min, max) {
  return min+Math.floor(Math.random() * Math.floor(max-min));
}

// ルーレット描画の基本設定

function preload(){

}

function setup() {
    var canvas = createCanvas(700, 700);
    canvas.parent('canvas');
    textSize(20);
    stroke(0, 0, 0);
    fill(0, 0, 0);
    background(255, 255, 255);
    recalculate();
    renumbering();
    dataFetch();
}

function draw() {
    fill(255,255,255);              // 塗りつぶし:白
    rect(0, 0, width, height);      // canvasの大きさに合わせて四角形を描画
    translate(width/2, height/2);   // 中心座標を(300, 300)へ移動

    fill(255, 0, 0);
    push();
    translate(0, -RADIUS-MARGIN);
    triangle(0, 0, -TRIANGLE_SIZE/2, -TRIANGLE_SIZE, TRIANGLE_SIZE/2, -TRIANGLE_SIZE);
    pop();

    switch(mode) {
    case Mode.waiting:
        break;
    case Mode.acceleration:
        if(speed<MAX_SPEED){
            speed+=ACCEL;
        }else{
            mode = Mode.constant;
            speed = MAX_SPEED;
        }
        theta += speed;
        theta-=(Math.floor(theta/2/PI))*2*PI;
        rotate(theta);
        break;
    case Mode.constant:
        theta += speed;
        theta-=(Math.floor(theta/2/PI))*2*PI;
        rotate(theta);
        break;
    case Mode.deceleration:
        if(speed > DECEL){
            speed -= DECEL + getRandomInt(-DECEL_RAND_LEVEL, DECEL_RAND_LEVEL) * DECEL_RAND_MAGNITUDE;
        }else{
            speed = 0.0;
            mode = Mode.result;
        }
        theta += speed;
        theta -= (Math.floor(theta/2/PI))*2*PI;
        rotate(theta);
        break;
    case Mode.result:
        rotate(theta);
        if(!resultDisplayed){
            resultDisplayed = true;
            var angleSum = theta;
            var beforeAngleSum = theta;
            var result = 0;
            for(var i = 0; i < len; i++){
                angleSum += probabilityList[i] * 2 * PI;
                if((angleSum>3/2*PI && beforeAngleSum < 3/2*PI) || (angleSum>7/2*PI&&beforeAngleSum<7/2*PI)) {
                    result = i;
                    num = i + 1;
                    break;
                }
                beforeAngleSum = angleSum;
            }
            $('.modal').css('display', 'block');
            $('#result').html(num + '番 ' + nameList[result]);
        }
        break;
    }
    drawRoulette();
}

// 入力フォームの検証
function validation() {
    var badflag = false;
    $('.name').each(function(){
        if($(this).val()==""){
            badflag = true;
        }
    });
    $('.ratio').each(function(){
        if((!$(this).val()>0)){
            badflag = true;
        }
    });
    if(badflag){
        alert('項目名と割合を正しく設定してください。');
        return 1;
    }
    return 0;
}
// 入力フォーム内容の取得
function dataFetch() {
    // 各項目の割合を取得
    ratioSum = 0.0;
    $('.item').each(function(){
        var ratio = $(this).find('.ratio').val()-0;
        ratioSum += ratio;
    });
    // 各項目の名前と当選確率をそれぞれ取得し、配列に格納
    nameList = [];
    probabilityList = [];
    $('.item').each(function(){
        var name = $(this).find('.name').val();
        var ratio = $(this).find('.ratio').val()-0;
        nameList.push(name);
        probabilityList.push(ratio/ratioSum);
    });
    // 各項目の色の割り当て
    var colors = [];
    len = nameList.length;
    for(var i=0; i < len; i++){
        colors.push(Math.floor(255 / len*i));
    }
    colorList = [];
    if(len % 2 == 0){
        for(var i = 0; i < len; i += 2){
            colorList[i] = colors[Math.floor(i/2)];
        }
        for(var i = 1; i < len; i += 2){
            colorList[i] = colors[Math.floor(i/2 + len/2)];
        }
    }else{
        for(var i = 0; i < len; i += 2){
            colorList[i] = colors[Math.floor(i/2)];
        }
        for(var i = 1; i < len; i += 2){
            colorList[i] = colors[Math.floor(i/2) + Math.floor(len/2) + 1];
        }
    }
    cssColorSet();
}

function cssColorSet() {
    var counter = 0;
    $('.color-indicator').each(function() {
        push();
        colorMode(HSL, 255);
        var c = color(colorList[counter], 255-COLOR_ADJ*colorList[counter], 128);
        pop();
        $(this).css('background-color', "rgb(" + c._getRed() + "," + c._getGreen() + "," + c._getBlue() +")");
        counter++;
    });
}

function drawRoulette(){
    var angleSum = 0.0;
    var x,y;
    var r = 230;
    var angle;
    push();
    colorMode(HSL, 255);
    for(var i=0;i<len;i++){
        fill(colorList[i],255-COLOR_ADJ*colorList[i],128);
        arc(0,0,RADIUS*2,RADIUS*2,angleSum,angleSum+2*PI*probabilityList[i]);
        angleSum += probabilityList[i]*2*PI;
    }
    pop();
}

// ---------- jQuery ---------- //

// 確率を自動計算する
function recalculate(){
    var ratioSumJs = 0;
    $('.ratio').each(function(){
        ratioSumJs += $(this).val()-0;
    });
    $(".item").each(function(){
        var probability = ($(this).find(".ratio").first().val()-0) / ratioSumJs;
        probability*=100;
        probability = probability.toFixed(3);
        $(this).children(".probability").first().html(probability + "%");
    });
}

// 項目の追加
$('.add').click(function() {
    var add = '<tr class="item"><td class="number"></td><td><div class="color-indicator"></div></td><td><input type="text" class="name" value="項目"></td><td><input type="number" class="ratio" value="1"></td><td class="probability"></td><td><button type="button" onclick="rmItem(this)">削除</button></td></tr>';
    $('#table').append(add);
    recalculate();
    renumbering();
    if(mode==Mode.waiting){
        dataFetch();
    }
});

// 項目の削除
function rmItem(e){
    if($('.ratio').length>2){
        $(e).parent().parent().remove();
        recalculate();
        renumbering();
    }
    if(mode==Mode.waiting){
        dataFetch();
    }
}

// 項目の追加・削除を検知して確率を再計算する
$('#table').on('change', '.ratio', function() {
    recalculate();
    renumbering();
    if(mode==Mode.waiting){
        dataFetch();
    }
});

function start(){
    if(mode==Mode.waiting){
        if(validation()==1){
            return;
        }
        $('#stop').css('display', 'inline-block');
        $('#start').css('display', 'none');
        dataFetch();
        mode = Mode.acceleration;
    }
}

function stop(){
    if(//mode==Mode.acceleration || //加速中でもストップボタンを効かせるにはコメントアウトを解除
        mode==Mode.constant){
        $('#start').css('display', 'none');
        $('#stop').css('display', 'none');
        mode = Mode.deceleration;
    }
}

function reset(){
    $('#start').css('display', 'inline-block');
    $('#stop').css('display', 'none');
    theta = 0.0;
    speed = 0.0;
    mode = Mode.waiting;
    if(validation()==0){
        dataFetch();
    }
    resultDisplayed = false;
}


//
var num = 0;

// アイテムセット
$('.item-num').on('change', function(){
    num = $(this).val()-0;
    $('.item-num').val(num);
});

function itemSet() {
    if(!(num == len)){
        // 設定したい項目数を取得
        num = $('.item-num').val()-0;
        // 現在の項目数を取得
        len = nameList.length;
        if (num > len){
            var addItemNum = num - len;
            for(var i=0; i < addItemNum; i++){
                console.log('s')
                var add = '<tr class="item"><td class="number"></td><td><div class="color-indicator"></div></td><td><input type="text" class="name" value="項目"></td><td><input type="number" class="ratio" value="1"></td><td class="probability"></td><td><button type="button" onclick="rmItem(this)">削除</button></td></tr>';
                $('#table').append(add);
            }
        }else{      // len > num
            var rmItemNum = len - num;
            for(var i=0; i < rmItemNum; i++){
                $('.item').last().remove();
            }
        }
        recalculate();
        renumbering();
        if(mode==Mode.waiting){
            dataFetch();
        }
    }
}

function renumbering() {
    var i = 1;
    $(".item").each(function(){
        $(this).children(".number").first().html(i);
        i++;
    });
}

function modalClose() {
    $('.modal').css('display', 'none');
    var previous = $('#result').html();
    $('#previous').html(previous)
    reset();
}
