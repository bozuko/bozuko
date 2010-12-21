function object(o) {
        function F() {}
        F.prototype = o;
        return new F();
}

function DiceGame() {
    var that = this;
    var ticker = 25; // ms
    var d1 = {
	id: "dice1",
    	imgSrc: 'dice-30x30.png',
    	numFrames: 6,
    	x: 100,
    	y: 150,
    	mass: .03,
    	vel: new Vector(-1.7, 1),
    	angVel: 90,
    	friction: .03,
    	bounciness: .8
    };
    
    var d2 = object(d1);
    d2.id = "dice2";
    d2.x = 150;
    d2.y = 150;
    d2.vel = new Vector(1, -.8);
    d2.angVel = -90;

    this.drawTimer = null;
    this.world = new World({game: this,
			    view: 'top-down',
    			    bgImgSrc: 'felt.jpg',
    			    width: '320',
    			    height: '356',
    			    bounciness: .8});
    this.dice1 = this.world.addSprite(d1);
    this.dice2 = this.world.addSprite(d2);
    this.state = 'init';
    this.prevTime = 0;
    this.secondCounter = 0;
    this.frameCt = 0;
    this.frameRate = 1000/ticker;
    this.gameOver = false;

    this.loaded = function() {
	this.world.screen.onmousedown = function() {
	    if (that.state != 'rolling') {
		that.state = 'rolling';
	    }
	};
	this.state = 'loaded';
	this.prevTime = (new Date()).getTime();
	this.drawTimer = setInterval(this.loop, ticker);
    };

    this.loop = function() {
	var date = new Date();
	var frameLen = date.getTime() - that.prevTime;
	that.frameCt++;
	that.prevTime = date;
	that.secondCounter += frameLen;

	if (that.secondCounter > 1000) {
	    that.frameRate = that.frameCt;
//	    document.write("<p>framerate = ", that.frameRate);
//	    document.write("secondCounter = ", that.secondCounter, "</p>");
	    that.secondCounter = 0;
	    that.frameCt = 0;
	} 
	
	if (that.state === 'loaded') {
	    that.world.draw();
	} else if (that.state === 'rolling') {
	    that.world.update();
	    that.world.draw();
	} else if (that.state === 'stopped') {
	    var sum = that.dice1.frameIndex+1 + that.dice2.frameIndex+1;
	    if (!that.gameOver) {
		if ((that.dice1.frameIndex === that.dice2.frameIndex) ||
		    (sum === 7) || (sum === 11)) {
		    Ext.Msg.alert('Congratulations', "You just won a free beer!", Ext.emptyFn);
		} else {
		    Ext.Msg.alert('Sorry', "You Lose. Better Luck Next time.", Ext.emptyFn);
		}
	    }
	    that.gameOver = true;
	    that.state = 'loaded';
	} 
    };

    this.stop = function() {
	this.state = 'stopped';
    };
}
