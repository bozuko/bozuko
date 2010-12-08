var Game = {
    play: function() { 
	alert('win');
    }
};

DiceGame.prototype = Game;
DiceGame.prototype.constructor = DiceGame;
function DiceGame() {
    this.ctx = appMgr.ctx;
    this.totalImgCt = 3;
    this.imgLoadCt = 0;
    this.bg = new Image();
    this.bg.src = "felt.jpg";
    this.bg.onload = function() {
	game.imgLoadCt++;
    };
    this.dice1 = new Sprite("dice-all", 6, 0, 0);
    this.dice2 = new Sprite("dice-all", 6, 0, 0);
    this.diceBounce = 1;
    this.drawTimer = null;
    this.physics = new Physics();
    this.state = 'init';
    
    this.initDice = function() {
	this.dice1.x = appMgr.width/2;
	this.dice1.y = appMgr.height/2;
	this.dice1.vx = 10;
	this.dice1.vy = 5;
	this.dice1.accX = 1;
	this.dice1.accY = 1;
	this.dice1.mass = 1;

	this.dice2.x = appMgr.width/2 + this.dice1.width;
	this.dice2.y = appMgr.height/2;
	this.dice2.vx = -20;
	this.dice2.vy = 2;
	this.dice2.accX = 1;
	this.dice2.accY = 1;
	this.dice2.mass = 1;
    };

    this.play = function() {
	appMgr.canvas.onmousedown = function() {
	    if (game.state != 'rolling') {
		game.state = 'rolling';
	    } else {
		game.state = 'stopped';
	    }
	};
	
	this.drawTimer = setInterval(this.loop, appMgr.spf*1000);
    };

    this.loop = function() {
	var ctx = appMgr.ctx;
	var dice1 = game.dice1;
	var dice2 = game.dice2;

	ctx.clearRect(0, 0, appMgr.width, appMgr.height);
	ctx.drawImage(game.bg, 0, 0, appMgr.width, appMgr.height);

	if (game.state === 'init') {
	    if (game.imgLoadCt === game.totalImgCt) {
		game.initDice();
		game.state = 'loaded';
	    }
	} else if (game.state === 'loaded') {
	    dice1.frameIndex = 0;
	    dice2.frameIndex = 0;
	    dice1.draw();
	    dice2.draw();
	} else if (game.state === 'rolling') {
	    dice1.frameIndex = Math.floor(Math.random() * dice1.numFrames);
	    dice2.frameIndex = Math.floor(Math.random() * dice2.numFrames);
	    game.physics.move([dice1, dice2]);
	    if (game.physics.collision(dice1, dice2)) {
		game.physics.bounce(dice1, dice2, game.diceBounce);
	    }
	    var colliders = game.physics.wallCollideAndBounce([dice1, dice2], 
							      appMgr.width, appMgr.height);
	    //dice1.rotate(.3);
	    dice1.draw();
	    //dice2.rotate(.3);
	    dice2.draw();
	} else if (game.state === 'stopped') {
	    dice1.draw();
	    dice2.draw();
	} 
    };


    this.drawResults = function() {
	clearInterval(game.drawTimer);
	game.drawTimer = null;
    };
}
