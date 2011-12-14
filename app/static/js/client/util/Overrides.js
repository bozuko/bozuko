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