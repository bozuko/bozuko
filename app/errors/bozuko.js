module.exports = {
    auth: {
        code: 401,
        title: "Please Login",
        message: "You must be logged in to do that!",
        detail: "Unauthorized action - must have a valid user session."
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
        title: "Bozuko Update",
        message: "A new version of Bozuko is available. You must update to continue."
    },
    
    not_implemented: {
        title: "Not Implemented",
        message: "This feature has not been implemented yet :( Check back soon!"
    },
    
    unauthorized_request: {
        title: "Unauthorized request",
        message: "You are not allowed to do that!"
    }
};