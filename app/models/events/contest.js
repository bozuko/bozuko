module.exports = function(schema, opts){
    
    schema.on('play', function(contest){
        var complete = contest.play_cursor / contest.total_plays;
        
        // are we over 90% complete?
        if( complete > .9 ){
            // check if a notification went out yet
            
        }
        
    });
    
};