Ext.define('Bozuko.lib.Util', {
    
    statics : {
        howto : function(article){
            window.open(Bozuko.Router.route('/howto#'+(article||'')), 'howto', 'width=800,height=600');
        }
    }
    
});