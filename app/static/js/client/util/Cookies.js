Ext.ns('Bozuko.client.util');
Bozuko.client.util.Cookies = (function(){
    
    var Cookies = function(){
        
    };
    
    function getCookieVal (offset){
        var endstr = document.cookie.indexOf(";", offset);
        if(endstr == -1){
            endstr = document.cookie.length;
        }
        return unescape(document.cookie.substring(offset, endstr));
    }
    
    Cookies.prototype = {
    
        set : function(name, value){
            var argv = arguments,
                argc = arguments.length,
                expires = (argc > 2) ? argv[2] : null,
                path = (argc > 3) ? argv[3] : '/',
                domain = (argc > 4) ? argv[4] : null,
                secure = (argc > 5) ? argv[5] : false;
                
            console.log(expires);
                
            document.cookie = name + "=" + escape(value) + ((expires === null) ? "" : ("; expires=" + expires.toGMTString())) + ((path === null) ? "" : ("; path=" + path)) + ((domain === null) ? "" : ("; domain=" + domain)) + ((secure === true) ? "; secure" : "");
        },
    
        get : function(name){
            var arg = name + "=",
                alen = arg.length,
                clen = document.cookie.length,
                i = 0,
                j = 0;
                
            while(i < clen){
                j = i + alen;
                if(document.cookie.substring(i, j) == arg){
                    return getCookieVal(j);
                }
                i = document.cookie.indexOf(" ", i) + 1;
                if(i === 0){
                    break;
                }
            }
            return null;
        },
    
        clear : function(name, path){
            if(this.get(name)){
                path = path || '/';
                document.cookie = name + '=' + '; expires=Thu, 01-Jan-70 00:00:01 GMT; path=' + path;
            }
        },
        
        each : function(){
            
        }
    };
    
    return new Cookies;
})();