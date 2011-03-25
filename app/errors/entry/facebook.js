var bozuko = require('bozuko');

module.exports = {
    
    invalid_page : function(){
        return "Invalid Page ["+this.data+"]";
    },
    
    no_facebook_account : function(){
        return "This page ["+this.data+"] does not have a facebook account associated with it";
    },
    
    no_lat_lng : "Latitude and Longitude are required to checkin"
    
};