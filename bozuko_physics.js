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
    
    var setPoints = function(sprite) {
	sprite.topLeft.x = sprite.x;
	alert(sprite.topLeft.x+","+sprite.x);
	sprite.topLeft.y = sprite.y;
	sprite.bottomLeft.x = sprite.x;
	sprite.bottomLeft.y = sprite.y + sprite.height;
	sprite.topRight.x = sprite.x + sprite.width;
	sprite.topRight.y = sprite.y;
	sprite.bottomRight.x = sprite.x + sprite.width;
	sprite.bottomRight.y = sprite.y + sprite.height;
    };

    this.move = function(sprites) {
	var s;
	for (i = 0; i < sprites.length; i++) {
	    alert("i = "+i);
	    sprites[i].vx *= sprites[i].accX;
	    sprites[i].vy *= sprites[i].accY;
	    sprites[i].y += sprites[i].vy;
	    sprites[i].x += sprites[i].vx;
	    setPoints(sprites[i]);
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

    this.wallCollideAndBounce = function(sprites, canvasWidth, canvasHeight) {
    	var s;
    	var colliders = new Array();
    	var sprite = null;
    	for (s in sprites) {
    	    sprite = sprites[s];
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
