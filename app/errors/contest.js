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
        title: "Game over",
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
    no_plays : {
        title: "No Plays",
        message: "This game has no plays left"
    },

    invalid_entry : {
        title: "Uh-oh...",
        message: "There was a problem entering you in this game. Please try again."
    },

    db_update: "Failed to Update the record in the database",

    no_prize: "The prize was not found for this contest",

    no_entry_found_after_checkin: "No entry was found after checkin",

    entry_not_found : {
        code: 404,
        message: "Error entering contest - entry was not found"
    },

    play_not_found: {
        code: 404,
        message: "Error playing contest"
    },

    max_entries: function() {
        return 'Cannot publish games with more than '+this.data+' entries';
    }
};
