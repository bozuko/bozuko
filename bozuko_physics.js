// Polygon intersection code is based off Olivier Renault's PollyColly
// Separated Axis Theorem (SAT) used to test polygon intersection

function Interval(min, max) {
    this.min = min;
    this.max = max;
}

function Vector(x, y) {
    this.x = x;
    this.y = y;

    this.plus = function(v) {
	return new Vector(this.x + v.x, this.y + v.y);
    };
    
    this.minus = function(v) {
	return new Vector(this.x - v.x, this.y - v.y);
    };

    this.timesScalar = function(n) {
	return new Vector(this.x * n, this.y * n);
    };

    this.perp = function() {
	return new Vector(-y, x);
    };

    this.length = function() {
        return Math.sqrt(this.x*this.x + this.y*this.y);
    };

    this.dot = function(v) {
	return this.x*v.x + this.y*v.y;
    };

    this.cross = function(v) {
	return this.x * v.y - this.y *v.x;
    };
    
    this.normalize = function() {
	var l = length();
	if (l != 0) {
	    this.x = this.x / l;
	    this.y = this.y / l;
	}
    };

    this.angle = function(v) {
	var dp = this.dot(v);
	var cp = this.cross(v);
	return Math.atan2(cp, dp);
    };

    this.rotate = function(angle) {
	var tx = this.x;
	this.x = this.x * Math.cos(angle) - this.y * Math.sin(angle);
	this.y = tx * Math.sin(angle) + this.y * Math.cos(angle);
    };
}

function Polygon(vertices) {
    this.vertices = vertices;   
    
    this.rotate = function(angle) {
	var i; 
	for (i = 0; i < this.vertices.length; i++) {
	    this.vertices[i].rotate(angle);
	}
    };

    this.translate = function(x, y) {
	var i; 
	for (i = 0; i < this.vertices.length; i++) {
	    this.vertices[i].x += x;
	    this.vertices[i].y += y;
	}
    };

    this.addToVertices = function(v) {
	var i;
	for (i = 0; i < this.vertices.length; i++) {
	    this.vertices[i] = this.vertices[i].plus(v);
	}
    };

    this.subtractFromVertices = function(v) {
	var i;
	for (i = 0; i < this.vertices.length; i++) {
	    this.vertices[i] = this.vertices[i].minus(v);
	}
    };
    
    this.intersect = function(poly) {
	var info = new CollisionInfo();
	info.mtdLenSquared = -1; // flag mtd as invalid
	var i, j;
	var v0, v1;
	var edge;
	var axis;

	// test separation axes of this
	for (i = 0, j = this.vertices.length-1; i < this.vertices.length; j=i, i++) {
	    v0 = this.vertices[j];
	    v1 = this.vertices[i];
	    edge = v1.minus(v0);
	    axis = edge.perp();
	    if (this.separatedByAxis(axis, poly, info)) {
		return info;
	    }
	}

	// test separation axes of poly	
	for (i = 0, j = poly.vertices.length-1; i < poly.vertices.length; j=i, i++) {
	    v0 = poly.vertices[j];
	    v1 = poly.vertices[i];
	    edge = v1.minus(v0);
	    axis = edge.perp();
	    if (this.separatedByAxis(axis, poly, info)) {
		return info;
	    }
	}
	info.overlapped = true;
	return info;
    };

    // calculate the largest projection of the polygon on the given axis.
    this.project = function(axis) {
	var min, max, i, d;
	min = max = this.vertices[0].dot(axis);
	
	for (i = 1; i < this.vertices.length; i++) {
	    d = this.vertices[i].dot(axis);
	    if (d < min) {
		min = d;
	    } else if (d > max) {
		max = d;
	    }
	}
	return new Interval(min, max);
    };

    this.separatedByAxis = function(axis, poly, info) {
	var d0, d1;
	var overlap;
	var axisLenSquared;
	var sep, sepLenSquared;
	var proj1 = this.project(axis);
	var proj2 = poly.project(axis);
	
	// calculate the two possible overlap ranges.
	// either we overlap on the left or right of the polygon.
	d0 = proj2.max - proj1.min;
	d1 = proj2.min - proj1.max;

	if (d0 < 0 || d1 > 0) {
	    return true;
	}
	
	// find out if we overlap on the 'right' or 'left' of the polygon.
	overlap = (d0 < -d1)? d0 : d1;
	
	// the mtd vector for the axis
	sep = axis.timesScalar(overlap / axis.dot(axis));
	sepLenSquared = sep.dot(sep);

	if (sepLenSquared < info.mtdLenSquared || info.mtdLenSquared < 0) {
	    info.mtdLenSquared = sepLenSquared;
	    info.mtd = sep;
	}
	return false;		
    };
}

function CollisionInfo() {
    this.mtdLenSquared = 0;
    this.mtd = new Vector(0,0);
    this.overlapped = false;    
}

function Wall(poly) {    
    this.pos = new Vector(poly.vertices[0].x, poly.vertices[0].y);
    this.polygon = poly;
    this.vx = 0;
    this.vy = 0;
    this.mass = 1000000;
    this.movable = false;
}

// All sprites use rectangular polygons the same size as an image frame for now.
// They are always oriented at a 0 deg angle on initialization.
//
function Sprite(name, numFrames, x, y) {
    var that = this;
    this.type = Sprite;
    this.ctx = appMgr.ctx;
    this.numFrames = numFrames;
    this.img = new Image();
    this.img.src = name + ".png";
    this.pos = new Vector(x, y); // Position is equal to the first vertex of the polygon
    this.vx = 0;
    this.vy = 0;
    this.accX = 1;
    this.accY = 1;
    this.angle = 0;
    this.mass = 1;
    this.movable = true;
    this.width = 0;
    this.height = 0;
    this.polygon = null;

    this.img.onload = function() {
	that.width = that.img.width/numFrames;
	that.height = that.img.height;
	// Order of vertices is important!!!
	var vertices = [new Vector(that.pos.x, that.pos.y), 
			new Vector(that.pos.x + that.width, that.pos.y), 
			new Vector(that.pos.x + that.width, that.pos.y + that.height),
			new Vector(that.pos.x, that.pos.y + that.height)];
	that.polygon = new Polygon(vertices);
	game.imgLoadCt++;
    };
    
    this.draw = function() {
	var sx = Math.floor(this.frameIndex * this.width);
	var sy = 0;
	var sWidth = Math.floor(this.width);
	var sHeight = this.height;
	var dWidth = Math.floor(this.width);
	var dHeight = this.height;
	var dx = this.pos.x;
	var dy = this.pos.y;

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
    this.move = function(bodies) {
	var i;
	for (i = 0; i < bodies.length; i++) {
	    bodies[i].vx *= bodies[i].accX;
	    bodies[i].vy *= bodies[i].accY;
	    bodies[i].pos.x += bodies[i].vx;
	    bodies[i].pos.y += bodies[i].vy;
	    bodies[i].polygon.translate(bodies[i].vx, bodies[i].vy);
	}
    };

    this.bounce = function(b1, b2, bounciness) {
	var b1vx = (bounciness*b2.mass*(b2.vx-b1.vx)+b1.mass*b1.vx+b2.mass*b2.vx)/(b1.mass + b2.mass);
	var b1vy = (bounciness*b2.mass*(b2.vy-b1.vy)+b1.mass*b1.vy+b2.mass*b2.vy)/(b1.mass + b2.mass);
	var b2vx = (bounciness*b1.mass*(b1.vx-b2.vx)+b1.mass*b1.vx+b2.mass*b2.vx)/(b1.mass + b2.mass);
	var b2vy = (bounciness*b1.mass*(b1.vy-b2.vy)+b1.mass*b1.vy+b2.mass*b2.vy)/(b1.mass + b2.mass);
	b1.vx = b1vx;
	b1.vy = b1vy;
	b2.vx = b2vx;
	b2.vy = b2vy;
    };

    this.collide = function(b1, b2) {
	var collisionInfo = b1.polygon.intersect(b2.polygon);
	var halfmtd = collisionInfo.mtd.timesScalar(.5);
	var mtd = collisionInfo.mtd;
	if (collisionInfo.overlapped === true) {
	    if (b1.movable && b2.movable) {
		b1.polygon.addToVertices(halfmtd);
		b1.pos = b1.pos.plus(halfmtd);
		b2.polygon.subtractFromVertices(halfmtd);
		b2.pos = b2.pos.minus(halfmtd);
	    } else if (b1.movable && !b2.movable) {
		b1.polygon.addToVertices(mtd);
		b1.pos = b1.pos.plus(mtd);
	    } else { 
		b2.polygon.subtractFromVertices(mtd);
		b2.pos = b2.pos.minus(mtd);
	    }

	    return true;
	}
	return false;
    };
}
