exports.config = {
    
    types : {
        name                :String,
        first_name          :String,
        last_name           :String,
        gender              :String,
        email               :String,
        sign_up_date        :Date,
        facebook_id         :String,
        facebook_auth       :String,
        can_manage_pages    :Boolean
    },
    
    methods : {
        save : function(fn){
            if( this.isNew ){
                this.sign_up_date = new Date();
            }
            this.__super__(fn);
        },
        
        getCheckins : function(place,fn){
            
        }
    },
    
    indexes : ['email', 'facebook_id']
    
};