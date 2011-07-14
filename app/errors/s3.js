module.exports = {
    get: {
        code: 404,
        message: 'Your barcode cannot be retrieved. Please check your prize screen later.'
    },

    put: {
        code: 404,
        message: 'Failed to put data to s3 for '+this.data
    }
};