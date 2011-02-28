var bozuko = require('bozuko');

var facebook = bozuko.require('util/facebook'),
    qs       = require('querystring');

var requestCount = 0;

var fakeGames = [{
    id : 'coinflip',
    icon : '/images/games/goldEagleHeads60x60.png',
    name : 'Flip a coin',
    prize : 'Free Buffalo Wings and Potato Skins!'
}];

exports.routes = {
    
    '/places/list' : {
        
        description : 'Get a list of places generated from facebook',
        
        get : function(req,res){
            var lat = req.param('lat') || '42.645625';
            var lng = req.param('lng') || '-71.307864';
            var c = lat+','+lng;
            
            bozuko.models.Page.search(c, req.param('limit') || 25, function(pages){
                res.send(pages);
            });
        }
    },
    
    '/place/:id/game' : {
        
        description :"Checkin and return the game result / code",
        
        get : function (req,res){
            
            // we should have the user from the session (middleware/session.js)
            if( !req.session.user ){
                // this should throw a non-authorized error
                res.send({success:false});
            }
            
            // get the session from the cookie...
            var place_id = req.params.id;
            var lat = req.param('lat');
            var lng = req.param('lng');
            
           
            // lets check them in...
            facebook.graph('/'+place_id, function(p){
            //bozuko.models.Place.find({facebook_id:place_id}).one(function(p){
            
                facebook.graph('/me/checkins',{
                    user:   req.session.user,
                    params:{
                        'message':'Just won a free something playing Bozuko!',
                        'place':place_id,
                        'coordinates':JSON.stringify(p.location)
                    },
                    method:'post'
                },function(result){
                    // lets get the game requested
                    var ret = bozuko.games.dice.run();
                    res.send({success:true, result: ret});
                });
            
            });
            
        }
    },
    
    '/place/:id' : {
        
        description :'Return place details',
        
        get :function(req,res){
            facebook.graph('/'+req.param('id'), {
                user: req.session.user
            },function(place){
                place.games = fakeGames;
                res.send(place);
            });
        }
    }
};