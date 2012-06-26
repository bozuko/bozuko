module.exports = {
    user: {
        code: 401,
        title: "Please Login",
        message: "You must be logged in to do that!",
        detail: "Unauthorized action - must have a valid user session."
    },
    developer: {
        code: 401,
        title: "Developer API Failure",
        message: "The API credentials are invalid or missing",
        detail: "The API credentials are invalid or missing"
    },
    mobile: {
        code: 400,
        detail: "Phone is not authorized to use bozuko",
        title: "Unauthorized Phone",
        message: "This phone is not authorized to use Bozuko"
    }
};