var object = require('./object');

function indexOf(haystack, needle){
    var i=0, found = false;
    for(; i< haystack.length && !found; i++ ){
        found = JSON.stringify(haystack[i]) == JSON.stringify(needle);
    }
    return found ? i+0 : -1;
}


function filter(_data){
    
    var ret, data;
    
    if( _data && _data.toJSON ) data = _data.toJSON();

    if( arguments.length > 1 && _data){
        var tmp={};
        [].slice.call(arguments,1).forEach(function(field){
            tmp[field] = data[field];
        });
        data = tmp;
    }

    if( Array.isArray(_data)){
        data = [];
        _data.forEach(function(item){
            data.push(filter(item));
        });
    }
    else if( _data && 'object' === typeof _data ){
        data = {};
        Object.keys(_data).forEach(function(key){
            if( ~key.indexOf('.') ){
                return;
            }
            else{
                data[key] = filter(_data[key]);
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