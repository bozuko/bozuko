var bozuko = require('bozuko');

module.exports = {

    no_lat_lng : {
        code: 400,
        message: "Latitude and Longitude are required to checkin"
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