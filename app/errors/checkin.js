module.exports = {

    no_user : {
        code: 400,
        message: "User is required for checkin"
    },
    no_page: {
        code: 400,
        message: "Page is required for checkin"
    },
    non_location: {
        code: 400,
        message: "Sorry, you cannot checkin here because it is not a location"
    },
    too_many_attempts_per_page: {
        code: 403,
        title: "Checkin Error",
        message: "You are checkin in at this place too often.",
        detail: "Checkin occurred too soon after the last checkin for this page"
    },
    too_many_attempts_per_user: {
        code: 403,
        title: "Woah there...",
        message: "You are trying to checkin too often. Wait a little bit",
        detail: "Checkin occurred too soon after the last checkin for this user"
    },
    too_far: {
        code: 500,
        title: "So far away...",
        message: function(){
            if( !this.data.user || this.data.user.phone !== 'iphone' ){
                return "You are too far away from this place to checkin.";
            }
            return "You are too far away from this place to checkin. "+
                "Please try going back to the Nearby list and pulling down to refresh your location.";
        },
        detail: "User is too far away to checkin to this location."
    }

};