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

    this.bounce = function(s1, s2) {
	var s1vx = (game.diceBounce*s2.mass*(s2.vx-s1.vx)+s1.mass*s1.vx+s2.mass*s2.vx)/(s1.mass + s2.mass);
	var s2vx = (game.diceBounce*s1.mass*(s1.vx-s2.vx)+s1.mass*s1.vx+s2.mass*s2.vx)/(s1.mass + s2.mass);
	var s1vy = (game.diceBounce*s2.mass*(s2.vy-s1.vy)+s1.mass*s1.vy+s2.mass*s2.vy)/(s1.mass + s2.mass);
	var s2vy = (game.diceBounce*s1.mass*(s1.vy-s2.vy)+s1.mass*s1.vy+s2.mass*s2.vy)/(s1.mass + s2.mass);
	s1.vx = s1vx;
	s1.vy = s1vy;
	s2.vx = s2vx;
	s2.vy = s2vy;
    };

    this.collisionDetect = function(s1, s2) {
	// collision of s2 with bottom left of s1
	if (left(s1, s2) && bottom(s1, s2)) {
	    return true;
	}
	
	// collision of s2 with bottom right of s1
	if (right(s1, s2) && bottom(s1, s2)) {
	    return true;
	}

	// collision of s2 with top left of s1
	if (left(s1, s2) && top(s1, s2)) {
	    return true;
	}
	
	// collision of s2 with top right of s1 
	if (right(s1, s2) && top(s1, s2)) {
	    return true;
	}
	return false;
    };

    this.wallCollideAndBounce = function(sprites) {
	var s;
	var colliders = new Array();
	for (s in sprites) {
	    if (sprites[s].vx < 0 && sprites[s].x <= 0) {
		sprites[s].vx = -sprites[s].vx;
		colliders.push(sprites[s]);
	    } else if (sprites[s].vx > 0 && sprites[s].x + sprites[s].width >= appMgr.width) {
		sprites[s].vx = -sprites[s].vx;
		colliders.push(sprites[s]);
	    } else if (sprites[s].vy < 0 && sprites[s].y <= 0) {
		sprites[s].vy = -sprites[s].vy;
		colliders.push(sprites[s]);
	    } else if (sprites[s].vy > 0 && sprites[s].y + sprites[s].height >= appMgr.height) {
		sprites[s].vy = -sprites[s].vy;
		colliders.push(sprites[s]);
	    }
	}
	return colliders;
    };
}
