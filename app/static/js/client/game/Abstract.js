var Game = function(ticket, mask){
        
    this.background = document.createElement('div');
    this.background.className = 'scratch-bg';
    document.body.appendChild( this.background );
    
    this.background.style.width = this.width+'px';
    this.background.style.height = this.height+'px';
    
    this.canvas = document.createElement('canvas');
    
    this.canvas.setAttribute('width', this.width);
    this.canvas.setAttribute('height', this.height);
    this.background.appendChild(this.canvas);
    
    this.ctx = this.canvas.getContext('2d');
    this.ticket = ticket;
    this.mask = mask;
    this.images = {};
    this.load();
};

Scratch.prototype.width     = 320;
Scratch.prototype.height    = 415;
Scratch.prototype.frames    = 24;

Scratch.prototype.reset = function(){
    // lets add the ticket
    this.ctx.drawImage(this.images.ticket,0,0);
};

Scratch.prototype.load = function(){
    // load mask and img
    var self = this,
        loaded = 0,
        images = ['ticket','mask'];
        
    for(var i=1; i<25; i++){
        
        var key = images[images.length] = 'mask_00'+(i<10?'0':'')+i;
        self[key] = self.mask.replace(/Mask_\d+/, key.replace(/m/,'M'));
        
    }
        
    for(var i=0; i<images.length; i++){
        (function(name, src){
            var img = new Image();
            img.onload = function(){
                self.images[name] = img;
                if( ++loaded == images.length ) self.render();
            }
            img.src = src;
        })(images[i], self[images[i]]);
    }
};

Scratch.prototype.render = function(){
    // lets add the ticket
    this.reset()
    this.drawPrizes();
};

Scratch.prototype.drawPrizes = function(){
    var self = this;
    for(var i=0; i<6; i++){
        // draw the prize
        (function drawPrize(col,row){
            var prize = document.createElement('div');
            prize.className = 'prize';
            prize.innerHTML = '<div class="number">5</div><div class="name">Long Ass Prize Name</div>';
            
            var x = (20 + (col*90) + (col*3) ),
                y = (126 + (row*115));
                
            prize.style.left = x+'px';
            prize.style.top = y+'px';
            self.background.appendChild(prize);
            
            var target = document.createElement('div');
            target.className = 'target';
            target.style.left = x+'px';
            target.style.top = y+'px';
            self.background.appendChild(target);
            
            target.addEventListener('mousedown', function(){
                self.scratch(col,row);
            }, true);
            
            
        })(i%3, Math.floor(i/3));
    }
};

Scratch.prototype.scratch = function(col,row){
    
    // this.ctx.drawImage(this.images.mask, (24 + (col*90)), (125 + (row*115)));
    
    var i = 1, self = this;
    
    var interval = setInterval(function(){
        self.ctx.save();
        self.ctx.globalCompositeOperation = 'destination-out';
        var key = 'mask_00'+(i<10?'0':'')+i;
        self.ctx.drawImage(self.images[key], (24 + (col*90) + (col * 2) ), (125 + (row*115)));
        self.ctx.restore();
        if( ++i > self.frames ) clearInterval( interval );
    }, 24);
    
};