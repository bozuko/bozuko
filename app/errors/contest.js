module.exports = {

    not_found           :{
        code                :404,
        message             :function(){
            return "Contest not found ("+this.data+")";
        }
    },

    no_tokens           :"User does not have any tokens to play this game",

    invalid_entry_type  : function(){
        return "Invalid entry type ["+this.data.entry.type+"] for contest ["+this.data.contest.id+"]";
    }
    
};
