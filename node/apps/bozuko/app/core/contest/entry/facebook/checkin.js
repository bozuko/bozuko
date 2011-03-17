var bozuko  = require('bozuko'),
    Entry   = bozuko.require('core/contest/entry')
    ;

/**
 * Facebook Checkin
 *
 */
var FacebookCheckin = module.exports = function(key, user, options){
    var options = options || {};
    Entry.prototype.constructor.call(this,key,user);
    // set the valid options
    if( !options.latLng ) throw new Error('LatLng is required to checkin with facebook');
    this.latLng = options.latLng;
    this.message = options.message || "";
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
    Entry.prototype.validate.call( function(error){
        if( error ){
            callback( error );
        }
        else{
            // anything else we need to do, for facebook reasons?
            // we should make sure that the contest has a facebook service
            bozuko.models.Page.findById(this.contest.page_id, function(error, page){
                if( error || !page) return callback( new Error("Invalid Page ["+this.contest.page_id+"]") );
                
                if( !page.service('facebook') ){
                    callback( new Error("Page does not have a Facebook Account") );
                }
                return callback( null );
            });
        }
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
    Entry.prototype.process.call(this, function(error){
        
        if( error ){
            return callback( error );
        }
        
        return bozuko.service('facebook').checkin({
            user        :self.user,
            message     :self.message,
            place_id    :self.service('facebook').id,
            // actions     :{name:'View on Bozuko', link:'http://bozuko.com'},
            link        :'http://bozuko.com',
            picture     :'http://bozuko.com/images/bozuko-chest-check.png',
            description :'Bozuko is a fun way to get deals at your favorite places. Just play a game for a chance to win big!',
            latLng      :{
                lat:self.latLng.lat,
                lng:self.latLng.lng
            }
        },
        
        function(error, result){
            // TODO: set the status code based on error
            if (error) {
                callback(error);
            } else {
                self.data = result;
                self.save(function(error){
                    callback(self);
                });
            }
        });
    });
};