module.exports = {
    auth: {
        code: 401,
        message: "Unauthorized action - must have a valid user session."
    },
    
    lang_not_enough_args: "Translation needs at least 2 arguments",
    lang_bad_path: function(){
        return "Translation had a bad path ["+this.data+"]";
    }
};