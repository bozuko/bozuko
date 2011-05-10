module.exports = {

    no_user : {
        code: 400,
        message: "User is required for checkin"
    },
    no_page: {
        code: 400,
        message: "Page is required for checkin"
    },
    too_many_attempts_per_page: {
        code: 403,
        message: "Checkin occurred too soon after the last checkin for this page"
    },
    too_many_attempts_per_user: {
        code: 403,
        message: "Checkin occurred too soon after the last checkin for this user"
    },
    too_far: {
        code: 500,
        message: "User is too far away to checkin to this location."
    }

};