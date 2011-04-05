var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var Checkin = module.exports = new Schema({
    user_id                 :{type:ObjectId},
    page_id                 :{type:ObjectId},
    timestamp               :{type:Date, default: Date.now},
    coords                  :{
        lat                 :Number,
        lng                 :Number
    },
    description             :{type:String},
    message                 :{type:String},
    service                 :{type:String},
    data                    :{}
});

Checkin.index({coords:'2d'});

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
        options.place_id = options.page.service( options.service ).sid+'';
        
        Bozuko.service( options.service ).checkin( options, function(error, result){
            if( error ) return callback( error );
            
            // okay, good so far, let's create a checkin object
            var checkin = new Bozuko.models.Checkin();
            checkin.timestamp = new Date();
            
            checkin.set('user_id', options.user.id);
            checkin.set('page_id', options.page.id);
            checkin.set('coords.lat',options.latLng.lat);
            checkin.set('coords.lng',options.latLng.lng);
            checkin.set('description', options.description);
            checkin.set('message', options.message);
            checkin.set('service', options.service);
            checkin.set('data', result);
            
            return checkin.save( function(error){
                if( error ) return callback( error );
                // safely returnable object
                return Bozuko.models.Checkin.findById( checkin.id, callback );
            });
            
        });
    }
    else{
        console.log('no service');
    }
});