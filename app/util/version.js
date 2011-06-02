
function getValue(v){
    v = v.replace(/^0+/,'');
    var matches = v.match(/(\d+)?(([a-zA-Z]+)([\d+])?)?$/);
    v = parseInt(matches[1], 10);
    if( matches[2] ){
        var k = matches[3].substr(0,1);
        if( map[k] ){
            v+= map[k];
            if( matches[4] ){
                v+= parseInt(matches[4], 10) / 1000;
            }
        }
    }
    return v;
}

module.exports = {
    compare : function(v1, v2){
        v1 = v1.split('.');
        v2 = v2.split('.');
        
        if( v1.length != v2.length ){
            if( v1.length > v2.length ) for(var i=v2.length; i<v1.length; i++) v2.push('0');
            if( v2.length > v1.length ) for(var i=v1.length; i<v2.length; i++) v1.push('0');
        }
        
        var map = {
            'a':.3,
            'b':.2,
            'r':.1
        };
        
        var getValue = function(v){
            var matches = v.match(/(\d+)?(([a-zA-Z]+)([\d+])?)?$/);
            v = parseInt(matches[1], 10) * 10;
            if( matches[2] ){
                var k = matches[3].substr(0,1);
                if( map[k] ){
                    v -= map[k];
                    if( matches[4] ){
                        v -= parseInt(matches[4], 10) / 1000;
                    }
                }
            }
            return v;
        };
        
        for( var i=0; i<v1.length; i++){
            v1[i] = getValue(v1[i]);
            v2[i] = getValue(v2[i]);
            
            if( v1[i] > v2[i] ) return 1;
            if( v2[i] > v1[i] ) return -1;
        }
        return 0;
        
    }
};