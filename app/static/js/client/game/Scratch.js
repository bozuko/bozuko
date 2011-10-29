Ext.namespace('Bozuko.client.game');

Bozuko.client.game.Scratch = Ext.extend( Bozuko.client.game.Abstract, {
    
    frames: 18,
    prizeWidth: 91,
    prizeHeight: 114,
    
    scratchMasks: [
        'data:image/png;base64,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'
    ],
    
    constructor : function(){
        
        Bozuko.client.game.Scratch.superclass.constructor.apply(this, arguments);
        
        this.$prizes = [];
        this.$targets = [];
        this.images = {};
        this.positions = [];
        this.scratched = {};
        this.scratchImages = [];
        this.loaded = false;
        
        this.init();
        
    },
    
    init : function(){
        
        for(var i=0; i<6; i++){
            var x = (24 + (i%3*91) ),
                y = (124 + (Math.floor(i/3)*114));
            this.positions.push({
                x:x,
                y:y
            })
        }
        
        var self = this;
        Ext.each( this.scratchMasks, function(mask){
            var img = new Image();
            img.src = mask;
            self.scratchImages.push(img)
        });
        
        if( this.renderTo ){
            this.render( this.renderTo );
        }
    },
    
    render : function(parent){
        var self = this;
        
        this.$parent = parent;
        this.$ct = this.$parent.createChild({
            tag         :'div',
            cls         :'game scratch-ticket'
        });
        this.$ct.setStyle({
            width       :this.width+'px',
            height      :this.height+'px'
        });
        // draw the prize and targets...
        for(var i=0; i<6; i++){
            
            var pos = self.positions[i];
            
            self.$prizes[i] = self.$ct.createChild({
                tag         :'div',
                cls         :'prize'
            }).setStyle({
                left: pos.x+'px',
                top: pos.y+'px'
            });
            
            self.$targets[i] = self.$ct.createChild({
                tag         :'div',
                cls         :'target'
            }).setStyle({
                left: pos.x+'px',
                top: pos.y+'px'
            });
            
            var scratch = (function(i){
                return function(){ self.scratch(i); };
            })(i);
            
            self.$targets[i].dom.addEventListener('touchstart', scratch);
            self.$targets[i].dom.addEventListener('mousedown', scratch);
            
        }
        
        // add the canvas
        this.$ticket = this.$ct.createChild({
            tag         :'canvas',
            cls         :'ticket',
            width       :this.width,
            height      :this.height
        });
        this.$ticketCtx = this.$ticket.dom.getContext('2d');
        
        // draw the ticket
        var bg = this.images.bg = new Image();
        this.images.bg.onload = function(){
            self.$ticketCtx.drawImage( bg, 0, 0, bg.width, bg.height );
        };
        bg.src = '/games/scratch/themes/default/default_theme/background-v2.png';
    },
    
    scratch : function(index){
        if( this.scratched[index] ) return;
        this.scratched[index] = true;
        var self = this,
            img = this.scratchImages[0],
            pos = this.positions[index],
            ctx = this.$ticketCtx,
            frames = this.frames,
            i = 0;
        
        // create a buffer
        var frame = 0,
            buffer = document.createElement('canvas'),
            bctx = buffer.getContext('2d');
        
        buffer.width = img.width;
        buffer.height = img.height;
        
        function animate(){
            
            
            bctx.drawImage(img,0,0);
            
            ctx.globalCompositeOperation = 'destination-out';
            ctx.drawImage(img,pos.x,pos.y);
            
            if(++frame >= frames){
                return;
            }
            
        }
        
        // ctx.globalCompositeOperation = 'destination-out';
        // ctx.drawImage(img,pos.x,pos.y);
    }
});