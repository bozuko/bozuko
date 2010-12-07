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

    this.move = function(sprites) {
	var s;
	for (s in sprites) {
	    sprites[s].vx *= sprites[s].accX;
	    sprites[s].vy *= sprites[s].accY;
	    sprites[s].y += sprites[s].vy;
	    sprites[s].x += sprites[s].vx;
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

    this.intersectRect = function(s1, s2) {
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

    // Take into account the sprite's rotation angle to prevent clipping
    this.wallCollideAndBounce = function(sprites) {
	var s;
	var colliders = new Array();
	var sprite = null;
	for (s in sprites) {
	    sprite = sprites[s];
	    if (sprite.vx < 0 && sprite.x <= 0) {
		sprite.vx = -sprite.vx;
		colliders.push(sprite);
	    } else if (sprite.vx > 0 && sprite.x + sprite.width >= appMgr.width) {
		sprite.vx = -sprite.vx;
		colliders.push(sprite);
	    } else if (sprite.vy < 0 && sprite.y <= 0) {
		sprite.vy = -sprite.vy;
		colliders.push(sprite);
	    } else if (sprite.vy > 0 && sprite.y + sprite.height >= appMgr.height) {
		sprite.vy = -sprite.vy;
		colliders.push(sprite);
	    }
	}
	return colliders;
    };
}
