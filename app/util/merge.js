/**
 * Copied from https://gist.github.com/870495
 */

var util = exports || {};

function merge(source, key, value){
	if (typeof key === 'string') {
		if (value && value.constructor === Object) {
			if (source[key] && source[key].constructor === Object) {
				merge(source[key], value);
			}
			else {
				source[key] = clone(value);
			}
		}
		else {
			source[key] = value;
		}

		return source;
	}

	var i = 1,
		ln = arguments.length,
		object, property;

	for (; i < ln; i++) {
		object = arguments[i];

		for (property in object) {
			if (object.hasOwnProperty(property)) {
				merge(source, property, object[property]);
			}
		}
	}

	return source;
}

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