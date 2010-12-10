var Game = {
    play: function() { 
	alert('win');
    }
};

DiceGame.prototype = Game;
DiceGame.prototype.constructor = DiceGame;
function DiceGame() {
    
    var makeWall = function(x1,y1,x2,y2) {
	return new Wall(new Polygon([new Vector(x1,y1), new Vector(x2,y2)]));
    };

    this.ctx = appMgr.ctx;
    this.totalImgCt = 3;
    this.imgLoadCt = 0;
    this.bg = new Image();
    this.bg.src = "felt.jpg";
    this.bg.onload = function() {
	game.imgLoadCt++;
    };
    this.diceBounce = 1;
    this.wallBounce = 1;
    this.diceFriction = 0;
    this.wallFriction = 0;
    this.drawTimer = null;
    this.physics = new Physics();
    this.state = 'init';
    this.dice1 = new Sprite("dice-all", 6, appMgr.width/2, appMgr.height/2);
    this.dice2 = new Sprite("dice-all", 6, appMgr.width/2 + 50, appMgr.height/2);
    this.walls = [makeWall(0, 0, 0, appMgr.height), //left
		  makeWall(0, 0, appMgr.width, 0), //top
		  makeWall(appMgr.width, 0, appMgr.width, appMgr.height), //right
		  makeWall(0, appMgr.height, appMgr.width, appMgr.height)]; // bottom

    
    this.initDice = function() {
	this.dice1.vel = new Vector(-5, 20);
	this.dice2.vel = new Vector(5, -20);
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
	var i;
	var wall;
	var dice1Bounced = false;
	var dice2Bounced = false;

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
	    game.physics.collide(dice1, dice2, game.diceBounce, game.diceFriction);
	    for (i = 0; i < game.walls.length; i++) {
		wall = game.walls[i];
		
		// Only bounce off one wall at a time. Otherwise dice may get stuck.
		if (!dice1Bounced && game.physics.collide(dice1, wall, game.wallBounce, 
							  game.wallFriction)) {
		    dice1Bounced = true;
		}
		if (!dice2Bounced && game.physics.collide(dice2, wall, game.wallBounce,
							  game.wallFriction)) {
		    dice2Bounced = true;
		}
	    }
	    dice1.draw();
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
