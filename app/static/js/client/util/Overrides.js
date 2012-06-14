(function(){
    var setStyle = Ext.Element.prototype.setStyle;
    Ext.Element.prototype.setStyle = function(prop, value){
        try{
            return setStyle.apply( this, arguments );
        }
        catch(e){
            return this;
        }
    };
    
    var gv = Ext.Element.prototype.getValue;
    Ext.Element.prototype.getValue = function(){
        if(this.dom.tagName!='select'){
            return gv.apply(this, arguments);
        }
        var v = false;
        this.select('option').each(function(el){
            if(el.getAttribute('selected')){
                v = el.getValue();
                return false;
            }
            return true;
        });
        return v;
    };
    
    Ext.Element.prototype.setValue = function(v){
        if(this.dom.tagName!='select'){
            this.dom.value = v;
        }
        var o = this.child('option[value="'+v+'"]');
        if(o) o.dom.selected = true;
        return v;
    };
    
    Ext.iterate = function(obj, fn, scope){
        
        if(Ext.isEmpty(obj)){
            return;
        }
        if(Ext.isIterable(obj)){
            Ext.each(obj, fn, scope);
            return;
        }else if(Ext.isObject(obj)){
            for(var prop in obj){
                try{
                    if(!obj.hasOwnProperty || obj.hasOwnProperty(prop)){
                        if(fn.call(scope || obj, prop, obj[prop], obj) === false){
                            return;
                        };
                    }
                }catch(e){
                    
                }
            }
        }
        
    };
})();