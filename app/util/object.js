
var class2type = {}, toString = Object.prototype.toString;
"Boolean Number String Function Array Date RegExp Object".split(" ").forEach( function(name, i) {
	class2type[ "[object " + name + "]" ] = name.toLowerCase();
});

function getType(o){
    return class2type[toString.call(o)] || 'object';
}

function merge(a,b,ignore){
    if( getType(a) != 'object' || getType(b) != 'object') return a;
    if( !b ) return a;
    Object.keys(b).forEach(function (key){
        if( !b.hasOwnProperty(key) ){
            return;
        }
        
        // get the types
        var a_type = getType(a[key]),
            b_type = getType(b[key]),
            value = b[key]
            ;
        
        if( b_type === 'array' ) value = value.slice(0);
        
        if( a[key] === undefined ){
            a[key] = value;
            return;
        }
        
        if( a_type !== b_type || b_type !== 'object'){
            a[key] = value;
            return;
        }
        
        if( ignore && ~ignore.indexOf(key) ) return;
        
        merge(a[key], value);
    });
    
    return a;
}

/**
 * Copied from https://gist.github.com/870495
 */
function clone(item){
	if (item === null || item === undefined) {
		return item;
	}

	var type = toString.call(item);

	// Date
	if (type === '[object Date]') {
		return new Date(item.getTime());
	}

	var i, j, k, _clone, key;

	// Array
	if (type === '[object Array]') {
		i = item.length;

		_clone = [];

		while (i--) {
			_clone[i] = clone(item[i]);
		}
	}
	// Object
	else if (type === '[object Object]' && item.constructor === Object) {
		clone = {};

		for (key in item) {
			_clone[key] = clone(item[key]);
		}
	}

	return clone || item;
}

exports.merge = merge;
exports.clone = clone;