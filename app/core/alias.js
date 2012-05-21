var async = require('async')
  ;

/**
 * Utility for finding pages / contests by alias
 */
exports.find = function( alias, callback ){
    var parts = alias.replace(/^\//, '').split('/')
      , page
      , game
      , page_alias = parts.length ? parts.shift() : null
      , game_alias = parts.length ? parts.shift() : null
      ;
    
    if( !page_alias ) return callback(null, {
        page: null,
        game: null
    });
    
    // try to find the page
    return async.series([
        function get_page(cb){
            find_page( page_alias, function(error, _page){
				if( _page ) page = _page;
                cb();
            });
        },
        
        function get_game(cb){
			
			if( game_alias && !page ) return cb();
			
            var alias = game_alias;
            
            if( !alias && page ){
                // get the latest web only game
                return get_latest_game( page._id, function( error, _game){
                    if( _game ) game = _game;
                    cb();
                });
            }
            
            if( !alias && !page ){
                alias = page_alias;
            }
            
            return find_game( alias, function(error, _game){
                if( _game ) game = _game;
                cb();
            });
        },
		
		function double_check_game(cb){
			if( page || !game ) return cb();
			return Bozuko.models.Page.findById( game.page_id, function(error, _page){
				if( !error && _page ) page = _page;
				return cb();
			});
		}
		
    ], function do_return(err){
		
		return callback(null, {
            page: page,
            game: game
        });
    });
    
};

function find_page( page_alias, callback ){
    Bozuko.models.Page.findOne({
		alias: page_alias
	}, function( error, page){
		if( error ) return callback( error );
		if( page ) return callback( null, page );
		return Bozuko.models.Page.findById(page_alias, callback);
	});
}

function find_game( game_alias, callback ){
	var d = new Date();
    Bozuko.models.Contest.find({
        alias: game_alias,
		start: {lt: d},
		end: {gt: d},
        active: true
	}, {results: 0, page: 0}, {limit: 1, sort:{start:-1}}, function(error, games){
        if( error ) return callback( error );
		if( games && games.length ) return callback( null, games[0] );
        return Bozuko.models.Contest.findById( game_alias, callback );
    });
}

function get_latest_game( page_id, callback ){
	var d = new Date();
    Bozuko.models.Contest.find({
        $or: [{page_id: page_id}, {page_ids: page_id}],
        active: true,
		start: {lt: d},
		end: {gt: d}
	}, {results: 0, page: 0}, {limit: 1, sort:{start:-1}}, function(error, games){
        if( error ) return callback( error );
        return callback( null, games.length ? games[0] : null );
    });
}