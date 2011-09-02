var object = require('./object');

function indexOf(haystack, needle){
    var i=0, found = false;
    for(; i< haystack.length && !found; i++ ){
        found = JSON.stringify(haystack[i]) == JSON.stringify(needle);
    }
    return found ? i+0 : -1;
}


function filter(data){
    
    if( data && data.toJSON ) data = data.toJSON();

    if( arguments.length > 1 && data){
        var tmp={};
        [].slice.call(arguments,1).forEach(function(field){
            tmp[field] = data[field];
        });
        data = tmp;
    }

    if( Array.isArray(data)){
        data.forEach(function(item){filter(item);});
    }
    else if( data && 'object' === typeof data ){
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

exports.htmlEntities = htmlEntities;
exports.indexOf = indexOf;
exports.filter = filter;
exports.merge = object.merge;
exports.clone = object.clone;
exports.map = map;