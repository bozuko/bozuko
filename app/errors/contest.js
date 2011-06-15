module.exports = {

    not_found           :{
        code                :404,
        message             :function(){
            return "Game not found ("+this.data+")";
        }
    },

    no_tokens : {
        detail: "User does not have any tokens to play this game",
        title: "No more plays",
        message: "You do not have any plays left for this game"
    },
    
    inactive : {
        title: "Gave over",
        message: "Sorry, this game has ended :("
    },

    invalid_entry_type  : function(){
        return "Invalid entry type ["+this.data.entry.type+"] for contest ["+this.data.contest._id+"]";
    },

    incrementing_play_cursor: function() {
        return "Failed to increment the play cursor for contest ["+this.data.contest._id+"]";
    },

    game_entry_requires_ll : function(){
        return "Game entry requires ll parameter";
    },

    email_prize_update : function() {
        return "Failed to update prize ["+this.data.prize_index+"] for contest ["+this.data.contest._id+"]";
    },

    unknown_user :{
        code: 404,
        message : "User: " + this.data + "  has not entered this contest"
    },
    no_plays : "There are no plays left in the contest",

    invalid_entry : "Error validating the entry",

    db_update: "Failed to Update the record in the database",

    no_prize: "The prize was not found for this contest",

    no_entry_found_after_checkin: "No entry was found after checkin",

    entry_not_found : {
        code: 404,
        message: "Error entering contest - entry was not found"
    }
};
