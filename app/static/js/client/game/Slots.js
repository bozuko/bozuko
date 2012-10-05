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
        
        baseWidth: 320,
        baseHeight: 415,
        
        lang : Ext.apply( Bozuko.client.game.Abstract.prototype.lang, {
            loading : {
                entry : 'Loading...',
                result : 'Spinning...'
            },
            instructions: 'Spin to Win!'
        }),
        
        constructor : function(){
            Bozuko.client.game.Slots.superclass.constructor.apply(this, arguments);
            this.$prizes = [];
            this.$targets = [];
            this.positions = [];
            this.scratchedPositions = {};
            this.scratchImages = [];
            this.ieScratches = [];
            this.loaded = false;
            this.rendered = false;
            this.isIos = window.navigator.userAgent.match(/i(phone|pad|pod)/i);
            this.scale = this.width / this.baseWidth;
            this.useRetina = (this.isIos && window.devicePixelRatio > 1) || this.width > this.baseWidth;
            
            this.on('enter', this.onEnter, this);
            this.on('result', this.onResult, this);
            // this.on('scratch', this.onScratch, this);
            //this.on('updatedescription', this.onUpdateDescription, this);
            
            this.init();
        },
        
        onUpdateDescription : function(description){
            description.child('.above-prizes').update(
                '<h2>'+this.lang.instructions+'</h2>'
            );
        },
        
        init : function(){
            
            for(var i=0; i<6; i++){
                
                var ox = this.prizeOffsetX/this.baseWidth,
                    oy = this.prizeOffsetY/this.baseHeight,
                    w = this.prizeWidth/this.baseWidth,
                    h = this.prizeHeight/this.baseHeight,
                    x = (ox + (i%3*w)),
                    y = (oy + (Math.floor(i/3)*h));
                    
                this.positions.push({
                    x:x*100,
                    y:y*100
                });
            }
            
            var self = this;
            
            // add the masks
            if( Modernizr.canvas ) Ext.each( this.scratchMasks, function(mask, i){
                self.addImage( 'scratch-mask-'+i, mask )
            });
            else self.addImage( 'scratch-mask', '/images/client/scratch/scratchMask_0024.png');
            
            // check for custom result images
            var animations = ['win','lose','freePlay','playAgain'];
            for(var i=0; i<animations.length; i++){
                var cur = animations[i];
                if( this.game.config.theme.options[cur+'Custom'] ){
                    // delete the others
                    delete this.resultImages[cur+'Txt'];
                    delete this.resultImages[cur+'Bg'];
                    delete this.resultImages[cur+'Stars'];
                    this.resultImages[cur+'Custom'] = this.game.config.theme.options[cur+'Custom'];
                }
            }
            
            // add the images
            for(var i in this.resultImages ){
                self.addImage( i, this.resultImages[i]);
            }
            
            // add the specific game theme
            var bg = this.game.config.theme.images.background.match(/^http\:/i) ?
                this.game.config.theme.images.background :
                this.game.config.theme.base+'/'+this.game.config.theme.images.background;
            
            // is this retina?
            if( this.useRetina ){
                var parts = bg.split('/');
                var file = parts.pop();
                bg = parts.join('/')+'2x/'+file;
            }
            
            self.addImage('bg', bg);
            self.loadImages();
            
            if( this.renderTo ){
                this.render( this.renderTo );
            }
        },
        
        render : function(parent){
            
            var self = this;
            
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
                cls         :'game scratch-ticket'
            });
            if( this.game.config.theme.options.no_numbers ){
                this.$ct.addClass('no-numbers');
            }
            this.$ct.setStyle({
                width       :this.width+'px',
                height      :this.height+'px'
            });
            // draw the prize and targets...
            for(var i=0; i<6; i++){
                
                var el, pos = self.positions[i];
                
                el = self.$prizes[i] = self.$ct.createChild({
                    tag         :'div',
                    cls         :'prize',
                    html        :'&nbsp;'
                });
                
                el.setStyle({
                    left: pos.x+'%',
                    top: pos.y+'%'
                });
                
                el = self.$targets[i] = self.$ct.createChild({
                    tag         :'div',
                    cls         :'target',
                    html        :'&nbsp;'
                });
                
                el.setStyle({
                    left: pos.x+'%',
                    top: pos.y+'%'
                });
                
                var scratch = (function(i){
                    return function(e){self.scratch( Ext.EventObject.setEvent(e),i); };
                })(i);
                
                self.$targets[i].on('click', scratch);
            }
            
            self.$pageImage = self.$ct.createChild({
                tag         :'img',
                cls         :'profile-pic',
                src         :this.page.image //.replace(/type=large/i, 'type=square')
            });
            
            self.$pageImageTarget = self.$ct.createChild({
                cls         :'profile-pic-target'
            });
            
            self.$pageImageTarget.on('click', function(e){
                e.stopEvent();
                this.pause();
            }, self);
            
            if( Ext.isIE7 || Ext.isIE8 ){
                //self.$pageImage.dom.style.filter='progid:DXImageTransform.Microsoft.BasicImage(rotation=3)';
            }
            
            self.$ticketsLeft = self.$ct.createChild({
                cls         :'tickets-left',
                html        :'0'
            });
            
            if( !self.game.config.display_number_tickets ){
                self.$ticketsLeft.setVisibilityMode( Ext.Element.DISPLAY );
                self.$ticketsLeft.hide();
            }
            
            self.$animationsCt = self.$ct.createChild({
                cls         :'animations'
            });
            self.$animationsCt.setVisibilityMode( Ext.Element.DISPLAY );
            self.$animationsCt.hide();
            
            self.$animations = {};
            
            self._createAnimationDiv('lose');
            self._createAnimationDiv('playAgain');
            self._createAnimationDiv('freePlay', true);
            self._createAnimationDiv('win', true);
            
            // add the canvas
            
            if( Modernizr.canvas ){
                
                this.$ticket = this.$ct.createChild({
                    tag         :'canvas',
                    cls         :'ticket',
                    width       :this.width,
                    height      :this.height
                });
                
                this.$ticketCtx = this.$ticket.dom.getContext('2d');
                
                if( this.isIos && window.devicePixelRatio > 1 ){
                    this.$ticket.dom.setAttribute('width', this.width*2);
                    this.$ticket.dom.setAttribute('height', this.height*2);
                    this.$ticketCtx.scale(2,2);
                    this.$ticket.setStyle({
                        'width': this.width+'px',
                        'height':this.height+'px'
                    });
                }
            }
            else{
                this.$ticket = this.$ct.createChild({
                    tag         :'img',
                    cls         :'ticket',
                    width       :this.width,
                    height      :this.height,
                    src         :this.image('bg').src
                });
                this.$ieScratch = this.$ct.createChild({
                    tag         :'div',
                    cls         :'ie-scratch',
                    style       :'width: '+this.width+'px; height: '+this.height+'px;'
                });
                // pre add all the scratches
                for(var i=0; i<6; i++){
                    var pos = this.positions[i],
                        x = pos.x/100*self.width,
                        y = pos.y/100*self.height,
                        w = self.prizeWidth*self.scale,
                        h = self.prizeHeight*self.scale;
                    
                    self.ieScratches[i] = self.$ieScratch.createChild({
                        tag             :'img',
                        style           :'left: '+x+'px;top:'+y+'px;width:'+w+'px;height:'+h+'px;visibility: hidden;',
                        src             :self.image('scratch-mask').src
                    });
                }
            }
            this.reset();
            this.rendered = true;
            this.fireEvent('render', this);
        },
        
        _createAnimationDiv : function(name, stars){
            var self = this;
            
            self.$animations[name] = self.$animationsCt.createChild({
                cls         :'animation '+name
            });
            
            self.$animations[name].setVisibilityMode( Ext.Element.DISPLAY );
            
            if( !self.image(name+'Custom') ){
                
                self.image(name+'Bg').className = 'bg';
                self.$animations[name].dom.appendChild(self.image(name+'Bg'));
                
                self.image(name+'Txt').className = 'txt';
                self.$animations[name].dom.appendChild(self.image(name+'Txt'));
                
                if( stars ){
                    self.image(name+'Stars').className = 'stars';
                    self.$animations[name].dom.appendChild(self.image(name+'Stars'));
                }
            }
            else {
                self.image(name+'Custom').className = 'custom';
                self.$animations[name].dom.appendChild(self.image(name+'Custom'));
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
            this.result();
        },
        
        onResult : function(result){
            for(var i=0; i<result.result.numbers.length; i++ ){
                var n = result.result.numbers[i];
                this.$prizes[i].update(
                    '<div class="number">'+n.number+'</div>'+
                    '<div class="name">'+n.text+'</div>'
                );
            }
            this.reset();
            this.loaded = true;
            var tokens = this.state.user_tokens+(result.free_play?0:1);
            this.$ticketsLeft.update(tokens);
        },
        
        showAnimation : function(name, callback, scope){
            
            if( this.resultAnimating ) return;
            
            this.resultAnimating = true;
            var self = this;
            
            this.clearCache('game_result');
            this.clearCache('state');
            
            // TODO - what to do if this is not css3 compliant?
            
            this.$animationsCt.select('.animation').removeClass('animate');
            this.$animationsCt.show();
            var cur = this.$animations[name];
            cur.addClass('animate');
            
            
            var anim, cancelAnimation;
            if( !Modernizr.cssanimations ){
                var grow=true,
                    animStopped=false,
                    scale = [.8, 1],
                    xy = cur.getXY(),
                    wh = [cur.getWidth(),cur.getHeight()],
                    animOpts;
                
                cancelAnimation = function(){
                    animStopped = true;
                    if( animOpts.anim && animOpts.anim.isAnimating && animOpts.anim.isAnimating() ) animOpts.anim.stop();
                    cur.setStyle({
                        'top':0,'left':0,'bottom':0,'right':0,
                        'width':'100%',
                        'height':'100%'
                    });
                };
                
                cur.setStyle({
                    'width':'auto',
                    'height':'auto'
                });
                
                var animate = function(){
                    
                    if( animStopped ) return;
                    
                    var r = Math.round,
                        w = {from: r(wh[0]*scale[grow?0:1]), to: r(wh[0]*scale[grow?1:0]) },
                        h = {from: r(wh[1]*scale[grow?0:1]), to: r(wh[1]*scale[grow?1:0]) },
                        x = {from: r((wh[0]-w.from) / 2), to: r((wh[0]-w.to) / 2)},
                        y = {from: r((wh[1]-h.from) / 2), to: r((wh[1]-h.to) / 2)};
                    
                    var args = {top: x, left: y, right: x, bottom: y };
                    
                    grow = !grow;
                    cur.anim(args, animOpts);
                };
                
                animOpts = {
                    duration: .35,
                    callback: animate,
                    easing: 'easeOut'
                };
                animate();
            }
            
            var cancelled = false;
            var cancel = function(){
                if( cancelAnimation ) cancelAnimation();
                self.resultAnimating = false;
                self.$animationsCt.un('click', clickHandler);
                if( cancelled ) return;
                cancelled = true;
                self.$animations[name].removeClass('animate');
                self.$animationsCt.hide();
                if( callback ) {
                    callback.apply(scope||self);
                }
                else{
                    self.next();
                }
            };
            var clickHandler = function(e){
                e.stopEvent();
                cancel();
            };
            setTimeout(function(){
                self.$animationsCt.on('click', clickHandler);
            }, 500);
            
            setTimeout(cancel, 5000);
        },
        
        reset : function(){
            var bg = this.image('bg');
            if( Modernizr.canvas ){
                this.$ticketCtx.drawImage( bg, 0, 0, this.width, this.height );
            }
            else{
                // need to erase any images we drew...
                for(var i=0; i<6; i++){
                    this.ieScratches[i].dom.style.visibility='hidden';
                    this.$prizes[i].setStyle('display','none');
                }
            }
            this.loaded = false;
            this.scratched = 0;
            this.scratchedWins = 0;
            this.scratchedPositions = {};
        },
        
        scratch : function(e, index){
            e.preventDefault();
            if( !this.loaded || this.scratchedPositions[index] || this.resultAnimating ) return;
            
            this.scratchedPositions[index] = true;
            
            var self = this;
            this.scratched++;
            
            var cb = false;
            
            if( !this._animationImminent ){
                if( this.game_result.win ){
                    var cur = this.game_result.result.numbers[index];
                    if( this.game_result.result.winning_number == cur.number ){
                        if( ++this.scratchedWins == 3 ){
                            
                            this._animationImminent=true;
                            if( this.game_result.free_play ){
                                cb = function(){
                                    this.showAnimation('freePlay');
                                    //  blink...
                                    var count = 0;
                                    var interval = setInterval(function(){
                                        self.$ticketsLeft.setVisible(count++%2);
                                        if( count == 10 ) clearInterval( interval );
                                    }, 300);
                                };
                            }
                            else{
                                cb = function(){
                                    this.fireEvent('displaywin', this.game_result, this);
                                    this.showAnimation('win', this.onAfterWin, this);
                                };
                            }
                        }
                    }
                }
                else if( this.scratched == 6 ){
                    this._animationImminent=true;
                    if( !this.state.user_tokens ){
                        cb = function(){
                            this.fireEvent('displaylose', this.game_result, this);
                            this.showAnimation('lose');
                        };
                    }
                    else{
                        cb = function(){
                            this.fireEvent('displaylose', this.game_result, this);
                            this.showAnimation('playAgain');
                        };
                    }
                }
            }
            
            
            var pos = this.positions[index],
                ctx = Modernizr.canvas ? this.$ticketCtx : null,
                frame = 0;
                
            var animate = function(){
                
                 var x = pos.x/100*self.width,
                     y = pos.y/100*self.height,
                     w = self.prizeWidth*self.scale,
                     h = self.prizeHeight*self.scale;
                
                if( ctx ){
                    ctx.save();
                    ctx.globalCompositeOperation = 'destination-out';
                    ctx.drawImage(self.image('scratch-mask-'+frame),x,y,w,h);
                    ctx.restore();
                }
                else{
                    self.ieScratches[index].dom.style.visibility= 'visible';
                }
                if(!ctx || ++frame >= self.scratchMasks.length){
                    if( !ctx ){
                        self.$prizes[index].setStyle('display', 'block');
                    }
                    self.fireEvent('scratch', index);
                    if( self._animationImminent ) self._animationImminent = false;
                    if( cb ) cb.call(self);
                    return;
                }
                requestAnimationFrame(animate);
            };
            
            requestAnimationFrame(animate);
        }
    });
})();
