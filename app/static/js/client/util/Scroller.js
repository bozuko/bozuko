Ext.ns('Bozuko.client.util');

(function(){

var _scrollbarSize;
function getScrollbarSize(){
    if( !_scrollbarSize ){
        var tmp = Ext.get(document.body).createChild({
            style       :'top:-200px; left: -200px; width: 50px; height: 50px; overflow: hidden; position: absolute;',
            cn:[{
                tag         :'div',
                style       :'height: 100px'
            }]
        });
        
        // get the initial size...
        var dom = tmp.child('div').dom;
        var s1 = tmp.child('div').getWidth();
        tmp.setStyle('overflow-y', 'scroll');
        dom.innerHTML = '.';
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
    
    constructor : function(el, config){
        
        Ext.apply( this, config );
        this.$el = Ext.get(el);
        SuperScroll.superclass.constructor.call(this);
        this.init();
    },
    
    init : function(){
        
        
        this.$scroller = this.$el.child('.scrollable');
        if( !this.$scroller ) return;
        
        this.updateSize();
        this.$el.addClass('superscroll');
        
        this.$el.on('touchstart', this.onTouchStart, this);
        this.$el.on('touchmove', this.onTouchMove, this);
        this.$el.on('touchend', this.onTouchEnd, this);
        
        // create scrollbars
        this.$scrollbars = {};
        if( this.horizontal !== false && this.$scroller.dom.scrollWidth > this.$el.getWidth() ){
            // create the horizontal scroller.
            this.horizontal = new Scrollbar.Horizontal(this);
        }
        if( this.vertical !== false && this.$scroller.dom.scrollHeight > this.$el.getHeight() ){
            // create vertical scroller
            this.vertical = new Scrollbar.Vertical(this);
        }
        
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
        
        this.$scroller.setStyle({
            width: (this.$el.getWidth() -this.$scroller.getPadding('lr') + size )+'px',
            height: (this.$el.getHeight() -this.$scroller.getPadding('tb') + size)+'px'
        });
        
        this.$el.addClass('superscroll');
    },
    
    update : function(){
        this.updateSize();
        if( this.vertical ) this.vertical.update();
        if( this.horizontal ) this.horizontal.update();
    },
    
    showScrollbars : function(){
        if( this.vertical ) this.vertical.show();
        if( this.horizontal ) this.horizontal.show();
    },
    
    hideScrollbars : function(){
        if( this.vertical ) this.vertical.hide();
        if( this.horizontal ) this.horizontal.hide();
    },
    
    onTouchStart : function(ev){
        ev.preventDefault();
        var touches = getTouches(ev),
            touch = touches[0];
            
        this.startPosition = [touch.pageX, touch.pageY];
        this.startScroll = [this.$scroller.dom.scrollLeft, this.$scroller.dom.scrollTop];
        this.showScrollbars();
    },
    
    onTouchMove : function(ev){
        ev.preventDefault();
        var touches = getTouches(ev),
            touch = touches[0],
            pos = [touch.pageX, touch.pageY];
            
        if( this.vertical !== false )
            this.$scroller.dom.scrollTop =  Math.max(0, Math.min( this.$scroller.dom.scrollHeight, this.startScroll[1] + this.startPosition[1]-pos[1] ));
        if( this.horizontal !== false )
            this.$scroller.dom.scrollLeft = Math.max(0, Math.min( this.$scroller.dom.scrollWidth, this.startScroll[0] +this.startPosition[0]-pos[0] ));
    },
    
    onTouchEnd : function(ev){
        ev.preventDefault();
        var touches = getTouches(ev),
            touch = touches[0],
            pos = [touch.pageX, touch.pageY];
            
        if( this.vertical !== false )
            this.$scroller.dom.scrollTop =  Math.max(0, Math.min( this.$scroller.dom.scrollHeight, this.startScroll[1] + this.startPosition[1]-pos[1] ));
        if( this.horizontal !== false )
            this.$scroller.dom.scrollLeft = Math.max(0, Math.min( this.$scroller.dom.scrollWidth, this.startScroll[0] +this.startPosition[0]-pos[0] ));
        
        this.hideScrollbars();
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
        
        this.update();
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
            scroller = this.panel.$scroller;
        
        var styles = {};
        
        styles[this.dimension] = (trackLength * panelLength / scroller.dom['scroll'+capDim]) +'px';
        styles[this.position] = (trackLength * scroller.dom['scroll'+capPos] / scroller.dom['scroll'+capDim])+'px';
        
        this.el.setStyle(styles);
    },
    
    show : function(){
        if( !this.shown ){
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