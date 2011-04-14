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
    },

    unknown_user :{
        code: 404,
        message : "User: " + this.data + "  has not entered this contest"
    },
    no_plays : "There are no plays left in the contest",

    db_update: "Failed to Update the record in the database",

    no_prize: "The prize was not found for this contest"
};
