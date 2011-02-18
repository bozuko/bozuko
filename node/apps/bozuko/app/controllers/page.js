var facebook = Bozuko.require('util/facebook'),
    qs       = require('querystring');

var requestCount = 0;

var fakeGames = [{
    id : 'coinflip',
    icon : '/images/games/goldEagleHeads60x60.png',
    name : 'Flip a coin',
    prize : 'Free Buffalo Wings and Potato Skins!'
}];

exports.routes = {
    
    '/pages' : {
        
        description : 'Get a list of places generated from facebook',
        
        get : function(req,res){
            var lat = req.param('lat') || '42.645625';
            var lng = req.param('lng') || '-71.307864';
            var c = lat+','+lng;
            
            Bozuko.models.Page.search(c, req.param('limit') || 25, function(pages){
                res.send(pages);
            });
        }
    },
    
    '/place/:id/game' : {
        
        description :"Checkin and return the game result / code",
        
        get : function (req,res){
            // get the session from the cookie...
            var place_id = req.params.id;
            var lat = req.param('lat');
            var lng = req.param('lng');
            
            var uid = req.header('BOZUKO_FB_USER_ID');
            if( !uid ){
                var cookie = req.cookies['fbs_'+Bozuko.config.facebook.app.id];
                var session = qs.parse(cookie);
                var uid = session.uid;
                var auth = session.access_token;
            }
            
            // we should have the user from the session...
            if( !req.session.user ){
                res.send({success:false});
            }
            console.log(req.session.user);
            // lets check them in...
            facebook.graph('/'+place_id, function(p){
            //Bozuko.models.Place.find({facebook_id:place_id}).one(function(p){
            
                facebook.graph('/me/checkins',{
                    user:   req.session.user,
                    params:{
                        'message':'Just won a free something playing Bozuko!',
                        'place':place_id,
                        'coordinates':JSON.stringify(p.location)
                    },
                    method:'post'
                },function(result){
                    console.log(result);
                    // lets get the game requested
                    var ret = Bozuko.games.dice.run();
                    res.send({success:true, result: ret});
                });
            
                //res.send({success:true});
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