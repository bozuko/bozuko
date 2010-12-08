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

	this.dice2.x = appMgr.width - this.dice1.width;
	this.dice2.y = appMgr.height - this.dice1.height;
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
	    if (game.physics.intersectRect(dice1, dice2)) {
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

function Point(x,y) {
    this.x = x;
    this.y = y;
    return this;
}

function Sprite(name, numFrames, x, y) {
    var that = this;
    this.type = Sprite;
    this.ctx = appMgr.ctx;
    this.numFrames = numFrames;
    this.x = x;
    this.y = y;
    this.rotationAngle = 0;
    this.img = new Image();
    this.img.src = name + ".png";
    this.img.onload = function() {
	that.width = that.img.width/numFrames;
	that.height = that.img.height;
	that.topLeft = new Point(that.x, that.y);
	that.bottomLeft = new Point(that.x, that.y + that.height);
	that.topRight = new Point(that.x + that.width, that.y);
	that.bottomRight = new Point(that.x + that.width, that.y + that.height);
	game.imgLoadCt++;
    };

    this.rotate = function(angle) {
	var sin = Math.sin(this.rotationAngle);
	var cos = Math.cos(this.rotationAngle);
	this.rotationAngle += angle;
	this.topLeft.x = cos*.5*this.x;
	this.topLeft.y = sin*this.y;
	this.bottomLeft.x = cos*this.x;
	this.bottomLeft.y = sin*this.y+this.height;
	this.topRight.x = cos*this.x + this.width;
	this.topRight.y = sin*this.y;
	this.bottomRight.x = cos*this.x + this.width;
	this.bottomRight.y = sin*this.y+this.height;
    };
    
    this.draw = function() {
	var sx = Math.floor(this.frameIndex * this.width);
	var sy = 0;
	var sWidth = Math.floor(this.width);
	var sHeight = this.height;
	var dWidth = Math.floor(this.width);
	var dHeight = this.height;
	var dx = this.x;
	var dy = this.y;

	this.ctx.save();
	if (this.rotationAngle) {
	    dx = -dWidth/2;
	    dy = -dHeight/2;
	    this.ctx.translate(this.x, this.y);
	    this.ctx.rotate(this.rotationAngle);
	}
	this.ctx.drawImage(this.img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
	this.ctx.restore();
    };    
    return this;
}
