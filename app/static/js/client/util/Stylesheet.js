Ext.ns('Bozuko.client.util');
(function(){
    var camelRe = /(-[a-z])/gi;
    var camelFn = function(m, a){ return a.charAt(1).toUpperCase(); };
    
    var Stylesheet = Ext.extend( Object, {
    
        constructor : function(id){
            this.cache = {};
            this.create(id);
            this.sheet = document.styleSheets[document.styleSheets.length-1];
            Stylesheet.superclass.constructor.call(this);
        },
        
        create : function(id) {
            var h = Ext.DomQuery.selectNode('head');
            return Ext.fly(h).createChild({
                tag:'style',
                type:'text/css',
                id: id,
                title: id
            });
            
        },
        
        rule : function(selector, css, value){
            if( undefined !== value ){
                var prop = css;
                css = {};
                css[prop] = value;
            }
            var rule = this.getRule(selector,true);
            for( var property in css){
                if( !css.hasOwnProperty(property)) continue;
                var val = css[property];
                if( val === false ){
                    delete rule.style[property.replace(camelRe,camelFn)];
                }
                else{
                    try{
                        rule.style[property.replace(camelRe,camelFn)] = val;
                    }catch(e){
                        // probably an unsupported rule;
                    }
                }
            }
        },
        
        getRule : function(selector, create){
            if( this.cache[selector] ) return this.cache[selector];
            if( create === false ) return false;
            var found = this.findRule(selector);
            if( found != null ){
                return this._rules()[found];
            }
            var rule;
            if( this.sheet.insertRule ){
                rule = this.sheet.insertRule(selector+' {}', this._rules().length);
            }
            else{
                rule = this._rules().length;
                this.sheet.addRule(selector, 'height: auto;');
                
            }
            this.cache[selector] = this._rules()[rule];
            return this.cache[selector];
        },
        
        _rules : function(){
            return this.sheet.cssRules || this.sheet.rules;
        },
        
        findRule : function(selector){
            // search rules
            var found = null;
            Ext.each( this._rules(), function(rule, i){
                if( rule.selectorText == selector ){
                    found = i;
                    return false;
                }
                return true;
            });
            return found;
        },
        
        deleteRule : function(selector){
            var rule;
            if( (rule = this.findRule(selector)) !== null ){
                this.sheet.deleteRule(rule);
                return true;
            }
            return false;
        }
        
    });
    
    Stylesheet.create = function(id){
        return new Stylesheet(id);
    };
    
    Bozuko.client.util.Stylesheet = Stylesheet;
})();
