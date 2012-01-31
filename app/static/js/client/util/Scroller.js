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

var cancelRequestAnimationFrame = (function () {
    return window.cancelRequestAnimationFrame
        || window.webkitCancelRequestAnimationFrame
        || window.mozCancelRequestAnimationFrame
        || window.oCancelRequestAnimationFrame
        || window.msCancelRequestAnimationFrame
        || clearTimeout
})();


var _scrollbarSize,
    isTouch = window.navigator.userAgent.match(/(android|i(phone|pad|pod))/i) &&
              'ontouchstart' in window,
    
    vendor = (/webkit/i).test(navigator.appVersion) ? 'webkit' :
		(/firefox/i).test(navigator.userAgent) ? 'Moz' :
		'opera' in window ? 'O' : '',
        
    has3d = 'WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix(),
    
    trnOpen = 'translate' + (has3d ? '3d(' : '('),
	trnClose = has3d ? ',0)' : ')'
    ;

function getScrollbarSize(){
    if( !_scrollbarSize ){
		var tmp = Ext.get(document.body).createChild({
			style		:'position: absolute; top:-200px; left: -200px; width: 50px; height: 50px; overflow: hidden;',
			cn			:[{
				tag         :'div',
				style       :'height: 100px'
			}]
        });
        
        // get the initial size...
        var dom = tmp.child('div').dom;
		dom.innerHTML = '.';
        var s1 = tmp.child('div').getWidth();
		tmp.setStyle('overflow-y', 'scroll');
        var s2 = tmp.child('div').getWidth();
        _scrollbarSize = s1-s2;
        tmp.remove();
    }
    return _scrollbarSize;
}

function getTouches(e){
    
    if( e.browserEvent && e.type)
    
    if (e.browserEvent) {
        if (e.browserEvent.touches && e.browserEvent.touches.length) {
            return e.browserEvent.touches;
        } else if (e.browserEvent.changedTouches && e.browserEvent.changedTouches.length) {
            return e.browserEvent.changedTouches;
        }
    }
    return e.touches;
}

var SuperScroll = Ext.extend( Ext.util.Observable, {
    
    padding : 2,
    x:0,
    y:0,
    
    constructor : function(el, config){
        
        Ext.apply( this, config );
        this.$el = Ext.get(el);
        SuperScroll.superclass.constructor.call(this);
        this.init();
    },
    
    init : function(){
        var self = this;
        
        this.$scroller = this.$el.child('.scrollable');
        if( !this.$scroller ) return;
        
        this.updateSize();
        this.$el.addClass('superscroll');
        
        // create scrollbars
        this.$scrollbars = {};
        if( this.horizontal !== false ){
            // create the horizontal scroller.
            this.horizontal = new Scrollbar.Horizontal(this);
        }
        if( this.vertical !== false ){
            // create vertical scroller
            this.vertical = new Scrollbar.Vertical(this);
        }
        
        if( isTouch ){
            
            this.$scroller.dom.style[vendor + 'TransitionProperty'] = '-' + vendor.toLowerCase() + '-transform';
    		this.$scroller.dom.style[vendor + 'TransitionDuration'] = '0';
            this.$scroller.dom.style[vendor + 'TransformOrigin'] = '0 0';
            this.$scroller.dom.style[vendor + 'TransitionTimingFunction'] = 'cubic-bezier(0.33,0.66,0.66,1)';
            this.$scroller.dom.style[vendor + 'Transform'] = trnOpen + '0px,0px' + trnClose;
            
            this.$scroller.on('touchstart', this.onTouchStart, this);
        }
        
    },
    
    getScroll : function(pos){
        return pos=='left' ? this.x : this.y;
    },
    
    updateSize : function(){
        
        var size = getScrollbarSize();
        
        
        this.$el.removeClass('superscroll');
        this.$el.setStyle('height', 'auto');
        this.$scroller.setStyle({
            width: '',
            height: ''
        });
        
        if( this.fixSize ) this.fixSize();
        
        if( isTouch ){
            return;
        }
        
        this.$scroller.setStyle({
            width: (this.$el.getWidth() -this.$scroller.getPadding('lr') + size )+'px',
            height: (this.$el.getHeight() -this.$scroller.getPadding('tb') + size)+'px'
        });
        
        this.$el.addClass('superscroll');
    },
    
    update : function(noSize){
        if( !noSize ) this.updateSize();
        if( this.vertical ) this.vertical.update();
        if( this.horizontal ) this.horizontal.update();
    },
    
    translate : function(){
        this.$scroller.dom.style[vendor + 'Transform'] = trnOpen + (-this.x) + 'px,' + (-this.y) + 'px' + trnClose;
        this.update(true);
        this.deferHideScrollbars();
    },
    
    showScrollbars : function(){
        if( this.vertical ) this.vertical.show();
        if( this.horizontal ) this.horizontal.show();
    },
    
    hideScrollbars : function(){
        if( this.vertical ) this.vertical.hide();
        if( this.horizontal ) this.horizontal.hide();
    },
    
    deferHideScrollbars : function(){
        if( this.vertical ) this.vertical.deferHide();
        if( this.horizontal ) this.horizontal.deferHide();
    },
    
    onTouchStart : function(ev){
        // if( ev.getTarget('input,textarea,button,a,label') ) return;
        
        if( this.animating ){
            cancelRequestAnimationFrame(this.animateTimeout);
            this.animating = false;
        }
        var touches = getTouches(ev),
            touch = touches[0];
        
        this.startPosition = [touch.pageX, touch.pageY];
        this.startScroll = [this.x, this.y];
        this.showScrollbars();
        this.$scroller.on('touchmove', this.onTouchMove, this);
        this.$scroller.on('touchend', this.onTouchEnd, this);
    },
    
    onTouchMove : function(ev){
        ev.preventDefault();
        var touches = getTouches(ev),
            touch = touches[0],
            scrollable = [
                this.$scroller.dom.scrollWidth - this.$el.getWidth(),
                this.$scroller.dom.scrollHeight - this.$el.getHeight()
            ],
            pos = [touch.pageX, touch.pageY];
            
        if( this.vertical !== false )
            this.y = Math.max(0, Math.min( scrollable[1], this.y +this.startPosition[1]-pos[1] ));
        if( this.horizontal !== false )
            this.x = Math.max(0, Math.min( scrollable[0], this.x +this.startPosition[0]-pos[0] ));
        
        this.lastPosition = this.startPosition;
        this.startPosition = pos;
        this.lastTouch = Date.now();
        this.translate();
    },
    
    onTouchEnd : function(ev){
        ev.preventDefault();
        var touches = getTouches(ev),
            touch = touches[0],
            now = Date.now(),
            scrollable = [
                this.$scroller.dom.scrollWidth - this.$el.getWidth(),
                this.$scroller.dom.scrollHeight - this.$el.getHeight()
            ],
            pos = [touch.pageX, touch.pageY];
        
        if( this.lastTouch && now - this.lastTouch < 200 ){
            // momentum...
            var x=0,y=0;
            if( this.vertical !== false ){
                y = Math.max(0, Math.min( scrollable[1], this.y +this.startPosition[1]-pos[1] ));
            }
            if( this.horizontal !== false ){
                x = Math.max(0, Math.min( scrollable[0], this.x +this.startPosition[0]-pos[0] ));
            }
            
            
            // lets get the speed
            var delta = [pos[0]-this.lastPosition[0],pos[1]-this.lastPosition[1]],
                momentum = [
                    this.momentum(delta[0], now-this.lastTouch, scrollable[0]),
                    this.momentum(delta[1], now-this.lastTouch, scrollable[1])
                ];
            
            this.animate(momentum);
        }
        
        this.deferHideScrollbars();
        
        this.$scroller.un('touchmove', this.onTouchMove, this);
        this.$scroller.un('touchend', this.onTouchEnd, this);
    },
    
    momentum : function(dist, time, size){
        var deceleration = 0.0006,
            speed = Math.abs(dist) / time,
            newDist = (speed * speed) / (2 * deceleration),
            newDist = newDist * (dist < 0 ? -1 : 1);
            newTime = speed / deceleration
            ;
        return {dist: newDist, time: Math.round(newTime)};
    },
    
    animate : function(momentum){
        var start = Date.now(),
            self = this,
            scrollable = [
                this.$scroller.dom.scrollWidth - this.$el.getWidth(),
                this.$scroller.dom.scrollHeight - this.$el.getHeight()
            ],
            origin = [Number(this.x), Number(this.y)];
            
        var frame = function(){
            
            if( !self.animating ){
                cancelRequestAnimationFrame(self.animateTimeout);
                return;
            }
            
            var duration = Date.now()-start,
                stop = true;
            
            if( self.horizontal && duration < momentum[0].time ){
                var x = Math.max(0, Math.min( scrollable[0], origin[0] - ease(duration, 0, momentum[0].dist, momentum[0].time)));
                if( x != self.x ) stop = false;
                self.x = x;
            }
            if( self.vertical && duration < momentum[1].time ){
                var y = Math.max(0, Math.min( scrollable[1], origin[1] - ease(duration, 0, momentum[1].dist, momentum[1].time)));
                if( y != self.y ) stop = false;
                self.y = y;
            }
            
            
            self.translate();
            
            if( !stop ){
                self.animateTimeout = requestAnimationFrame(frame);
            }
            else{
                self.animating = false;
            }
        };
        
        var ease = function(t, b, c, d) {
            return -c * (t /= d) * (t - 2) + b;
            return d/n*total;
        }
        
        if( true || navigator.userAgent.match(/i(phone|pad|pod)/i) ){
            // smooth
            this.animating = true;
            this.animateTimeout = requestAnimationFrame(frame);
        }
        // else lets try to use a webkit transition instead
        else {
            // not smooth
            var time = Math.max( momentum[0].time, momentum[1].time );
            this.$scroller.dom.style[vendor + 'TransitionDuration'] = time+'ms';
            this.x = Math.max(0, Math.min( scrollable[0], origin[0] - momentum[0].dist));
            this.y = Math.max(0, Math.min( scrollable[1], origin[1] - momentum[1].dist));
            this.translate();
        }
    }
});

var Scrollbar = Ext.extend( Object, {
    
    constructor : function(panel, config){
        Ext.apply(this, config);
        this.panel = panel;
        
        this.dragging = false;
        this.enter = false;
        this.shown = false;
        
        // mouse events
        this.panel.$el.on('mouseenter', this.onMouseEnter, this);
        this.panel.$el.on('mouseleave', this.onMouseLeave, this);
        
        this.el.on('mousedown', this.onMouseDown, this);
        if( isTouch ){
            this.el.dom.style[vendor + 'TransitionProperty'] = '-' + vendor.toLowerCase() + '-transform';
            this.el.dom.style[vendor + 'TransitionDuration'] = '0';
            this.el.dom.style[vendor + 'TransformOrigin'] = '0 0';
            this.el.dom.style[vendor + 'TransitionTimingFunction'] = 'cubic-bezier(0.33,0.66,0.66,1)';
        }
        
        this.panel.$scroller.on('scroll', this.onScroll, this);
    },
    
    onMouseEnter : function(){
        this.enter = true;
        this.show();
    },
    
    onMouseLeave : function(){
        this.enter = false;
        if( !this.dragging ) this.hide();
    },
    
    onMouseDown : function(ev){
        ev.preventDefault();
        
        this.dragging = true;
        
        this.startPageY = ev.getPageY() - this.el.getTop(true);
        this.startPageX = ev.getPageX() - this.el.getLeft(true);
        
        document.onselectstart = function(){ return false; }
        
        var doc = Ext.get(document), me = this;
        doc.on('mousemove', me.onMouseMove, me);
        doc.on('mouseup', function(){
            me.dragging = false;
            document.onselectstart = null;
            
            doc.un('mousemove', me.onMouseMove, me);
            
            if( !me.enter ){
                me.hide();
            }
        });
        
    },
    
    onMouseMove : function(ev){
        
        var capDim = this.capitalize(this.dimension),
            capPos = this.capitalize(this.position),
            axis = this.position == 'top' ? 'Y' : 'X',
            getFn = 'get'+capDim,
            panelLength = this.panel.$el[getFn](),
            trackLength = panelLength - this.panel.padding * 2,
            pos = ev['getPage'+axis]() - this['startPage'+axis],
            barLength = this.el[getFn](),
            scroller = this.panel.$scroller;
            
        var coord = Math.min(Math.max(pos,0), trackLength - barLength);
        scroller.dom['scroll'+capPos] = (scroller.dom['scroll'+capDim] - panelLength) * coord / (trackLength - barLength);
    },
    
    onScroll : function(){
        if( !this.shown ){
            this.show();
            if( !this.enter && !this.dragging ){
                this.hiding = this.hide.defer(1500, this);
            }
        }
        
        this.panel.x = this.panel.$scroller.dom.scrollLeft;
        this.panel.y = this.panel.$scroller.dom.scrollTop;
        
        this.update();
    },
    
    deferHide : function(){
        if( this.hiding ) clearTimeout(this.hiding);
        this.hiding = this.hide.defer(1500, this);
    },
    
    capitalize : function(str){
        return str.substr(0,1).toUpperCase() + str.substr(1);
    },
    
    update : function(){
        var capDim = this.capitalize(this.dimension),
            capPos = this.capitalize(this.position),
            getFn = 'get'+capDim,
            panelLength = this.panel.$el[getFn](),
            trackLength= panelLength - this.panel.padding * 2,
            scroller = this.panel.$scroller,
            scrollSize = scroller.dom['scroll'+capDim],
            scrolled = this.panel.getScroll(this.position);
            
        var styles = {};
        
        if( isTouch ){
            var size = this.el[getFn](),
                newSize = (trackLength * panelLength / scrollSize);
            
            if( size != newSize ) styles[this.dimension] = newSize+'px';
            if( this.position == 'left' ){
                styles[vendor + 'Transform'] = trnOpen + (trackLength * scrolled / scrollSize) + 'px,' + (-this.y) + 'px' + trnClose;
            }
            else{
                styles[vendor + 'Transform'] = trnOpen + '0px,' + (trackLength * scrolled / scrollSize) + 'px' + trnClose;
            }
            
        }
        else{
            styles[this.dimension] = (trackLength * panelLength / scrollSize) +'px';
            styles[this.position] = (trackLength * scrolled / scrollSize)+'px';
        }
        
        this.el.setStyle(styles);
    },
    
    show : function(){
        if( !this.shown ){
            var capDim = this.capitalize(this.dimension),
                getFn = 'get'+capDim;
                
            // do we need to show this?
            if( this.panel.$scroller.dom['scroll'+capDim] <= this.panel.$el[getFn]() ) return;
            
            this.update();
            this.el.addClass('superscroll-bar-shown');
            if( this.hiding ){
                clearTimeout( this.hiding );
                this.hiding = null;
            }
            this.shown = true;
        }
    },
    
    hide : function(){
        if( this.shown ){
            this.el.removeClass('superscroll-bar-shown');
            this.shown = false;
        }
    }
    
});

Scrollbar.Horizontal = Ext.extend( Scrollbar, {
    
    dimension       :'width',
    position        :'left',
    
    constructor : function(panel){
        this.el = panel.$el.createChild({
            cls         :'superscroll-bar superscroll-bar-horizontal'
        });
        Scrollbar.Horizontal.superclass.constructor.apply(this, arguments);
    }
    
});

Scrollbar.Vertical = Ext.extend( Scrollbar, {
    
    dimension       :'height',
    position        :'top',
    
    constructor : function(panel){
        this.el = panel.$el.createChild({
            cls         :'superscroll-bar superscroll-bar-vertical'
        });
        Scrollbar.Horizontal.superclass.constructor.apply(this, arguments);
    }
    
});

Ext.Element.prototype.superScroll = function(config){
    if( this._superScroll ) return this._superScroll;
    this._superScroll = new Bozuko.client.util.SuperScroll(this, config);
    return this._superScroll;
};

Bozuko.client.util.SuperScroll = SuperScroll;
Bozuko.client.util.SuperScroll.Scrollbar = Scrollbar;

})();