
module.exports = {
    bad_state: {
        code: 400,
        message: 'state parameter must be one of \'active\', \'redeemed\', or \'expired\''
    },
    
    already_redeemed: "This Prize has already been redeemed",
    expired: "This Prize has expired",
    redeem_bad_user: "Current user cannot redeem another users prize"
};