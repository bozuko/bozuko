/**
 * Abstract class for method of entry
 *
 * Defines what all Entry Methods must have for variables / methods
 * 
 */
var Entry = method.exports = function(){
    
};

var proto = Entry.prototype;{

/**
 * Description of the entry type (eg, Facebook Checkin, Bozuko Checkin, Play from Anywhere)
 */
proto.name = 'Default';

/**
 * Icon to display.
 *
 * TODO - decide if we need multiple types - mobile / admin, etc.
 */
proto.icon = 'Default';
    
/**
 * Perform all necessary actions accociated with this entry method (eg, checkin, check for location, etc)
 *
 * The callback function accepts an error argument, true or false, and an method specific data argument (facebook checkin id)
 *
 * @param {Function} callback The callback function
 */
proto.process = function( callback ){
    
};