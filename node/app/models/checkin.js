exports.config = {
    
    types : {
        user_facebook_id        :String,
        user_id                 :String,
        place_id                :String,
        place_facebook_id       :String,
        timestamp               :Date,
        message                 :String,
        game_id                 :Number,
        game_name               :String,
        game_result             :Object
    },
    
    methods : {
        save : function(fn){
            if( this.isNew ){
                this.timestamp = new Date();
            }
            this.__super__(fn);
        }
    },
    
    indexes : ['facebook_id','user_id','place_id','game_id']
    
};