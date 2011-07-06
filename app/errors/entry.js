module.exports = {
    no_tokens : function() {
        return "The entry ["+this.data.entry._id+"] has 0 tokens remaining";
    },
    not_enough_tokens   :"Sorry, this game has ended",
    no_user             :"No user associated with this entry",
    no_contest          :"No contest associated with this entry",
    too_soon            :function(){
        var next = this.data;
        return "User cannot enter this contest again until "+next;
    },
    db_error            : "Unknown DB error",
    process_no_user     :"Cannot process an entry without a valid user."

};