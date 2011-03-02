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

    '/pages' : {

        description : 'Get a list of pages generated from facebook',

        get : function(req,res){
            var lat = req.param('lat') || '42.645625';
            var lng = req.param('lng') || '-71.307864';
<<<<<<< HEAD
            
            bozuko.models.Page.search({lat:lat,lng:lng}, req.param('limit') || 25, function(pages){
=======
            var c = lat+','+lng;

            bozuko.models.Page.search(c, req.param('limit') || 25, function(pages){
>>>>>>> 9de9014f895688b20f6b3ec932b190afc1f8ec07
                res.send(pages);
            });
        }
    },

    '/page/:id' : {

	description :'Return page details',

        get :function(req,res){
            facebook.graph('/'+req.param('id'), {
                user: req.session.user
            },function(place){
                place.games = fakeGames;
                res.send(place);
            });
        }
    },

    '/page/:id/game' : {

	description :"Checkin and return the game result / code",

        get : function (req,res){
            // get the session from the cookie...
            var page_id = req.params.id;
            var lat = req.param('lat');
            var lng = req.param('lng');

            var uid = req.header('BOZUKO_FB_USER_ID');
            if( !uid ){
                var cookie = req.cookies['fbs_'+bozuko.config.facebook.app.id];
                var session = qs.parse(cookie);
                var uid = session.uid;
                var auth = session.access_token;
            }

            // we should have the user from the session...
            if( !req.session.user ){
                res.send({success:false});
		return;
            }
            console.log(req.session.user);
            // lets check them in...
            facebook.graph('/'+page_id, function(p){
            //bozuko.models.Place.find({facebook_id:place_id}).one(function(p){

                facebook.graph('/me/checkins',{
                    user:   req.session.user,
                    params:{
                        'message':'Just won a free something playing bozuko!',
                        'place':page_id,
                        'coordinates':JSON.stringify(p.location)
                    },
                    method:'post'
                },function(result){
                    console.log(result);
                    // lets get the game requested
                    var ret = bozuko.games.dice.run();
                    res.send({success:true, result: ret});
                });

                //res.send({success:true});
            });

        }
    }
};