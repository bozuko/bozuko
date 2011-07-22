module.exports = {
    
    api: {
        code:500,
        message: function(){ return this.data.type+": "+this.data.message; }
    },
    
    auth : {
        code:403,
        title:"Password Changed",
        message: "Looks like you changed your Facebook password. Please log out of Bozuko and log back in. Thanks!"
    },
    
    no_lat_lng : {
        code: 400,
        message: "Latitude and Longitude are required to checkin"
    },
    no_user : {
        code: 400,
        message: "User is required"
    },
    no_lat_lng_user_place: {
        code: 400,
        message: 'FacebookService::checkin requires place_id, latLng, and user as options'
    },
    no_lat_lng_query: {
        code: 400,
        message: "Latitude, Longitude, and search query required"
    },
    no_page_id_user: {
        code: 400,
        message: "Page id and user are required to like"
    },
    no_page_id: {
        code: 400,
        message: "Page id required"
    },
    bad_place_id: {
        code: 404,
        message: "The place you requested does not exist"
    }

};