module.exports = {
    not_found : {
        code: 404,
        message: "The user does not exist"
    },
    favorite_does_not_exist:"The favorite you are removing does not exist",
    like_bad_page: "Invalid 'page' parameter for User::like",
    favorites_no_ll: "User favorites requires an ll parameter and a user token",
    blocked: {
        code: 403,
        message: "This account has been flagged as fraudulent. If this is a mistake send email to support@bozuko.com"
    }

};