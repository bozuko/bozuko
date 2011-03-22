var bozuko = require('bozuko');

module.exports = {
    
    token_update_fail   :"There was an error updating the amount of tokens for the entry",
    not_enough_tokens   :"This contest does not have enough tokens to distribute",
    no_user             :"No user associated with this entry",
    no_contest          :"No contest associated with this entry",
    too_soon            :function(){
        var next = this.data;
        return "User cannot enter this contest again until "+next;
    }
    
};