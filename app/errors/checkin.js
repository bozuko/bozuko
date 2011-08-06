var DateUtil = Bozuko.require('util/date');

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
    no_gps : {
        code: 400,
        title: "Where are you?",
        message: "It looks like your GPS may not be enabled. Please make sure that location services are enabled on your phone and allowed for Bozuko. Thanks!"
    },
    too_many_attempts_per_page: {
        code: 403,
        title: "Woah There...",
        message: function(){
            if( !this.data || !this.data.next_time){
                return "You are trying to check in here too often. Please wait a little bit";
            }
            return "Sorry, you are trying to check in here too often. You can check in here "+DateUtil.inAgo(this.data.next_time);
        },
        detail: "Checkin occurred too soon after the last checkin for this page"
    },
    too_many_attempts_per_user: {
        code: 403,
        title: "Woah there...",
        message: function(){
            if( !this.data || !this.data.next_time){
                return "You are trying to check in too often. Please wait a little bit";
            }
            return "You are trying to check in too often. You can check in here "+DateUtil.inAgo(this.data.next_time);
        },
        detail: "Checkin occurred too soon after the last check in for this user"
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