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
    this.diceBounce = .8;
    this.wallBounce = 1;
    this.drawTimer = null;
    this.physics = new Physics();
    this.state = 'init';

    this.dice1 = new Sprite("dice-all-new", 6, 100, appMgr.height/2-75);
    this.dice2 = new Sprite("dice-all-new", 6, 220, appMgr.height/2-75);
    
    this.walls = [makeWall(0, 0, 0, appMgr.height), //left
		  makeWall(0, 0, appMgr.width, 0), //top
		  makeWall(appMgr.width, 0, appMgr.width, appMgr.height), //right
		  makeWall(0, appMgr.height, appMgr.width, appMgr.height)]; // bottom

    
    this.initDice = function() {
	this.dice1.vel = new Vector(-7, 20);
	this.dice1.angVel = .3;
	this.dice2.vel = new Vector(5, -60);
	this.dice2.angVel = -.3;
    };

    this.play = function() {
	appMgr.canvas.onmousedown = function() {
	    if (game.state != 'rolling') {
		game.state = 'rolling';
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

	ctx.clearRect(0, 0, appMgr.width, appMgr.height);
	ctx.drawImage(game.bg, 0, 0, appMgr.width, appMgr.height);
	
	if (game.state === 'init') {
	    if (game.imgLoadCt === game.totalImgCt) {
		game.initDice();
		game.state = 'loaded';
//		Ext.Msg.alert('Tap to Roll', "Roll 7, 11, or Doubles to win!", Ext.emptyFn);
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
	    game.physics.collide(dice1, dice2, game.diceBounce);
	    for (i = 0; i < game.walls.length; i++) {
		wall = game.walls[i];
		game.physics.collide(dice1, wall, game.wallBounce);
		game.physics.collide(dice2, wall, game.wallBounce);
	    }
	    dice1.draw();
	    dice2.draw();
	} else if (game.state === 'stopped') {
	    clearInterval(game.drawTimer);
	    game.drawTimer = null;
	    dice1.draw();
	    dice2.draw();
	    var sum = game.dice1.frameIndex+1 + game.dice2.frameIndex+1;
	    if ((game.dice1.frameIndex === game.dice2.frameIndex) ||
		(sum === 7) || (sum === 11)) {
		Ext.Msg.alert('Congratulations', "You just won a free beer!", Ext.emptyFn);
	    } else {
		Ext.Msg.alert('Sorry', "You Lose. Better Luck Next time.", Ext.emptyFn);
	    }

	} 
    };

    this.stop = function() {
	game.state = 'stopped';
    };
}
