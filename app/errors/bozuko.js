module.exports = {
    auth: {
        code: 401,
        message: "Unauthorized action - must have a valid user session."
    },
    
    lang_not_enough_args: "Translation needs at least 2 arguments",
    lang_bad_path: function(){
        return "Translation had a bad path ["+this.data+"]";
    },
    user_not_logged_in: function(){
        return "The user must be logged in ["+this.data+"]";
    },
    
    transfer :{
        code: 500,
        message: function(){
            return "Error creating transfer object: "+this.data;
        }
    },
    
    update : {
        code: 403,
        message: "Sorry. You must update Bozuko to continue."
    }
};