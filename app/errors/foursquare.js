module.exports = {
    
    api                 :function(){
        return "Foursquare API Error\n\nCode: "+this.data.code+"\nType: "+this.data.errorType+"\nDetail: "+this.data.errorDetail;
    },
    search_no_lat_lng   :"Latitude and Longitude are required to search"
    
};