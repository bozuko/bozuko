(function locationscraper(){

window.loadJQuery = function(){
    var s = document.createElement('script');
    s.src = 'https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.js';
    s.onload = init;
    document.getElementsByTagName('head')[0].appendChild(s);
};

loadGoogleMaps();
var geocoder, userLocation;

function loadGoogleMaps(){
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://maps.googleapis.com/maps/api/js?sensor=false&libraries=geometry&callback=loadJQuery";
    document.body.appendChild(script);
}

function init(){
    $ = jQuery;
    geocoder = new google.maps.Geocoder();
    
    var processing = false;
    
    var modal = $('<div style="text-align: center; padding: 20px; position: fixed; top: 250px; z-index: 1000000; left: 50%; margin-top: -200px; margin-left: -200px; border-radius: 10px; border: 1px solid #ccc; background: #fff; width: 400px; height: 340px; box-shadow: 0px 0px 20px #000;" />');
    modal.appendTo($('body'));
    
    $('<div style="font-weight: bold; text-align:left; ">Input:</div>').appendTo(modal);
    var input = $('<textarea style="margin-bottom: 20px; width:380px; height: 100px;" />');
    input.appendTo(modal);
    
    var button = $('<button>Process</button>');
    button.appendTo(modal);
    
    $('<div style="font-weight: bold; text-align:left; margin-top: 20px;">Output:</div>').appendTo(modal);
    var output = $('<textarea style="width:380px; height: 100px;" />');
    output.appendTo(modal);
    
    button.click(function(){
        if( processing ) return;
        button.attr('disabled', 'disabled');
        button.html('Processing...');
        output.val('');
        processing = true;
        process(input.val(), button, function(csv){
            button.attr('disabled', false);
            button.html('Process');
            output.val(csv);
            processing = false;
        });
    });
    
}
function process(file, button, done){
    if( !file ) return done('');
    var rows = file.split('\n');
    // clean up empty rows
    if( !rows.length ) return done('');
    var filtered = [];
    rows.forEach( function(row){ if(row!='') filtered.push(row); });
    rows = filtered;
    
    return each( rows, function(row, i, next){
        button.html('Processing '+(i+1)+' of '+rows.length+'...');
        var fields = row.split(',');
        getLocation( fields[0], function(location){
            rows[i]+=',"'+(location||'Private')+'"';
            if( !location || i > 0 && !userLocation ){
                rows[i]+=',N/A';
                return next();
            }
            return geocoder.geocode({address: location}, function(result){
                if( !result || !result.length ) return next();
                if( i == 0 ){
                    userLocation = result[0].geometry.location;
                    rows[i]+=',origin';
                }
                else{
                    var p = result[0].geometry.location;
                    rows[i]+=','+google.maps.geometry.spherical.computeDistanceBetween(userLocation, p, 3963.19).toFixed(2);
                }
                return next();
            });
        });
        
    }, function(){
        done(rows.join('\n'));
    });
}

function getLocation(id, callback){
    jQuery.get('/profile.php?id='+id, function(data){
        var match = data.match(/Lives in <a[^>]+>(.*?)<\/a>/); 
        return callback( match ? match[1] : false );
    }).error(function(){
        return callback(false);
    });
}

function each(ar, iterator, finish){
    var i = 0;
    var iterate = function(){
        if( i >= ar.length ) return ( finish ) ? finish() : null;
        return iterator(ar[i++], i-1, iterate);
    };
    return iterate();
};
})();