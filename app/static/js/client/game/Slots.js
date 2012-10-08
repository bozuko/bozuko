Ext.namespace('Bozuko.client.game');


(function(){
    var requestAnimationFrame = (function(){
        return  window.requestAnimationFrame       || 
                window.webkitRequestAnimationFrame || 
                window.mozRequestAnimationFrame    || 
                window.oRequestAnimationFrame      || 
                window.msRequestAnimationFrame     || 
                function(/* function */ callback, /* DOMElement */ element){
                    window.setTimeout(callback, 1000 / 60);
                };
    })();
    
    var cancelRequestAnimationFrame = (function () {
        return window.cancelRequestAnimationFrame
            || window.webkitCancelRequestAnimationFrame
            || window.mozCancelRequestAnimationFrame
            || window.oCancelRequestAnimationFrame
            || window.msCancelRequestAnimationFrame
            || clearTimeout
    })();

    Bozuko.client.game.Slots = Ext.extend( Bozuko.client.game.Abstract, {
        
        frameRate: 10,
        
        baseWidth: 640,
        baseHeight: 830,
        
        wheelXPositions: [34, 230, 425],
        wheelOrders: [],
        
        frame: "http://bozuko.s3.amazonaws.com/public/slots/assets/slots-frame-large.png",
        
        lang : Ext.apply( Bozuko.client.game.Abstract.prototype.lang, {
            loading : {
                entry : 'Loading...',
                result : 'Spinning...'
            },
            instructions: 'Spin to Win!'
        }),
        
        constructor : function(){
            
            Bozuko.client.game.Slots.superclass.constructor.apply(this, arguments);
            this.isIos = window.navigator.userAgent.match(/i(phone|pad|pod)/i);
            this.scale = this.width / this.baseWidth;
            this.useRetina = (this.isIos && window.devicePixelRatio > 1) || this.width > this.baseWidth;
            
            this.on('enter', this.onEnter, this);
            this.on('result', this.onResult, this);
            
            this.init();
        },
        
        init : function(){
            var self = this
              , icons = this.game.config.icons
              , theme = this.game.config.theme
              
            this.icons = icons;
            
            self.addImage( 'frame', this.frame );
            
            for( var i=0; i < icons.length; i++ ){
                self.addImage( icons[i], theme.base+'/'+theme.icons[icons[i]] );
            }
            
            self.loadImages();
            
            if( this.renderTo ){
                this.render( this.renderTo );
            }
        },
        
        render : function(parent){
            
            var self = this
              , p = this.width / this.baseWidth;
            
            if( this.rendered ) return;
            
            if( !this.isReady() ){
                this.on('ready', function(){
                    self.render(parent);
                });
                return;
            }
            
            this.$parent = parent;
            this.$ct = this.$parent.createChild({
                tag         :'div',
                cls         :'game slot-machine'
            });
            
            this.$ct.setStyle({
                width       :this.width+'px',
                height      :this.height+'px'
            });
            
            this.$frame = this.$ct.createChild({
                tag         :'img',
                cls         :'frame',
                src         :this.image('frame').src
            });
            
            this.$spinButton = this.$ct.createChild({
                cls         :'spin-button'
            });
            
            this.$wheels = [];
            for( var i=0; i<this.wheelXPositions.length; i++){
                // get the actual x
                var x = this.wheelXPositions[i] / this.baseWidth
                  
                var wheel = this.$wheels[this.$wheels.length] = this.$ct.createChild({
                    cls         :'wheel',
                    style       :{
                        left        :(x*100)+'%'
                    }
                });
                
                var wheelCt = wheel.createChild({
                    cls         :'wrap'
                });
                
                var wheelScroll = wheelCt.createChild({
                    cls         :'scroll'
                });
                
                // add the icons to the wheel...
                var icons = this.icons.slice();
                this.wheelOrder[i] = [];
                // 
                
                while( icons.length ){
                    var icon = icons.splice( Math.floor(Math.random()*icons.length), 1 )[0];
                    wheelScroll.createChild({
                        tag         :'img',
                        src         :this.image(icon).src
                    });
                    this.wheelOrder[i][this.wheelOrder[i].length-1] = icon;;
                }
            }
            
            this.reset();
            this.rendered = true;
            this.fireEvent('render', this);
            this.app.hideModal.defer(1000, this.app);
        },
        
        pause : function(){
            if( this._animationImminent ) return;
            // save the old stuff...
            var action = this.getDescription().child('.actions .action'),
                saved = [];
            while( action.dom.childNodes.length ){
                saved.push( action.dom.childNodes[0] );
                action.dom.removeChild( action.dom.childNodes[0] );
            }
            
            this.updateAction('<a href="javascript:;" class="button">Go back to the ticket &raquo;</a>');
            this.getDescription().child('.actions .button').on('click', function(){
                this.app.unmask();
                // add back the old stuff
                Ext.each(saved, function(el){
                    action.dom.appendChild(el);
                });
            }, this);
            this.showDescription();
        },
        
        onEnter : function(entry){
            this.result();
        },
        
        onResult : function(result){
            this.reset();
            this.loaded = true;
            var tokens = this.state.user_tokens+(result.free_play?0:1);
            // TODO - update the spins left (tokens)
        },
        
        reset : function(){
            
        }
    });
})();
