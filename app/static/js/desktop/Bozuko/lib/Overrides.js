Ext.define('Bozuko.lib.Overrides', {
    
    constructor : function(){
        
        Ext.Ajax.timeout = 1000 * 60 * 20;
        
        Ext.data.Connection.override({
            getXhrInstance : (function(){
                var options = [function(){
                    return new ActiveXObject('MSXML2.XMLHTTP.3.0');
                }, function(){
                    return new XMLHttpRequest();
                }, function(){
                    return new ActiveXObject('MSXML2.XMLHTTP');
                }, function(){
                    return new ActiveXObject('Microsoft.XMLHTTP');
                }], i = 0,
                    len = options.length,
                    xhr;
        
                for(; i < len; ++i) {
                    try{
                        xhr = options[i];
                        xhr();
                        break;
                    }catch(e){}
                }
                return xhr;
            })()
        });
        
        var VISIBILITY      = "visibility",
            DISPLAY         = "display",
            HIDDEN          = "hidden",
            NONE            = "none",
            XMASKED         = Ext.baseCSSPrefix + "masked",
            XMASKEDRELATIVE = Ext.baseCSSPrefix + "masked-relative",
            data            = Ext.core.Element.data;
                        
            
        Ext.core.Element.prototype.mask = function(msg, msgCls) {
            var me  = this,
                dom = me.dom,
                setExpression = dom.style.setExpression,
                dh  = Ext.core.DomHelper,
                EXTELMASKMSG = Ext.baseCSSPrefix + "mask-msg",
                el,
                mask;

            if (!(/^body/i.test(dom.tagName) && me.getStyle('position') == 'static')) {
                me.addCls(XMASKEDRELATIVE);
            }
            el = data(dom, 'maskMsg');
            if (el) {
                el.remove();
            }
            el = data(dom, 'mask');
            if (el) {
                el.remove();
            }

            mask = dh.append(dom, {cls : Ext.baseCSSPrefix + "mask"}, true);
            data(dom, 'mask', mask);

            me.addCls(XMASKED);
            mask.setDisplayed(true);

            if (typeof msg == 'string') {
                var mm = dh.append(dom, {cls : EXTELMASKMSG, cn:{tag:'div'}}, true);
                data(dom, 'maskMsg', mm);
                mm.dom.className = msgCls ? EXTELMASKMSG + " " + msgCls : EXTELMASKMSG;
                mm.dom.firstChild.innerHTML = msg;
                mm.setDisplayed(true);
                mm.center(me);
            }
            
            if (!Ext.supports.IncludePaddingInWidthCalculation && Ext.isFunction(setExpression) ) {
                mask.dom.style.setExpression('width', 'this.parentNode.offsetWidth + "px"');
            }

            if (!Ext.supports.IncludePaddingInHeightCalculation && Ext.isFunction(setExpression)) {
                mask.dom.style.setExpression('height', 'this.parentNode.offsetHeight + "px"');
            }
            
            else if (Ext.isIE && !(Ext.isIE7 && Ext.isStrict) && me.getStyle('height') == 'auto') {
                mask.setSize(undefined, me.getHeight());
            }
            return mask;
        };
        
        Ext.override(Ext.selection.RowModel, {
            onLastFocusChanged: function(oldFocused, newFocused, supressFocus) {
                if (this.views && this.views.length) {
                    this.callOverridden(arguments);
                }
            },
            onSelectChange: function(record, isSelected, suppressEvent, commitFn) {
                if (this.views && this.views.length) {
                    this.callOverridden(arguments);
                }
            }
        });
        
        Ext.override(Ext.grid.plugin.Editing, {
            constructor: function(config) {
                var me = this;
                Ext.apply(me, config);
        
                me.addEvents(
                    // Doc'ed in separate editing plugins
                    'beforeedit',
        
                    // Doc'ed in separate editing plugins
                    'edit',
        
                    // Doc'ed in separate editing plugins
                    'validateedit',
                    
                    'canceledit'
                );
                me.mixins.observable.constructor.call(me);
                // TODO: Deprecated, remove in 5.0
                me.relayEvents(me, ['afteredit'], 'after');
            },
        
            // private
            init: function(grid) {
                var me = this;
        
                me.grid = grid;
                me.view = grid.view;
                me.initEvents();
                me.mon(grid, 'reconfigure', me.onReconfigure, me);
                me.onReconfigure();
        
                grid.relayEvents(me, ['beforeedit', 'edit', 'validateedit', 'canceledit']);
                // Marks the grid as editable, so that the SelectionModel
                // can make appropriate decisions during navigation
                grid.isEditable = true;
                grid.editingPlugin = grid.view.editingPlugin = me;
            },

        });
        
    }
}, function(){
    new Bozuko.lib.Overrides();
});