// Copyright 2010 Andrew J. Stone
// 
// Polygon intersection code is based off Olivier Renault's PollyColly
// Separated Axis Theorem (SAT) used to test polygon intersection
//
// Collision Response and rotation inspired by Chris Hecker's "Game Developer" articles (1996-97)

function Interval(min, max, minpoints, maxpoints) {
    this.min = min;
    this.max = max;
    this.minpoints = minpoints;
    this.maxpoints = maxpoints;
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

    this.times = function(n) {
	return new Vector(this.x * n, this.y * n);
    };

    this.div = function(n) {
	return new Vector(this.x / n, this.y / n);
    };

    this.perp = function() {
	return new Vector(-y, x);
    };

    this.length = function() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    };

    this.dot = function(v) {
	return this.x * v.x + this.y * v.y;
    };

    this.cross = function(v) {
	return this.x * v.y - this.y * v.x;
    };
    
    this.normalize = function() {
	var l = length();
	if (l != 0) {
	    this.x = this.x / l;
	    this.y = this.y / l;
	}
    };

    this.transform = function(center, vel, angVel) {
	var v = center.minus(this);
	var x = v.x;
	v.x = v.x*Math.cos(angVel) - v.y*Math.sin(angVel);
	v.y = v.y*Math.cos(angVel) + x*Math.sin(angVel);
	
	this.x = center.x + v.x + vel.x;
	this.y = center.y + v.y + vel.y;
    };
}

function Polygon(vertices) {
    this.vertices = vertices;   

    this.transform = function(center, vel, angVel) {
	var i;
	for (i = 0; i < this.vertices.length; i++) {
	    this.vertices[i].transform(center, vel, angVel);
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
	    if (this.separatedByAxis(axis, edge, poly, info)) {
		return info;
	    }
	}

	// test separation axes of poly	
	for (i = 0, j = poly.vertices.length-1; i < poly.vertices.length; j=i, i++) {
	    v0 = poly.vertices[j];
	    v1 = poly.vertices[i];
	    edge = v1.minus(v0);
	    axis = edge.perp();
	    if (this.separatedByAxis(axis, edge, poly, info)) {
		return info;
	    }
	}
	info.overlapped = true;
	return info;
    };

    // Calculate the smallest and largest projection of the polygon on the given axis.
    // Also keep track of which points produced those min and max projections.
    this.project = function(axis) {
	var min, max, i, d;
	var minpoints, maxpoints;
	min = max = this.vertices[0].dot(axis);
	minpoints = [0]; 
	maxpoints = [0];

	for (i = 1; i < this.vertices.length; i++) {
	    d = this.vertices[i].dot(axis);
	    if (d < min) {
		minpoints = [i];
		min = d;
	    } else if (d > max) {
		maxpoints = [i];
		max = d;
	    } else {
	    	if (d === min) {
		    minpoints.push(i);
		}
		if (d === max) {
		    maxpoints.push(i);
		}
	    }
	}
	return new Interval(min, max, minpoints, maxpoints);
    };

    this.separatedByAxis = function(axis, edge, poly, info) {
	var d0, d1;
	var overlap;
	var minpoints, minpointsPoly;
	var maxpoints, maxpointsPoly;
	var axisLenSquared;
	var sep, sepLenSquared;
	var proj1 = this.project(axis);
	var proj2 = poly.project(axis);
	
	// calculate the two possible overlap ranges.
	// either we overlap on the left or right of this.polygon.
	d0 = proj2.max - proj1.min;
	d1 = proj2.min - proj1.max;

	if (d0 < 0 || d1 > 0) {
	    return true;
	}
	
	// Find out if poly overlaps this.polygon on the 'left'(d0 < -d1) or 'right'(d0 > -d1)
	// of this.polygon.
	overlap = (d0 < -d1)? d0 : d1;

	if (d0 < -d1) {
	    overlap = d0;
	    minpoints = proj1.minpoints;
	    minpointsPoly = this;
	    maxpoints = proj2.maxpoints;
	    maxpointsPoly = poly;
	} else {
	    overlap = d1;
	    minpoints = proj2.minpoints;
	    minpointsPoly = poly;
	    maxpoints = proj1.maxpoints;
	    maxpointsPoly = this;
	}
	
	// the mtd vector for the axis
	sep = axis.times(overlap / axis.dot(axis));
	sepLenSquared = sep.dot(sep);

	if (sepLenSquared < info.mtdLenSquared || info.mtdLenSquared < 0) {
	    info.mtdLenSquared = sepLenSquared;
	    info.mtd = sep;
	    info.axis = axis;
	    info.edge = edge;
	    info.minpoints = minpoints;
	    info.minpointsPoly = minpointsPoly;
	    info.maxpoints = maxpoints;
	    info.maxpointsPoly = maxpointsPoly;
	}
	return false;		
    };
}

function CollisionInfo() {
    this.mtdLenSquared = 0;
    this.mtd = new Vector(0,0);
    this.overlapped = false;
    this.axis = null;
    this.edge = null;
    this.minpoints = null;
    this.maxpoints = null;
    this.minpointsPoly = null;
    this.maxpointsPoly = null;

    // Note: this.maxpoints contains points from one polygon, and this.minpoints
    // contains points from another polygon.
    this.findCollisionPoint = function() {
	var points;
	var maxpoints = this.maxpoints;
	var minpoints = this.minpoints;
	var p1 = this.minpointsPoly;
	var p2 = this.maxpointsPoly;
	var edge = this.edge;
	var v;
	var len;

	if ((maxpoints.length === 2) && (minpoints.length === 2)) {
	    // edge-edge collision
	    points = [{point: p2.vertices[maxpoints[0]], proj: p2.vertices[maxpoints[0]].dot(edge)}, 
		      {point: p2.vertices[maxpoints[1]], proj: p2.vertices[maxpoints[1]].dot(edge)},
		      {point: p1.vertices[minpoints[0]], proj: p1.vertices[minpoints[0]].dot(edge)},
		      {point: p1.vertices[minpoints[1]], proj: p1.vertices[minpoints[1]].dot(edge)}],
	    points.sort(function(a, b) {
			    return a.proj - b.proj;
			});
	    // The middle points of the array are the end points of the colliding line segment.
	    // Take the midpoint of this segment as the collision point.
	    v = points[1].point.minus(points[2].point).div(2);
	    return points[1].point.minus(v);
 	} else if ((maxpoints.length === 1) && (minpoints.length === 2)) {
	    // point-edge collision
	    return p2.vertices[maxpoints[0]];
	} else if ((maxpoints.length === 2) && (minpoints.length === 1)) {
	    // point-edge collision   
	    return p1.vertices[minpoints[0]];
	} else if ((maxpoints.length === 1) && (minpoints.length === 1)) {
	    // point-point collision
	    return p2.vertices[maxpoints[0]];
	}
    };

}

function Wall(poly) {    
    this.pos = new Vector(poly.vertices[0].x, poly.vertices[0].y);
    this.polygon = poly;
    this.vel = new Vector(0,0);
    this.acc = new Vector(0,0);
    this.mass = 100000;
    this.movable = false;
        
    var v = poly.vertices[1].minus(poly.vertices[0]);
    this.momentOfInertia = (1/12) * this.mass * v.dot(v);
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
    this.pos = new Vector(x, y); // Position is equal to the center of mass of the polygon
    this.vel = null;
    this.acc = new Vector(0, 0);
    this.mass = 1;
    this.orientation = 0;  // Orientation is an angle counterclockwise from the origin.
    this.angVel = 0;
    this.rotationalFriction = .05;
    this.momentOfInertia = 0;
    this.movable = true;
    this.width = 0;
    this.height = 0;
    this.polygon = null;

    this.img.onload = function() {
	that.width = that.img.width/numFrames;
	that.height = that.img.height;
	
	// This moment of inertia only holds for a rectangle with uniform mass rotating around it's center
	that.momentOfInertia = (1/12) * that.mass * (that.width*that.width + that.height*that.height);
	
	// Order of vertices is important!!!
	var vertices = [new Vector(that.pos.x - that.width/2, that.pos.y - that.height/2), 
			new Vector(that.pos.x + that.width/2, that.pos.y - that.height/2), 
			new Vector(that.pos.x + that.width/2, that.pos.y + that.height/2),
			new Vector(that.pos.x - that.width/2, that.pos.y + that.height/2)];
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
	var dx = this.pos.x - this.width/2;
	var dy = this.pos.y - this.height/2;

	this.ctx.save();
	if (this.orientation) {
	    dx = -this.width/2;
	    dy = -this.height/2;
	    this.ctx.translate(this.pos.x, this.pos.y);
	    this.ctx.rotate(-this.orientation);
	}
	this.ctx.drawImage(this.img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
	this.ctx.restore();
    };    
    return this;
}

function Physics() {    
    var that = this;

    // These values are used to stop the objects when they get below certain speeds.
    var frameCtMax = appMgr.fps;
    var frameCt = 0;
    var velocityThreshold = 10;
    var rotationalThreshold = .1;

    this.move = function(bodies) {
	var i, j;
	var body, vertex;
	var vel;
	var bodyStopped = false;
	for (i = 0; i < bodies.length; i++) {
	    body = bodies[i];
	    if (body.movable) {
		body.polygon.transform(body.pos, body.vel, body.angVel);
		body.pos = body.pos.plus(body.vel);
	     	body.orientation += body.angVel;
		body.angVel -= body.rotationalFriction*body.angVel;
		if (bodyStopped) {
		    if (Math.abs(body.angVel) < rotationalThreshold) {
			body.angVel = 0;
			game.stop();
		    }
		} else if (Math.abs(body.vel.x) < velocityThreshold && Math.abs(body.vel.y) < velocityThreshold) { 
		    frameCt++;
		    if (frameCt === frameCtMax) {
			body.vel.x = 0; 
			body.vel.y = 0;
			bodyStopped = true;
			if (Math.abs(body.angVel) < rotationalThreshold) {
			    body.angVel = 0;
			    game.stop();
			}
		    }
		} else {
		    frameCt = 0;
		}
	    }
	}
    };

    // http://chrishecker.com/images/e/e7/Gdmphys3.pdf
    this.bounce = function(b1, b2, bounciness, collisionInfo) {
	var collisionPoint = collisionInfo.findCollisionPoint();
	var n = collisionInfo.axis;
	var v = b1.vel.minus(b2.vel); // relative velocity
	var numer = v.times(-(1 + bounciness)).dot(n);
	var d1 = n.dot(n)*(1/b1.mass + 1/b2.mass);
	var d2 = collisionPoint.minus(b1.pos).perp().dot(n);
	var d3 = d2*d2/b1.momentOfInertia;
	var d4 = collisionPoint.minus(b2.pos).perp().dot(n);
	var d5 = d4*d4/b2.momentOfInertia;
	var denom = d1 + d3 + d5;
	var j = numer/denom;
	
	if (b1.movable) {
	    b1.vel = b1.vel.plus(n.times(j/b1.mass));
	    b1.angVel = b1.angVel + d2*j/b1.momentOfInertia;
	}
	if (b2.movable) {
	    b2.vel = b2.vel.minus(n.times(j/b2.mass));
	    b2.angVel = b2.angVel - d4*j/b2.momentOfInertia;
	}
    };

    this.collide = function(b1, b2, bounciness) {
	var collisionInfo = b1.polygon.intersect(b2.polygon);
	var halfmtd = collisionInfo.mtd.times(.5);
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
	    
	    this.bounce(b1, b2, bounciness, collisionInfo);
	    return true;
	}
	return false;
    };
}
