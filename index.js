var appMgr = {
    fps: 13,      // Frames per second
    spf: 1/13,   // Seconds per frame
    canvas: null,
    ctx: null,
    width: 320,
    height: 480,
    frameTimer: null
};

var game = 'null';

window.onload = function () {
    initCanvas();
    playGame();
}

function initCanvas() {
    appMgr.canvas = document.getElementById('canvas');
    appMgr.ctx = appMgr.canvas.getContext('2d');
    appMgr.ctx.globalAlpha = 1;
}

function playGame() {
    // Once the game loads it starts playing automatically
    game = new DiceGame();
}
