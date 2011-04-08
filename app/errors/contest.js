module.exports = {

    not_found           :{
        code                :404,
        message             :function(){
            return "Contest not found ("+this.data+")";
        }
    },

    no_tokens           :"User does not have any tokens to play this game",

    invalid_entry_type  : function(){
        return "Invalid entry type ["+this.data.entry.type+"] for contest ["+this.data.contest._id+"]";
    },

    incrementing_play_cursor: function() {
        return "Failed to increment the play cursor for contest ["+this.data.contest._id+"]";
    }

};
