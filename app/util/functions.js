var object = require('./object');

function indexOf(haystack, needle){
    var i=0, found = false;
    for(; i< haystack.length && !found; i++ ){
        found = JSON.stringify(haystack[i]) == JSON.stringify(needle);
    }
    return found ? Number(i) : -1;
}

function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

function filter(data){
    
    if( data && data.toJSON ) data = data.toJSON();
    
    if( Array.isArray(data)){
        var args = [];
        if( arguments.length > 1 ) args = [].slice.call(arguments,1);
        data.forEach(function(item, i){
            var ar = args.slice(0);
            ar.unshift(item);
            data[i] = filter.apply(this, ar);
        });
    }

    else if( data && 'object' === typeof data ){
        
        if( arguments.length > 1 && data){
            var tmp={};
            [].slice.call(arguments,1).forEach(function(field){
                tmp[field] = data[field];
            });
            data = tmp;
        }
        
        Object.keys(data).forEach(function(key){
            if( ~key.indexOf('.') ){
                delete data[key];
            }
            else{
                data[key] = filter(data[key]);
            }
        });
    }
    return data;
}

function map(ar, key){
    var _map = {};
    ar.forEach(function(item){
        _map[String(item[key])] = item;
    });
    return _map;
}

function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function httpsUrl(url){
    if( !url ) return url;
    if( url.match(/^http\:/) ){
        if( url.match(/^graph\.facebook\.com/) ){
            return url.replace(/^http\:/, 'https:');
        }
        if( url.match(/s3\.amazonaws\.com/) ){
            return url.replace(/^http\:/, 'https:');
        }
        // we should have some type of ssl redirector
    }
    return url;
}

exports.htmlEntities = htmlEntities;
exports.indexOf = indexOf;
exports.filter = filter;
exports.merge = object.merge;
exports.clone = object.clone;
exports.map = map;
exports.httpsUrl = httpsUrl;