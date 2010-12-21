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
	var l = this.length();
	if (l != 0) {
	    return new Vector(this.x / l, this.y / l);
	} else {
	    return new Vector(0, 0);
	}
    };

    this.transform = function(center, pos, angle) {
	var v = center.minus(this);
	var x = v.x;
	v.x = v.x*Math.cos(angle) - v.y*Math.sin(angle);
	v.y = v.y*Math.cos(angle) + x*Math.sin(angle);
	
	this.x = center.x + v.x + pos.x;
	this.y = center.y + v.y + pos.y;
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

var body = {
    pos: new Vector(0, 0),
    vel: new Vector(0, 0),
    acc: new Vector(0, 0),
    normalForce: 0,
    mass: 0,
    orientation: 0,
    angVel: 0,
    friction: 0,
    momentOfInertia: 0,
    movable: true,
    polygon: null
};

var Wall = function(poly) {
    this.pos = new Vector(poly.vertices[0].x, poly.vertices[0].y);
    this.polygon = poly;
    this.vel = new Vector(0,0);
    this.mass = 100000;
    this.movable = false;
    
    var v = poly.vertices[1].minus(poly.vertices[0]);
    this.momentOfInertia = (1/12) * this.mass * v.dot(v);
};
Wall.prototype = body;
Wall.prototype.constructor = Wall;


// All sprites use rectangular polygons the same size as an image frame for now.
// They are always oriented at a 0 deg angle on initialization.
//

var Sprite = function(world, id, imgsrc, numFrames, x, y, mass) {
    var that = this;
    this.world = world;
    this.numFrames = numFrames;
    this.frameIndex = 0;
    this.id = id;
    this.img = document.createElement("img");
    // this.img.src = imgsrc;
    this.img.src = "dice_1.png";
    this.img.setAttribute('id', id);
    this.img.setAttribute('style','position: absolute');
    this.img.style.left = x;
    this.img.style.top = y;
    this.world.screen.appendChild(this.img);
    
    this.width = 0;
    this.height = 0;
    
    // Position is equal to the center of mass of the polygon.
    this.pos = new Vector(x/this.world.pixelsPerMeter, y/this.world.pixelsPerMeter); 
    this.mass = mass;	
    
    if (this.world.view === 'top-down') {
	// This is not a 3d engine. So for top-down the normal force is always just the weight of
	// the object;
	this.normalForce = this.world.gravity * this.mass;
    }; 
    
    this.img.onload = function() {
//	that.width = that.img.width/numFrames;
	that.width = that.img.width;
	that.height = that.img.height;
	
	// This moment of inertia only holds for a rectangle with uniform mass rotating around it's center
	that.momentOfInertia = (1/12) * that.mass * (that.width*that.width + that.height*that.height);
	var physicalHalfWidth = that.width/2 / that.world.pixelsPerMeter;
	var physicalHalfHeight = that.height/2 / that.world.pixelsPerMeter;
	
	// Order of vertices is important!!!
	var vertices = [new Vector(that.pos.x - physicalHalfWidth, that.pos.y - physicalHalfHeight), 
			new Vector(that.pos.x + physicalHalfWidth, that.pos.y - physicalHalfHeight), 
			new Vector(that.pos.x + physicalHalfWidth, that.pos.y + physicalHalfHeight),
			new Vector(that.pos.x - physicalHalfWidth, that.pos.y + physicalHalfHeight)];
	that.polygon = new Polygon(vertices);
        that.el = document.getElementById(that.id);
        that.el.style.visibity = 'visible';
	world.spriteLoaded();
    };

    this.draw = function() {
	var pixelX = this.pos.x*this.world.pixelsPerMeter;
	var pixelY = this.pos.y*this.world.pixelsPerMeter;	
	var dx = pixelX - this.width/2;
	var dy = pixelY - this.height/2;
	Ext.Element.cssTransform(that.el, 
				 {translate: [dx, dy, 0],
				  scale: 1,
				  rotate: -this.orientation});
    };
};
Sprite.prototype = body;
Sprite.prototype.constructor = Sprite;

var World = function(o) {
    var that = this;
    var velocityThreshold = .005; // meters per second
    
    if (!(this instanceof World)) {
	this = new World();
    }

    this.physics = new Physics();
    this.screen = document.getElementById('screen');
    this.walls = [];
    this.bodies = [];
    this.spriteCt = 0;
    this.spriteLoadCt = 0;
    this.stopCt = 0;

    // For top down mode, gravity only affects frictional forces. In this mode friction is always
    // body.friction * body.mass * world.gravity
    this.view = 'top-down';
    this.gravity = 9.81; // m/s^2
    this.pixelsPerMeter = 200;
    this.width = 320;
    this.height = 356;
    this.bounciness = .8;

    for (var name in o) {
	this[name] = o[name];
    };

    this.physicalWidth = this.width/this.pixelsPerMeter;
    this.physicalHeight = this.height/this.pixelsPerMeter;


    this.addWall = function(x1, y1, x2, y2) {
	this.walls.push(new Wall(new Polygon([new Vector(x1,y1), new Vector(x2,y2)])));
    };

    this.addWall(0, 0, 0, this.physicalHeight); //left
    this.addWall(0, 0, this.physicalWidth, 0); //top
    this.addWall(this.physicalWidth, 0, this.physicalWidth, this.physicalHeight); //right
    this.addWall(0, this.physicalHeight, this.physicalWidth, this.physicalHeight); // bottom

    this.move = function(bodies) {
	var i, j;
	var body, vertex;
	var vel;
	for (i = 0; i < bodies.length; i++) {
	    body = bodies[i];
	    if (body.movable) {
		this.physics.integrate(this, body);		
		if (Math.abs(body.vel.x) < velocityThreshold && Math.abs(body.vel.y) < velocityThreshold) { 
		    body.vel.x = 0; 
		    body.vel.y = 0;
		    body.angVel = 0;
		    this.stopCt++;
		    if (this.stopCt === bodies.length) {
			that.game.stop();
		    }
		}
	    }
	}
    };

    this.spriteLoaded = function() {
	this.spriteLoadCt++;
	if (this.spriteLoadCt === this.spriteCt) {
	    this.game.loaded();
	}
    };

    this.addSprite = function(o) {
	var sprite = new Sprite(this, o.id, o.imgSrc, o.numFrames, o.x, o.y, o.mass);
	for (var name in o) {
	    sprite[name] = o[name];
	};
	this.bodies.push(sprite);
	this.spriteCt++;
	return sprite;
    };

    this.update = function() {
	var i;
	this.move(this.bodies);
	// FIXME: Generalize this to more than 2 bodies
	var b0 = this.bodies[0];
	var b1 = this.bodies[1];
	this.physics.collide(b0, b1, b0.bounciness);
	for (i = 0; i < this.walls.length; i++) {
	    this.physics.collide(b0, this.walls[i], this.bounciness);
	    this.physics.collide(b1, this.walls[i], this.bounciness);
	}
    };

    this.draw = function() {
	var i;
	for (i = 0; i < this.bodies.length; i++) {
	    this.bodies[i].draw();
	}
    };

    return this;
};

function Physics() {    
    this.integrate = function(world, body) {
	var dPos, dAngle;
	var spf = 1/world.game.frameRate;
	var uv = body.vel.normalize();
	var frictionMagnitude = body.normalForce*body.friction;
	
	// Find the acceleration due to friction (F = ma)
	var frictionAcc = uv.times(-frictionMagnitude).div(body.mass);

	// currently only friction and gravity are acting on the body;
	body.acc = frictionAcc;
	body.vel = body.vel.plus(body.acc.times(spf));
	
	dPos = body.vel.times(spf);
	dAngle = body.angVel * spf;
	body.polygon.transform(body.pos, dPos, dAngle);
	body.pos = body.pos.plus(dPos);
	body.orientation += dAngle;
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
