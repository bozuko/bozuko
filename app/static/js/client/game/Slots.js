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
        
        autoPlay : false,
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
        
        iconPadding: 3,
        
        frame: "https://bozuko.s3.amazonaws.com/public/slots/assets/slots-frame-large.png",
        
        resultImages : {
            
            'winBg' : '/images/client/scratch/scratchYouWinBg.png',
            'winTxt': '/images/client/scratch/scratchYouWinTxt.png',
            'winStars': '/images/client/scratch/scratchStarsBg.png',
            
            'loseBg' : '/images/client/scratch/scratchYouLoseBg.png',
            'loseTxt': '/images/client/scratch/scratchYouLoseTxt.png',
            
            'playAgainBg': '/images/client/scratch/scratchYouLosePlayAgainBg.png',
            'playAgainTxt': '/images/client/scratch/scratchYouLosePlayAgainTxt.png',
            
            'freePlayTxt': '/images/client/scratch/scratchBonusTixTxt.png',
            'freePlayBg' : '/images/client/scratch/scratchYouWinBg.png',
            'freePlayStars': '/images/client/scratch/scratchStarsBg.png'
        },
        
        lang : Ext.apply( Bozuko.client.game.Abstract.prototype.lang, {
            loading : {
                entry : 'Loading...',
                result : 'Spinning...'
            },
            instructions: 'Spin to Win!',
            creditsLabel: 'Credits',
            gameDetails: 'Game Details'
        }),
        
        constructor : function(){
            
            Bozuko.client.game.Slots.superclass.constructor.apply(this, arguments);
            
            this.addEvents({
                'spinstart'         :true,
                'spinstop'          :true
            });
            
            this.isIos = window.navigator.userAgent.match(/i(phone|pad|pod)/i);
            this.scale = this.width / this.baseWidth;
            this.useRetina = (this.isIos && window.devicePixelRatio > 1) || this.width > this.baseWidth;
            
            this.useTransitions = Modernizr.csstransitions;
            this.useTransforms = Modernizr.csstransforms;
            
            this.on('enter', this.onEnter, this);
            this.on('result', this.onResult, this);
            this.on('statechange', this.onStateChange, this);
            this.on('spinstart', this.onSpinStart, this );
            this.on('spinstop', this.onSpinStop, this );
            this.on('beforeresult', this.onBeforeResult, this);
            this.on('afterresult', this.onAfterResult, this);
            
            this.blinkingCounterOpts = {
                duration: .2
            };
            
            window.slots = this;
            this.spinning = false;
            
            this.init();
        },
        
        init : function(){
            var self = this
              , icons = this.game.config.icons
              , theme = this.game.config.theme
              
            this.icons = icons;
            
            if( this.game.config.theme && this.game.config.theme.options && this.game.config.theme.options.slotsFrame ){
                this.frame = this.game.config.theme.options.slotsFrame;
            }
            
            self.addImage( 'frame', this.frame );
            
            for( var i=0; i < icons.length; i++ ){
                self.addImage( icons[i], theme.base+'/'+theme.icons[icons[i]] );
            }
            
            // check for custom result images
            var animations = ['win','lose','freePlay','playAgain'];
            if( this.game.config.theme.options ) for(var i=0; i<animations.length; i++){
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
                html        :'<span class="center-middle-text">Spin</span>'
            });
            
            this.$spinButton.dom.onclick = this.onSpinButtonClick.createDelegate(this);
            
            this.$creditsCounter = this.$ct.createChild({
                cls         :'credits-counter',
                cn          :[{
                    cls         :'center-middle-text',
                    html        :this.game.game_state.user_tokens||"0"
                }]
            });
            
            this.$creditsLabel = this.$ct.createChild({
                cls         :'credits-label',
                cn          :[{
                    cls         :'center-middle-text',
                    html        :this.lang.creditsLabel
                }]
            });
            
            this.$infoLink = this.$ct.createChild({
                tag         :'div',
                cls         :'game-details-link',
                html        :this.lang.gameDetails
            });
            
            this.$infoLink.on('click', function(){
                if( !this.spinning && !this.noSpin ) this.showDescription();
            }, this);
            
            if( !this.game.config.theme.options.slotsHideLogo ) this.$pagePic = this.$ct.createChild({
                cls         :'page-pic',
                cn          :[{
                    tag         :'img',
                    src         :this.page.image
                }]
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
                
                var wheelScroll = this.wheelScrolls[i] = wheelCt.createChild({
                    cls         :'scroll'
                });
                
                // add the icons to the wheel...
                var icons = this.icons.slice();
                this.wheelOrders[i] = {};
                this.wheelIcons[i] = {};
                
                // get the width of the first icon
                var iconHeight = Math.min(this.image( this.icons[0] ).height, wheelScroll.getWidth());
                var cellHeight = iconHeight + this.iconPadding*2;
                
                
                this.wheelStrips[i] = [];
                var strip = this.wheelStrips[i][0] = wheelScroll.createChild({
                    cls         :'strip'
                });
                
                while( icons.length ){
                    var icon = icons.splice( Math.floor(Math.random()*icons.length), 1 )[0];
                    strip.createChild({
                        cls         :'icon-ct',
                        style       :{
                            padding     :this.iconPadding+'px 0',
                            'text-align':'center'
                        },
                        cn          :[{
                            style       :{
                                height      :iconHeight+'px'
                            },
                            tag         :'img',
                            src         :this.image(icon).src
                        }]
                    });
                    this.wheelOrders[i][icon] = icons.length;
                    this.wheelIcons[i][icons.length] = icon;
                }
                
                // add the one to the bottom
                wheelScroll.createChild({
                    cls         :'first-icon icon-ct',
                    style       :{
                        padding     :this.iconPadding+'px 0',
                        'text-align':'center'
                    },
                    cn          :[{
                        tag         :'img',
                        src         :this.image(this.wheelIcons[i][this.icons.length-1]).src,
                        style       :{
                            height      :iconHeight+'px'
                        }
                    }]
                });
                
                // add the one to the bottom
                wheelScroll.createChild({
                    cls         :'last-icon icon-ct',
                    style       :{
                        padding     :this.iconPadding+'px 0',
                        'text-align':'center'
                    },
                    cn          :[{
                        tag         :'img',
                        src         :this.image(this.wheelIcons[i][0]).src,
                        style       :{
                            height      :iconHeight+'px'
                        }
                    }]
                });
                
                this.wheelStrips[i][0] = strip;
                
                // how wide are the images?
                if( !this.iconHeight ) this.iconHeight = cellHeight;
                if( !this.stripHeight ) this.stripHeight = this.iconHeight * this.icons.length;
                if( !this.iconOffset ){
                    this.iconOffset = (this.iconHeight*3 - wheel.getHeight() ) / 2;
                }
                
                var y = this.iconOffset - self.iconHeight;
                
                this.useTransitions && this.useTransforms ?
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
            
            this.$animationsCt = this.$ct.createChild({
                cls         :'animations'
            });
            this.$animationsCt.setVisibilityMode( Ext.Element.DISPLAY );
            this.$animationsCt.hide();
            
            this.$animations = {};
            
            this._createAnimationDiv('lose');
            this._createAnimationDiv('playAgain');
            this._createAnimationDiv('freePlay', true);
            this._createAnimationDiv('win', true);
            
            this.reset();
            this.rendered = true;
            this.fireEvent('render', this);
            
            var self = this;
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
        
        updateCredits : function(credits){
            if( this._creditsWaitForSpinStop ) return;
            if( credits === undefined ) credits = this.state.user_tokens;
            var $el = this.$creditsCounter.child('.center-middle-text')
              , cur = $el.dom.innerHTML;
            if( cur != credits ){
                $el.update(credits ? credits : "0");
                // blink?
                var count = 0;
                var self = this;
                $el.stopFx();
                var blink = this.blinkingCounterOpts.callback = function(){
                    if( ++count > 11 ){
                        self.blinkingCounterOpts.callback = null;
                        if( !$el.isVisible() ) $el.show(self.blinkingCounterOpts);
                        return;
                    }
                    $el.toggle(self.blinkingCounterOpts);
                    
                };
                blink();
            }
        },
        
        spin : function( icons ){
            if( this.spinning ) return;
            this.spinning = true;
            this.fireEvent('spinstart', this);
            for( var i=0; i<icons.length; i++){
                
                var y = this.stripHeight * (this.stripNum-2) + this.iconHeight * this.wheelOrders[i][icons[i]] + this.iconOffset - this.iconHeight;
                var s = this.spinTime + ( this.spinStagger * i );
                
                var self = this
                  , stopped = 0
                  , onWheelStop = (function(i){
                        return function(){
                            
                            self.resetWheel(i, icons[i]);
                            if( self.useTransitions ){
                                self.wheelScrolls[i].dom.removeEventListener('transitionend', onWheelStop);
                                self.wheelScrolls[i].dom.removeEventListener('webkitTransitionEnd', onWheelStop);
                                self.wheelScrolls[i].dom.removeEventListener('OTransitionEnd', onWheelStop);
                            }
                            if( ++stopped == icons.length ){
                                // fire the stopped spinning event...
                                self.spinning = false;
                                self.fireEvent('spinstop');
                            }
                        }
                    })(i);
                
                if( this.useTransitions ){
                    
                    
                    this.wheelScrolls[i].addClass("scroll-transition");
                    this.wheelScrolls[i].dom.style[Modernizr.prefixed('transitionDuration')] = s+'s';
                    
                    this.wheelScrolls[i].dom.addEventListener('transitionend', onWheelStop, false);
                    this.wheelScrolls[i].dom.addEventListener('webkitTransitionEnd', onWheelStop, false);
                    this.wheelScrolls[i].dom.addEventListener('OTransitionEnd', onWheelStop, false);
                    
                    if( this.useTransforms ){
                        this.wheelScrolls[i].dom.style[Modernizr.prefixed('transform')] = 'translate3d(0, '+y+'px, 0)';
                    }
                    else{
                        this.wheelScrolls[i].dom.style.bottom = -y+'px';
                    }
                }
                else {
                    // animate...
                    this.wheelScrolls[i].animate({bottom: {to:-y}}, s, onWheelStop);
                }
            }
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
        
        resetIcons : function( icons ){
            for( var i=0; i<icons.length; i++){
                this.resetWheel( i, icons[i] );
            }
        },
        
        resetWheel : function( i, icon ){
            
            this.wheelScrolls[i].removeClass('scroll-transition');
            // remove the duration
            if( this.useTransitions ) this.wheelScrolls[i].dom.style[Modernizr.prefixed('transitionDuration')] = '0s';
            // calculate y
            var y = this.iconHeight * this.wheelOrders[i][icon] + this.iconOffset - this.iconHeight;
            if( this.useTransitions && this.useTransforms ){
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
        
        onStateChange : function(state){
            this.updateCredits( );
        },
        
        onEnter : function(entry){
            // TODO - display the number of tokens...
            this.app.hideModal();
            this.updateCredits();
        },
        
        onSpinButtonClick : function(){
            
            if( this.spinning || this.noSpin) return;
            if( this.state.user_tokens == 0 ){
                this.showDescription();
                return;
            }
            
            // decrement the token count
            this.updateCredits( this.state.user_tokens-1 );
            this._creditsWaitForSpinStop = true;
            
            this.result();
        },
        
        onSpinStart : function(){
            this.noSpin = true;
        },
        
        onSpinStop : function(){
            var self = this
              , cb = function(){
                self.noSpin = false;
            }
            this._creditsWaitForSpinStop = false;
            if( this.game_result.free_play ){
                this.updateCredits();
                this.showAnimation('freePlay', cb);
            }
            else if( this.game_result.win ){
                this.fireEvent('displaywin', this.game_result, this);
                this.showAnimation('win', function(){
                    this.onAfterWin();
                    cb();
                }, this);
            }
            else if( !this.state.user_tokens ){
                var self = this;
                this.showAnimation('lose', function(){
                    cb();
                    self.showDescription();
                });
            }
            else {
                cb();
            }
        },
        
        onBeforeResult : function(){
            this.noSpin = true;
        },
        
        onAfterResult : function(){
            this.noSpin = false;
        },
        
        onResult : function(result){
            this.loaded = true;
            var tokens = this.state.user_tokens+(result.free_play?0:1);
            this.spin( result.result );
            // TODO - update the spins left (tokens)
        },
        
        reset : function(){
            
        }
    });
})();
