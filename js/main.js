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

// ★ルーレットの色割り当て関数に使用する定数
const COLOR_ADJ = 0.4;

// ★ルーレット描画に使用する定数（半径）
const RADIUS = 250;

// 三角形の描画に使用する定数（辺の長さ）

const TRIANGLE_SIZE = 10;
const MARGIN = 10;

// 項目番号の取得
var num = 0;

// ---------------------------------------------------- ルーレット描画・アニメーション(p5.js) ---------------------------------------------------- //

// 与えた引数の間でランダムな数値を返す(減速処理で使用) --------------------------------------------------------
function getRandomInt(min, max) {
  return min+Math.floor(Math.random() * Math.floor(max-min));
}

// ルーレット描画の基本設定 --------------------------------------------------------------------------------
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

// 描画 1/60秒(0.015秒)ごとに呼び出されている-----------------------------------------------------------------

function draw() {
    fill(255,255,255);              // 塗りつぶし:白
    rect(0, 0, width, height);      // canvasの大きさに合わせて四角形を描画
    translate(width/2, height/2);   // 描画座標を(300, 300)へ移動

    fill(255, 0, 0);                // 塗りつぶし:赤
    push();
    translate(0, -RADIUS-MARGIN);   // 描画座標を(300, 40)へ移動　RADIUS = 250, MARGIN = 10;
    triangle(0, 0, -TRIANGLE_SIZE/2, -TRIANGLE_SIZE, TRIANGLE_SIZE/2, -TRIANGLE_SIZE);  // 三角形を描画(ルーレットの結果を示す針)　triangle(x1,y1, x2,y2, x3,y3);
    pop();

    // ----- ルーレット回転処理 -----
    switch(mode) {
        case Mode.waiting:      // 初期状態
            break;
        case Mode.acceleration: // スタートボタン押下
            if(speed<MAX_SPEED){
                speed+=ACCEL;       //0.01ラジアン(Radian), 約0.58度(Degree)ずつ加算
            }else{
                mode = Mode.constant;
                speed = MAX_SPEED;
            }
            theta += speed;
            theta -= (Math.floor(theta/2/PI))*2*PI; // 変数thetaが加算され続けると2π(6.28)を超えてしまうので調整。2π超える回転は結果の取得にバグが出てしまう。
            rotate(theta);
            break;
        case Mode.constant:     // 最大速度まで加速後の定速状態
            theta += speed;
            theta -= (Math.floor(theta/2/PI))*2*PI;
            rotate(theta);
            break;
        case Mode.deceleration: // ストップボタン押下
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
            rotate(theta);      // theta分だけ回転した状態で静止
            if(!resultDisplayed){
                resultDisplayed = true;
                var angleSum = theta;
                var beforeAngleSum = theta;
                var result = 0;
                for(var i = 0; i < len; i++){
                    angleSum += probabilityList[i] * 2 * PI;    // 回転した角度(変数theta)に各項目の面積(2π)をインクリメントしていき結果を確認する
                    if((angleSum>3/2*PI && beforeAngleSum < 3/2*PI) || (angleSum>7/2*PI&&beforeAngleSum<7/2*PI)) { // 項目の始まり（beforeAngleSum）と終わり（AngleSum）がルーレットの項目が真上(3/2π)を指しているか、またrotate後の回転角度が270~360°だった場合、前半の式がTrueにならないので3/2πに2π足した7/2πという条件式を足している
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

// 入力フォームの検証 -----------------------------------------------------------------------------------
function validation() {
    var badflag = false;
    var nameErrList = [];
    var ratioErrList = [];
    var num = 1;
    var errMode;
    // 項目名が空白
    $('.name').each(function(){
        if($(this).val()==""){
            badflag = true;
            errMsg = "項目名"
            nameErrList.push(num);
            errMode = 0;
        }
        num++;
    });
    // 割合が空白
    num = 1;    // 初期化
    $('.ratio').each(function(){
        if((!$(this).val()>0)){
            if(badflag){
                errMsg = "項目名と割合";
                ratioErrList.push(num);
                errMode = 2;
            }else{
                badflag = true;
                errMsg = "割合";
                ratioErrList.push(num);
                errMode = 1;
            }
        }
        num++;
    });
    if(badflag){
        // エラーメッセージの加工
        switch(errMode){
            case 0: // 項目名のみにエラーが出ている
                msg = '項目名\nNo.' + nameErrList.join(', ');
                break;

            case 1: // 割合にのみエラーが出ている
                msg = '割合\nNo.' + ratioErrList.join(', ');
            break;

            case 2: // 項目名・割合両方にエラーが出ている
                msg = '項目名\nNo.' + nameErrList.join(', ') + '\n\n割合\nNo.' + ratioErrList.join(', ');
            break;
        }
        alert(errMsg + 'を正しく設定してください。\n\n以下が正しく設定されていない項目ナンバーです。\n\n' + msg)
        return 1;
    }
    return 0;
}
// 入力フォーム内容の取得 -----------------------------------------------------------------------------------
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
        colors.push(Math.floor(255 / len*i));   // 255までのパラメータを 項目数 / i で配列に格納
    }
    colorList = [];
    if(len % 2 == 0){   // 配列colorsに格納したパラメータを0, n/2 , 1....という形で分散させて配列colorListに格納
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

// htmlクラス"color-indicator"、ルーレットの円弧に設定する色 --------------------------------------------------
function cssColorSet() {
    var counter = 0;
    $('.color-indicator').each(function() {
        push();
        colorMode(HSL, 255);    // HSL色空間で色を設定する
        var c = color(colorList[counter], 255-COLOR_ADJ*colorList[counter], 128);   // 配列colorListに格納した0~255までのパラメータから色相, 彩度, 輝度を設定し、変数cに格納
        pop();
        $(this).css('background-color', "rgb(" + c._getRed() + "," + c._getGreen() + "," + c._getBlue() +")");  //変数cに設定した色情報をRGBで設定。_get〜メソッドは変数cの赤、緑、青のパラメータをそれぞれ取得する
        counter++;
    });
}

// ルーレットの描画 ----------------------------------------------------------------------------------------

function drawRoulette(){
    push();
// ----- 円弧の描画 -----
    var angleSum = 0.0;
    var textAngleList = [];     // 盤面に文字を入れる角度を格納する
    colorMode(HSL, 255);
    for(var i=0;i<len;i++){
        fill(colorList[i],255-COLOR_ADJ*colorList[i],128);
        arc(0,0,RADIUS*2,RADIUS*2,angleSum,angleSum+2*PI*probabilityList[i]);
        textAngleList.push(degrees(angleSum + angleSum+2*PI*probabilityList[i]) / 2);
        angleSum += probabilityList[i]*2*PI;
    }
// ----- 数字の描画 -----
    var r = 180;            // 盤面の中心座標から半径180pxのところに数値を描画する
    var x, y;               // 円周上の座標を格納する
    var w, h;               // 盤面に描画するellipse(楕円)のwidth, height
    var textPlaseAdj = 5;   // テキスト配置の微調整 項目数が多くなり、円と文字が小さくなった際にバランスを取る
    textAlign(CENTER);
// -----  描画設定  -----
    // 項目数に応じて、盤面内に描写するellipseのwidth, height、テキストのサイズを設定する
    switch(true) {
        // 項目数 15　までの設定
        case len <= 15:
            w = 40;
            h = 40;
            textSize(20);
            break;
        // 項目数 15以上、30　までの設定
        case len >= 15 && len <= 30:
            w = 30;
            h = 30;
            textSize(15);
            break;
        // 項目数 30以上、50　までの設定
        case len >= 30 && len <= 50:
            w = 20;
            h = 20;
            r = 200;
            textSize(10);
            break;
        // 項目数 50以上、70　までの設定
        case len >= 50 && len <= 70:
            w = 15;
            h = 15;
            r = 220;
            textSize(7.5);
            textPlaseAdj = 2;
            break;
        // 項目数 70以上、100　までの設定
        case len >= 70 && len <= 100:
            w = 10;
            h = 10;
            r = 240;
            textSize(5);
            textPlaseAdj = 2;
            break;
    }
    // 数字描画処理
    for(var i=0;i<len;i++){
        if(!(probabilityList[i] == 0)) {
            x = cos(radians(textAngleList[i])) * r;
            y = sin(radians(textAngleList[i])) * r;
            fill(255);
            ellipse(x, y, w, h);
            fill(0)
            text(i + 1, x, y + textPlaseAdj);
        }
    }
    pop();
}



// ---------------------------------------------------- 入力フォーム・モーダル（jQuery） ---------------------------------------------------- //




// 確率を自動計算する ------------------------------------------------------------------------------------
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

// 項目の追加 ------------------------------------------------------------------------------------------
$('.add').click(function() {
    var add = '<tr class="item"><td class="number"></td><td><div class="color-indicator"></div></td><td class="item-name"><input type="text" class="name" value="項目"></td><td><input type="number" class="ratio" value="1" min="0"></td><td class="probability"></td><td><button type="button" onclick="rmItem(this)">削除</button></td></tr>';
    $('#table').append(add);
    recalculate();
    renumbering();
    if(mode==Mode.waiting){
        dataFetch();
    }
});

// 項目の削除 ------------------------------------------------------------------------------------------
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

// 項目の追加・削除を検知して確率を再計算する ----------------------------------------------------------------
$('#table').on('change', '.ratio', function() {
    recalculate();
    renumbering();
    if(mode==Mode.waiting){
        dataFetch();
    }
});

// スタートボタン ----------------------------------------------------------------------------------------
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

// ストップボタン -----------------------------------------------------------------------------------------
function stop(){
    if(//mode==Mode.acceleration || //加速中でもストップボタンを効かせるにはコメントアウトを解除
        mode==Mode.constant){
        $('#start').css('display', 'none');
        $('#stop').css('display', 'none');
        mode = Mode.deceleration;
    }
}

// リセットボタン -----------------------------------------------------------------------------------------
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

// 項目数入力フォームの変化を検知して上下のフォームを同期させる ----------------------------------------------------
$('.item-num').on('change', function(){
    num = $(this).val()-0;
    $('.item-num').val(num);
});

// n項目に設定する処理 --------------------------------------------------------------------------------------
function itemSet() {
    if(!(num == len)){
        // 設定したい項目数を取得
        num = $('.item-num').val()-0;
        // 現在の項目数を取得
        len = nameList.length;
        if (num > len){
            var addItemNum = num - len;
            for(var i=0; i < addItemNum; i++){
                var add = '<tr class="item"><td class="number"></td><td><div class="color-indicator"></div></td><td class="item-name"><input type="text" class="name" value="項目"></td><td><input type="number" class="ratio" value="1" min="0"></td><td class="probability"></td><td><button type="button" onclick="rmItem(this)">削除</button></td></tr>';
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

// 項目No.のナンバリング処理 --------------------------------------------------------------------------------
function renumbering() {
    var i = 1;
    $(".item").each(function(){
        $(this).children(".number").first().html(i);
        $(this).children(".item-name").children('.name').first().val("項目 " + i);
        i++;
    });
}

// 結果表示モーダルを閉じる　---------------------------------------------------------------------------------
function modalClose() {
    $('.modal').css('display', 'none');
    var previous = $('#result').html();
    $('#previous').html(previous)
    reset();
}
