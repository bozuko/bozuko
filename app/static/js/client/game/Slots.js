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
        wheelIcons: [],
        wheelStrips: [],
        wheelScrolls: [],
        
        stripNum : 7,
        
        spinTime: 5,
        spinStagger: 0.7,
        
        frame: "https://bozuko.s3.amazonaws.com/public/slots/assets/slots-frame-large.png",
        
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
            
            this.useTransitions = Modernizr.csstransitions;
            this.use3dTransforms = Modernizr.csstransforms3d;
            
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
            
            self.loadImages(function(){
                
            });
            
            if( this.renderTo ){
                this.render( this.renderTo );
            }
        },
        
        render : function(parent){
            
            var self = this
              , p = this.width / this.baseWidth
            
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
                cls         :'spin-button',
                html        :'<span>Spin</span>'
            });
            
            this.$spinButton.on('click', this.onSpinButtonClick, this);
            
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
                
                var wheelScroll = this.wheelScrolls[i] = wheelCt.createChild({
                    cls         :'scroll'
                });
                
                // add the icons to the wheel...
                var icons = this.icons.slice();
                this.wheelOrders[i] = {};
                this.wheelIcons[i] = {};
                
                this.wheelStrips[i] = [];
                var strip = this.wheelStrips[i][0] = wheelScroll.createChild({
                    cls         :'strip'
                });
                
                while( icons.length ){
                    var icon = icons.splice( Math.floor(Math.random()*icons.length), 1 )[0];
                    strip.createChild({
                        tag         :'img',
                        src         :this.image(icon).src
                    });
                    this.wheelOrders[i][icon] = icons.length;
                    this.wheelIcons[i][icons.length] = icon;
                }
                
                // add the one to the bottom
                wheelScroll.createChild({
                    tag         :'img',
                    cls         :'first-icon',
                    src         :this.image(this.wheelIcons[i][this.icons.length-1]).src
                });
                
                // add the one to the bottom
                wheelScroll.createChild({
                    tag         :'img',
                    cls         :'last-icon',
                    src         :this.image(this.wheelIcons[i][0]).src
                });
                
                this.wheelStrips[i][0] = strip;
                
                // how wide are the images?
                if( !this.iconHeight ) this.iconHeight = strip.getWidth();
                if( !this.stripHeight ) this.stripHeight = this.iconHeight * this.icons.length;
                if( !this.iconOffset ){
                    this.iconOffset = (this.iconHeight*3 - wheel.getHeight() ) / 2;
                }
                
                var y = this.iconOffset - self.iconHeight;
                
                this.use3dTransforms ?
                    wheelScroll.dom.style[Modernizr.prefixed('transform')] = 'translate3d(0, '+y+'px, 0)' :
                    wheelScroll.dom.style.bottom = -y+'px';
                
                for(var j=1; j<this.stripNum; j++ ){
                    var n = Ext.get(strip.dom.cloneNode(true));
                    n.dom.removeAttribute('id');
                    // n.setStyle({'top': (this.stripHeight * j)+'px'});
                    wheelScroll.dom.appendChild( n.dom );
                    this.wheelStrips[i][j] = n;
                }
            }
            
            this.reset();
            this.rendered = true;
            this.fireEvent('render', this);
            
            var self = this;
        },
        
        spin : function( icons ){
            
            for( var i=0; i<icons.length; i++){
                
                var y = this.stripHeight * (this.stripNum-1) + this.iconHeight * this.wheelOrders[i][icons[i]] + this.iconOffset - this.iconHeight;
                var s = this.spinTime + ( this.spinStagger * i );
                
                var self = this
                  , stopped = 0
                  , onWheelStop = (function(i){
                        return function(){
                            self.resetWheel(i, icons[i]);
                            self.wheelScrolls[i].dom.removeEventListener('transitionend', onWheelStop);
                            self.wheelScrolls[i].dom.removeEventListener('webkitTransitionEnd', onWheelStop);
                            self.wheelScrolls[i].dom.removeEventListener('OTransitionEnd', onWheelStop);
                        }
                    })(i);
                
                if( this.useTransitions ){
                    
                    
                    this.wheelScrolls[i].addClass("scroll-transition");
                    this.wheelScrolls[i].dom.style[Modernizr.prefixed('transitionDuration')] = s+'s';
                    
                    this.wheelScrolls[i].dom.addEventListener('transitionend', onWheelStop, false);
                    this.wheelScrolls[i].dom.addEventListener('webkitTransitionEnd', onWheelStop, false);
                    this.wheelScrolls[i].dom.addEventListener('OTransitionEnd', onWheelStop, false);
                    
                    if( this.use3dTransforms ){
                        this.wheelScrolls[i].dom.style[Modernizr.prefixed('transform')] = 'translate3d(0, '+y+'px, 0)';
                    }
                    else{
                        this.wheelScrolls[i].dom.style.bottom = -y+'px';
                    }
                }
                else {
                    // animate...
                }
            }
        },
        
        resetIcons : function( icons ){
            for( var i=0; i<icons.length; i++){
                this.resetWheel( i, icons[i] );
            }
        },
        
        resetWheel : function( i, icon ){
            
            this.wheelScrolls[i].removeClass('scroll-transition');
            // remove the duration
            this.wheelScrolls[i].dom.style[Modernizr.prefixed('transitionDuration')] = '0s';
            // calculate y
            var y = this.iconHeight * this.wheelOrders[i][icon] + this.iconOffset - this.iconHeight;
            if( this.use3dTransforms ){
                this.wheelScrolls[i].dom.style[Modernizr.prefixed('transform')] = 'translate3d(0, '+y+'px, 0)';
            }
            else{
                this.wheelScrolls[i].dom.style.bottom = -y+'px';
            }
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
            // TODO - display the number of tokens...
            this.app.hideModal();
        },
        
        onSpinButtonClick : function(){
            this.result();
        },
        
        onResult : function(result){
            this.loaded = true;
            var tokens = this.state.user_tokens+(result.free_play?0:1);
            console.log( result.result );
            this.spin( result.result );
            // TODO - update the spins left (tokens)
        },
        
        reset : function(){
            
        }
    });
})();
