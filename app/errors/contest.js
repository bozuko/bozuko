var bozuko = require('bozuko');

module.exports = {
    
    not_found           :{
        code                :404,
        message             :function(){
            return "Contest not found ("+this.data+")";
        },
        no_tokens           :"User does not have any tokens to play this game"
    }
    
};