module.exports = {
    timeout: {
        code: 408,
        message: function() {
            return "HTTP request timeout: "+this.data;
        }
    },

    json: function() {
        return "Failed to parse HTTP response for: "+this.data;
    },

    error_event: function() {
        return "HTTP clientRequest error event: "+this.data;
    }
};