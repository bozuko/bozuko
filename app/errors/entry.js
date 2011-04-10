module.exports = {
    no_tokens : function() {
        return "The entry ["+this.data.entry._id+"] has 0 tokens remaining";
    },
    not_enough_tokens   : "This contest does not have enough tokens to distribute",
    no_user             :"No user associated with this entry",
    no_contest          :"No contest associated with this entry",
    too_soon            :function(){
        var next = this.data;
        return "User cannot enter this contest again until "+next;
    }

};