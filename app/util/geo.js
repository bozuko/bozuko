
var earthRadiusMiles = 3963.191;

/** Converts numeric degrees to radians */
if (typeof(Number.prototype.toRad) === "undefined") {
  Number.prototype.toRad = function() {
    return this * Math.PI / 180;
  }
}

module.exports = {
    
    earth:{
        radius:{
            km: 6371.009,
            mi: 3958.761
        }
    },
    
    distance: function(p1,p2,unit){
        var R = earthRadiusMiles;
        var lat1=p1[1], lon1=p1[0], lat2=p2[1], lon2=p2[0];
        var dLat = (lat2-lat1).toRad();
        var dLon = (lon2-lon1).toRad(); 
        var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) * 
                Math.sin(dLon/2) * Math.sin(dLon/2); 
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        var d = this.earth.radius[unit||'mi'] * c;
        return d;
    },
    
    formatDistance: function(d, unit){
        if( unit == 'km' ) return d;
        // less that 50 feet is basically there.
        if( d < 40/5280 ){
            return 'Current location';
        }
        else if( d < 100/5280 ){
            var feet = d * 5280 /* feet per mile */;
            feet = Math.round(feet/10)*10;
            return 'About '+feet+' feet away';
            return 'Your current location';
        }
        else if( d <= .15 ){
            var yards = d * 5280 / 3; /* yards per mile */;
            yards = Math.round(yards/10)*10;
            return 'About '+yards+' yards away';
        }
        else if( d < .3 ){
            return 'About 1/4 mile away';
        }
        else if( d < .4 ){
            return 'About 1/3 mile away';
        }
        else if( d <= .6 ){
            return 'About 1/2 mile away';
        }
        else if( d <= .8 ){
            return 'About 3/4 mile away';
        }
        else if( d <= 1.2 ){
            return 'About 1 mile away';
        }
        else if( d <= 1.75 ){
            return 'About 1.5 miles away';
        }
        else if( d <= 1.75 ){
            return 'About 1.5 miles away';
        }
        else{
            return 'About '+Math.round(d *10) /10+' miles away';
        }
    }
    
}