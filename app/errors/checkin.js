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
        message: "You are too far away from this place to checkin. ",
        detail: "User is too far away to checkin to this location."
    }

};