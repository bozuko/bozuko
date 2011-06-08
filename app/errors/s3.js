module.exports = {
    get: {
        code: 404,
        message: 'Failed to retreive data from s3 for '+this.data
    },

    put: {
        code: 404,
        message: 'Failed to put data to s3 for '+this.data
    }
};