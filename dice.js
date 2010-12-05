var Game = {
    play: function() { 
	alert('win');
    }
};

function Physics() {
    var top = function(s1, s2) {
	if ((s2.y <= s1.y) && (s2.y + s2.height >= s1.y)) {
	    return true;
	} else {
	    return false;
	}
    };

    var bottom = function(s1, s2) {
	if ((s2.y >= s1.y) && (s2.y <= s1.y + s1.height)) {
	    return true;
	} else {
	    return false;
	}
    };

    var right = function(s1, s2) {
	if ((s2.x >= s1.x) && (s2.x <= s1.x + s1.width)) {
	    return true;
	} else {
	    return false;
	}
    };

    var left = function(s1, s2) {
	if ((s2.x <= s1.x) && (s2.x + s2.width >= s1.x)) {
	    return true;
	} else {
	    return false;
	}
    };

    var bounce = function(s1, s2) {
	var s1vx = (s1.bounce*s2.mass*(s2.vx-s1.vx)+s1.mass*s1.vx+s2.mass*s2.vx)/(s1.mass + s2.mass);
	var s2vx = (s1.bounce*s1.mass*(s1.vx-s2.vx)+s1.mass*s1.vx+s2.mass*s2.vx)/(s1.mass + s2.mass);
	s1.vx = s1vx;
	s2.vx = s2vx;
    };


    this.collision = function(s1, s2) {
	// collision of s2 with bottom left of s1
	if (left(s1, s2) && bottom(s1, s2)) {
	    bounce(s1,s2);
	    return true;
	}

	// collision of s2 with bottom right of s1
	if (right(s1, s2) && bottom(s1, s2)) {
	    bounce(s1,s2);
	    return true;
	}

	// collision of s2 with top left of s1
	if (left(s1, s2) && top(s1, s2)) {
	    bounce(s1,s2);
	    return true;
	}

	// collision of s2 with top right of s1 
	if (right(s1, s2) && top(s1, s2)) {
	    bounce(s1,s2);
	    return true;
	}	
    };
   
}

DiceGame.prototype = Game;
DiceGame.prototype.constructor = DiceGame;
function DiceGame() {
    var that = this;
    this.ctx = appMgr.ctx;
    this.bg = new Image();
    this.bg.src = "felt.jpg";
    this.rollTime = 3; // seconds
    this.dice1 = new Sprite("dice-all", 6, 0, 0, 0);
    this.dice2 = new Sprite("dice-all", 6, 0, 0, 0);
    this.drawTimer = null;
    this.physics = new Physics();

    this.initDice = function() {
	this.dice1.x = 0;
	this.dice1.y = 200;
	this.dice1.vx = 10;
	this.dice1.vy = 0;
	this.dice1.accX = 1;
	this.dice1.accY = 1;
	this.dice1.bounce = 1;
	this.dice1.mass = 1;

	this.dice2.x = appMgr.width - 50;
	this.dice2.y = 200;
	this.dice2.vx = -5;
	this.dice2.vy = 0;
	this.dice2.accX = 1;
	this.dice2.accY = 1;
	this.dice2.bounce = 1;
	this.dice2.mass = 1;
    };

    this.play = function() {
	this.drawTimer = setInterval(this.draw, appMgr.spf*1000);
	setTimeout(this.drawResults, this.rollTime*1000);
    };

    this.draw = function() {
	var ctx = appMgr.ctx;
	ctx.clearRect(0,0,appMgr.width, appMgr.height);
	ctx.drawImage(game.bg, 0, 0, appMgr.width, appMgr.height);
	that.positionDice(game.dice1, game.dice2);
	game.dice1.draw();
	game.dice2.draw();
	if (game.physics.collision(game.dice1, game.dice2)) {
	    that.positionDice(game.dice1, game.dice2);
	}
    };

    this.positionDice = function(dice1, dice2) {
	dice1.vx *= dice1.accX;
	dice1.vy *= dice1.accY;
	dice2.vx *= dice2.accX;
	dice2.vy *= dice2.accY;
	dice1.y += dice1.vy;
	dice1.x += dice1.vx;
	dice2.y += dice2.vy;
	dice2.x += dice2.vx;
    };


    this.drawResults = function() {
	clearInterval(game.drawTimer);
	game.drawTimer = null;
    };

    this.initDice();
}

function Sprite(name, numFrames, x, y, rotationAngle) {
    var that = this;
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
	//	var frameIndex = Math.floor(Math.random() * numFrames);
	var frameIndex = 1;
	var sx = Math.floor(frameIndex * this.width);
	var sy = 0;
	var sWidth = Math.floor(this.width);
	var sHeight = this.height;
	var dx = this.x;
	var dy = this.y;
	var dWidth = Math.floor(this.width);
	var dHeight = this.height;

	this.ctx.save();
	if (this.rotationAngle) {	
	    this.ctx.rotate(game.dice1.rotationAngle);
	}

	this.ctx.drawImage(this.img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
	this.ctx.restore();
    };    
}
