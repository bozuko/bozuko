Ext.ns('Bozuko.client.util');

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
    
    var animations = [];
    
    var Animator = {
        
        add : function(animation){
            if( ~animations.indexOf(animation) ) return;
            var self = this;
            animations[animations.length] = animation;
            requestAnimationFrame( function(){
                self.run();
            });
        },
        
        run : function(){
            var self.run,
                _animations = [];
            Ext.each( animations, function(animation){
                if( animation.draw() !== false ){
                    _animations[_animations.length] = animation;
                }
            });
            animations = _animations;
            if( animations.length ) requestAnimationFrame(function(){
                self.run;
            });
        },
        
        
    };
    
    var Animation = Ext.extend( Ext.util.Observable, {
        
        easing : 'ease-in',
        
        constructor : function(config){
            Ext.apply(this, config||{});
            this._start = Date.now();
            Animation.superclass.constructor.call(this, config);
        },
        
        getStartTime : function(){
            return this._start;
        },
        
        draw : function(){
            
        },
        
        stop : function(){
            
        },
        
        pause : function(){
            
        },
        
        play : function(){
            
        }
        
    });
    
    Bozuko.client.util.Animator = Animator;
})();