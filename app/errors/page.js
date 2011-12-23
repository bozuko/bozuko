module.exports = {
    pages_no_ll: "Missing required parameter ll",
    malformed_center: "Center parameter is not in the correct format (must be latitude,longitude)",
    malformed_bounds: "Bounds parameter is not in the correct format (must be latitude1,longitude1,latitude2,longitude2)",
    does_not_exist: "Page does not exist",
    missing_code_block: 'code_block field does not exist',
    missing_code_prefix: 'code_prefix field does not exist',
    invalid_pin: {
        code: 403,
        message: "That PIN is invalid"
    },
    required: {
        code: 403,
        message: "This call is missing parameters"
    },
    permission: {
        code: 403,
        message: "You don't have permission to access this page"
    }
};