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
    process_no_user     :"Cannot process an entry without a valid user.",

    too_far: {
        code: 500,
        title: "So far away...",
        message: function(){
            if( !this.data.user || this.data.user.phone !== 'iphone' ){
                return "You are "+this.data.distance+" miles away. You must be within "+
                this.data.radius+" miles.";
            }
            return "You are "+this.data.distance+" miles away. You must be within "+
                this.data.radius+" miles. "+
                "Please try going back to the Nearby list and pulling down to refresh your location.";
        },
        detail: "User is too far away from this location to enter the contest."
    }
};