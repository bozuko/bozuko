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
    
    
    var ids = 0;
    Ext.Element.prototype.update = function(html, loadScripts, callback) {
        var me = this,
            id,
            dom,
            interval;
    
        if (!me.dom) {
            return me;
        }
        html = html || '';
        dom = me.dom;
    
        if (loadScripts !== true) {
            dom.innerHTML = html;
            if( callback ) callback( me );
            return me;
        }
    
        id  = "ext-"+(ids++);
        html += '<span id="' + id + '"></span>';
    
        interval = setInterval(function(){
            if (!document.getElementById(id)) {
                return false;
            }
            clearInterval(interval);
            var DOC    = document,
                hd     = DOC.getElementsByTagName("head")[0],
                re     = /(?:<script([^>]*)?>)((\n|\r|.)*?)(?:<\/script>)/ig,
                srcRe  = /\ssrc=([\'\"])(.*?)\1/i,
                typeRe = /\stype=([\'\"])(.*?)\1/i,
                match,
                attrs,
                srcMatch,
                typeMatch,
                el,
                s;
    
            while ((match = re.exec(html))) {
                attrs = match[1];
                srcMatch = attrs ? attrs.match(srcRe) : false;
                if (srcMatch && srcMatch[2]) {
                   s = DOC.createElement("script");
                   s.src = srcMatch[2];
                   typeMatch = attrs.match(typeRe);
                   if (typeMatch && typeMatch[2]) {
                       s.type = typeMatch[2];
                   }
                   hd.appendChild(s);
                } else if (match[2] && match[2].length > 0) {
                    if (window.execScript) {
                       window.execScript(match[2]);
                    } else {
                       window.eval(match[2]);
                    }
                }
            }
    
            el = DOC.getElementById(id);
            if (el) {
                el.parentNode.removeChild(el);
            }
            if( callback ) callback( me );
        }, 20);
        dom.innerHTML = html.replace(/(?:<script.*?>)((\n|\r|.)*?)(?:<\/script>)/ig, '');
        return me;
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