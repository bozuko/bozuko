var Entry = Bozuko.require('core/contest/entry');

/**
 * Facebook Checkin
 *
 */
var FacebookCheckin = module.exports = function(key, user, options){
    options = options || {};
    Entry.prototype.constructor.call(this,key,user);
    // set the valid options
    if( !options.checkin ) throw Bozuko.error('entry/facebook/no_checkin');
    this.checkin = options.checkin;
};

FacebookCheckin.prototype.__proto__ = Entry.prototype;

var proto = FacebookCheckin.prototype;

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
    var self = this;
    Entry.prototype.validate.call( this, function(error){
        if( error ){
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
    Entry.prototype.process.call(this, function(error, entry){
        
        if( error ){
            return callback( error );
        }
        entry.action_id = self.checkin.id;
        return entry.save(function(error){
            return error || Bozuko.models.Entry.findById(entry.id,callback);
        });
    });
};