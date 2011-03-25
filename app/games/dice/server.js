exports.run = function(config){
    config = config || {};
    var number = config.number_of_die || 5;
    var results = [];
    for(var i=0; i<number; i++){
        results.push(Math.floor(Math.random()*6)+1);
    }
    return {result:results};
};