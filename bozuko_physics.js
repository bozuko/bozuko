function Point(x,y) {
    this.x = x;
    this.y = y;
}

function Projection(min, max) {
    this.min = min;
    this.max = max;
}

// All sprites are rectangles.
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
	that.center = new Point(that.x + that.width/2, that.y + that.height/2);
	game.imgLoadCt++;
    };

    this.setPoints = function() {
	this.topLeft.x = this.x;
	this.topLeft.y = this.y;
	this.bottomLeft.x = this.x;
	this.bottomLeft.y = this.y + this.height;
	this.topRight.x = this.x + this.width;
	this.topRight.y = this.y;
	this.bottomRight.x = this.x + this.width;
	this.bottomRight.y = this.y + this.height;
	this.center.x = this.x + this.width/2;
	this.center.y = this.y + this.height/2;
    };

    this.rotate = function(angle) {
	var sin = Math.sin(this.rotationAngle);
	var cos = Math.cos(this.rotationAngle);
	this.rotationAngle += angle;
	this.topLeft.x = cos*this.x;
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

function Physics() {    
    this.move = function(sprites) {
	var i;
	for (i = 0; i < sprites.length; i++) {
	    sprites[i].vx *= sprites[i].accX;
	    sprites[i].vy *= sprites[i].accY;
	    sprites[i].y += sprites[i].vy;
	    sprites[i].x += sprites[i].vx;
	    sprites[i].setPoints();
	}
    };

    this.bounce = function(s1, s2, bounciness) {
	var s1vx = (bounciness*s2.mass*(s2.vx-s1.vx)+s1.mass*s1.vx+s2.mass*s2.vx)/(s1.mass + s2.mass);
	var s2vx = (bounciness*s1.mass*(s1.vx-s2.vx)+s1.mass*s1.vx+s2.mass*s2.vx)/(s1.mass + s2.mass);
	var s1vy = (bounciness*s2.mass*(s2.vy-s1.vy)+s1.mass*s1.vy+s2.mass*s2.vy)/(s1.mass + s2.mass);
	var s2vy = (bounciness*s1.mass*(s1.vy-s2.vy)+s1.mass*s1.vy+s2.mass*s2.vy)/(s1.mass + s2.mass);
	s1.vx = s1vx;
	s1.vy = s1vy;
	s2.vx = s2vx;
	s2.vy = s2vy;
    };

    // Project Polygon (sprite) onto axis to determine min/max
    var projectPoly = function(sprite, axis) {
	var points = [sprite.topLeft, sprite.bottomLeft, sprite.topRight, sprite.bottomRight];
	var min, max;
	var dp, i;
	min = max = points[0].x * axis.x + points[0].y * axis.y;
	for (i = 1; i < points.length; i++) {
	    dp = points[i].x * axis.x + points[i].y * axis.y;
	    if (dp > max) { 
		    max = dp;
		} else if (dp < min) {
		    min = dp;
		}
	}
	
	// Correct for center offset
	dp = sprite.center.x * axis.x + sprite.center.y * axis.y;
	min += dp;
	max += dp;
	return new Projection(min, max);
    };   
    
    var projectionIntersect = function(points, s1, s2) {
	var i, t;
	var axis = new Point(0,0);
	var proj1, proj2;
	for (i = 0; i < points.length; i++) {
	    // Figure out the axis to project onto
	    if (i === 0) {
		axis.x = points[points.length - 1].y - points[0].y;
		axis.y = points[0].x - points[points.length - 1].x;
	    } else {
		axis.x = points[i - 1].y - points[i].y;
		axis.y = points[i].x - points[i - 1].x;
	    }
	    
	    // Normalize the axis
	    t = Math.sqrt(axis.x*axis.x + axis.y*axis.y);
	    axis.x /= t;
	    axis.y /= t;
	    
	    proj1 = projectPoly(s1, axis);	    
	    proj2 = projectPoly(s2, axis);
	    
	    /* test if lines intersect, if not, return false */
	    if (proj1.max < proj2.min || proj1.min > proj2.max) {
		return false; 
	    }
	}
	return true;
    }; 

    // Use separating axis theorem with projection.
    // http://en.wikipedia.org/wiki/Separating_axis_theorem
    // http://gpwiki.org/index.php/VB:Tutorials:Building_A_Physics_Engine:Basic_Intersection_Detection
    // http://gpwiki.org/index.php/IntersectionTestInC
    // http://www.sevenson.com.au/actionscript/sat/
    this.collision = function(s1, s2) {
	var s1Points = [s1.topLeft, s1.bottomLeft, s1.topRight, s1.bottomRight];
	var s2Points = [s2.topLeft, s2.bottomLeft, s2.topRight, s2.bottomRight];

	if (projectionIntersect(s1Points, s1, s2) && projectionIntersect(s2Points, s1, s2)) {
	    return true;
	} else {
	    return false;
	}
    };

    this.wallCollideAndBounce = function(sprites, canvasWidth, canvasHeight) {
    	var i = null;
    	var colliders = new Array();
    	var sprite = null;
    	for (i = 0; i < sprites.length; i++) {
    	    sprite = sprites[i];
    	    if (sprite.vx < 0 && (sprite.topLeft.x <= 0 || sprite.topRight.x <= 0 || 
				  sprite.bottomLeft.x <= 0 || sprite.bottomRight.x <= 0)) {
    		sprite.vx = -sprite.vx;
    		colliders.push(sprite);
	    } else if (sprite.vx > 0 && (sprite.topLeft.x >= canvasWidth || 
					 sprite.topRight.x >= canvasWidth || 
					 sprite.bottomLeft.x >= canvasWidth ||
					 sprite.bottomRight.x >= canvasWidth)) {
		sprite.vx = -sprite.vx;
		colliders.push(sprite);
	    } else if (sprite.vy < 0 && (sprite.topLeft.y <= 0 || sprite.topRight.y <= 0 ||
					 sprite.bottomLeft.y <= 0 || sprite.bottomRight.y <= 0)) {
		sprite.vy = -sprite.vy;
		colliders.push(sprite);
	    } else if (sprite.vy > 0 && (sprite.topLeft.y >= canvasHeight || 
					 sprite.topRight.y >= canvasHeight || 
					 sprite.bottomLeft.y >= canvasHeight ||
					 sprite.bottomRight.y >= canvasHeight)) {
		sprite.vy = -sprite.vy;
		colliders.push(sprite);
	    }
	}
	return colliders;
    };
}
