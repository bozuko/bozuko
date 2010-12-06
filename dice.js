var Game = {
    play: function() { 
	alert('win');
    }
};

DiceGame.prototype = Game;
DiceGame.prototype.constructor = DiceGame;
function DiceGame() {
    this.ctx = appMgr.ctx;
    this.bg = new Image();
    this.bg.src = "felt.jpg";
    this.rollTime = 3; // seconds
    this.dice1 = new Sprite("dice-all", 6, 0, 0, 0);
    this.dice2 = new Sprite("dice-all", 6, 0, 0, 0);
    this.diceBounce = 1;
    this.drawTimer = null;
    this.physics = new Physics();
    
    this.initDice = function() {
	this.dice1.x = 0;
	this.dice1.y = 120;
	this.dice1.vx = 25;
	this.dice1.vy = 5;
	this.dice1.accX = 1;
	this.dice1.accY = 1;
	this.dice1.mass = 1;

	this.dice2.x = appMgr.width - this.dice2.width;
	this.dice2.y = 200;
	this.dice2.vx = -20;
	this.dice2.vy = 2;
	this.dice2.accX = 1;
	this.dice2.accY = 1;
	this.dice2.mass = 1;
    };

    this.play = function() {
	this.initDice();
	this.drawTimer = setInterval(this.draw, appMgr.spf*1000);
	setTimeout(this.drawResults, this.rollTime*1000);
    };

    this.draw = function() {
	var ctx = appMgr.ctx;
	ctx.clearRect(0,0,appMgr.width, appMgr.height);
	ctx.drawImage(game.bg, 0, 0, appMgr.width, appMgr.height);
	game.dice1.rotationAngle += .3;
	game.dice1.draw();
	game.dice2.rotationAngle += .3;
	game.dice2.draw();
	game.positionDice([game.dice1, game.dice2]);
	if (game.physics.collisionDetect(game.dice1, game.dice2)) {
	    game.physics.bounce(game.dice1,game.dice2);
	}
	var colliders = game.physics.wallCollideAndBounce([game.dice1, game.dice2]);
    };

    this.positionDice = function(dice) {
	var d;
	for (d in dice) {
	    dice[d].vx *= dice[d].accX;
	    dice[d].vy *= dice[d].accY;
	    dice[d].y += dice[d].vy;
	    dice[d].x += dice[d].vx;
	}
    };

    this.drawResults = function() {
	clearInterval(game.drawTimer);
	game.drawTimer = null;
    };
}

function Sprite(name, numFrames, x, y, rotationAngle) {
    var that = this;
    this.type = Sprite;
    this.ctx = appMgr.ctx;
    this.img = new Image();
    this.img.src = name + ".png";
    this.img.onload = function() {
	that.width = that.img.width/numFrames;
	that.height = that.img.height;	
	game.play();
    };

    x ? this.x = x : this.x = 0;
    y ? this.y = y : this.y = 0;
    
    this.rotationAngle = rotationAngle;

    this.draw = function() {
	var frameIndex = Math.floor(Math.random() * numFrames);
	var sx = Math.floor(frameIndex * this.width);
	var sy = 0;
	var sWidth = Math.floor(this.width);
	var sHeight = this.height;
	var dWidth = Math.floor(this.width);
	var dHeight = this.height;
	var dx = -dWidth/2;
	var dy = -dHeight/2;

	this.ctx.save();
	if (this.rotationAngle) {
	    // Move the canvas to the center of the sprite so it rotates on it's axis.
	    this.ctx.translate(this.x, this.y);
	    this.ctx.rotate(this.rotationAngle);
	}

	this.ctx.drawImage(this.img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
	this.ctx.restore();
    };    
    return this;
}
