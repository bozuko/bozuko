var mongoose = require('mongoose'),
    Coords = require('./plugins/coords'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId
;

var Checkin = module.exports = new Schema({
    user_id                 :{type:ObjectId,    index: true},
    page_id                 :{type:ObjectId,    index: true},
    timestamp               :{type:Date,        index: true,    default: Date.now},
    description             :{type:String},
    message                 :{type:String},
    service                 :{type:String,      index: true},
    data                    :{}
});
Checkin.plugin(Coords);

Checkin.method('getPage', function(callback){
    Bozuko.models.Page.findById(this.page_id, callback);
});

Checkin.static('process', function(options, callback){
    if( !options.user ){
        return callback( Bozuko.error('checkin/no_user'));
    }
    if( !options.page ){
        return callback( Bozuko.error('checkin/no_page'));
    }
    if( options.service ){
        if( options.service != 'bozuko' ) options.place_id = String( options.page.service( options.service ).sid );
        else options.place_id = options.page._id;
        
        if( !options.ll || (options.ll[0] == 0 && options.ll[1] == 0) ){
            return callback( Bozuko.error('checkin/no_gps') );
        }

        Bozuko.service( options.service ).checkin( options, function(error, result){
            if( error ) return callback( error );
            // okay, good so far, let's create a checkin object
            var checkin = new Bozuko.models.Checkin();
            checkin.timestamp = new Date();

            checkin.set('user_id', options.user.id);
            checkin.set('page_id', options.page.id);
            checkin.coords = options.ll;
            checkin.set('description', options.description);
            checkin.set('message', options.message);
            checkin.set('service', options.service);
            checkin.set('data', result);

            return checkin.save( function(error){
                if( error ) return callback( error );
                return callback( null, checkin );
            });

        });
    }
    else{
        return callback( Bozuko.error('checkin/no_service') );
    }
});