exports.access = 'admin';

exports.init = function(){
    this.app.enable('jsonp callback');
};

exports.routes = {
    '/widget/game/:game_id' : {
        get : {
            handler : function(req, res){
                // show either iframe or javascript?
            }
        }
    }
};