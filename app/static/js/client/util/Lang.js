if( !window.Bozuko ) window.Bozuko = {};

jQuery.extend( Bozuko, {
    ns : function(str){
        var cur = window,
            parts = str.split('.');
            
        for( var i=0; i<parts.length; i++ ){
            var part = parts[i];
            if( !cur[part] ) cur[part] = {};
            cur = cur[part];
        }
        return cur;
    }
});
