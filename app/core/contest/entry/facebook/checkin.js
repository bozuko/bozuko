var EntryMethod = Bozuko.require('core/contest/entry');

/**
 * Facebook Checkin
 *
 */
var FacebookCheckinMethod = module.exports = function(key, user, options){
    options = options || {};
    EntryMethod.call(this,key,user);
    // set the valid options
    this.options = options;
    this.checkin = this.options.checkin || false;
};

FacebookCheckinMethod.prototype.__proto__ = EntryMethod.prototype;

var proto = FacebookCheckinMethod.prototype;

/**
 * Description of the entry type (eg, Facebook Checkin, Bozuko Checkin, Play from Anywhere)
 */
proto.name = 'Facebook Checkin';

/**
 * Description of the entry type (eg, Facebook Checkin, Bozuko Checkin, Play from Anywhere)
 */
proto.description = 'Checkin to a Facebook Page with Bozuko';

/**
 * Icon to display.
 *
 * TODO - decide if we need multiple types - mobile / admin, etc.
 */
proto.icon = '';

/**
 * Check to see if the configuration for this entry type is satisfied
 *
 * @param {Function} Callback Function
 */
proto.validate = function( callback ){
    
    // we need to check to see if this entry method has been satisified.
    var self = this;
    
    // first lets check for any previous entries in this contest
    EntryMethod.prototype.validate.call( this, function(error){
        if( error ){
            console.log("error from validate call");
            return callback( error );   
        }
        if( self.checkin.page_id+'' != self.contest.page_id+'' ){
            return callback( Bozuko.error('entry/facebook/invalid_checkin') );
        }
        /**
         * TODO
         *
         * we should also check to make sure that
         * its not too soon between checkins per contest
         */
        return callback( null );
    });
};

/**
 * Perform all necessary actions accociated with this entry method (eg, checkin, check for location, etc)
 *
 * The callback function accepts an error argument, true or false, and an method specific data argument (facebook checkin id)
 *
 * @param {Function} callback The callback function
 */
proto.process = function( callback ){

    // lets process this...
    var self = this;
    EntryMethod.prototype.process.call(this, function(error, entry){

        if( error ){
            return callback( error );
        }
        entry.action_id = self.checkin.id;
        return entry.save(function(error){
            if( error ) return callback( error );
            return callback(null, entry);
        });
    });
};