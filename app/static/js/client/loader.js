var Bozuko={};

(function _bozuko_client_loader(exports){
    
    var default_game_id, server, options={};
    
    parse_script_url();
    
    _load_style('https://s3.amazonaws.com/bozuko/public/scripts/tinybox2/style.css');
    _load_script('https://s3.amazonaws.com/bozuko/public/scripts/tinybox2/packed.js', init);
    
    function init()
    {
        
    }
    
    function parse_script_url()
    {
        // lets find this script.
        var scripts = document.getElementsByTagName('script');
        for(var i=0; i<scripts.length; i++){
            if( scripts[i].src.match(/(client\/loader|js\/client\/loader\.js)/) ){
                // this should be the file...
                var src = scripts[i].src;
                // if there are no passed parameters, we can go
                if( !~src.indexOf('?') ) return;
                // okay... lets get the params
                var p = src.split('?',2)[1].split('&');
                for(var j=0; j<p.length; j++){
                    var o = p[j].split('=', 2);
                    options[o[0]] = unescape(o[1]);
                }
                return;
            }
        }
    }


    /**
     * Utility Functions to load scripts
     */
    function _load_scripts(scripts, callback)
    {
        var _load = function(s){
            _load_script(s, function(){
                if( scripts.length ) return _load(scripts.shift());
                return callback();
            });
        };
        _load(scripts.shift());
    }
    function _load_script(script, callback)
    {
        var s = document.createElement('script');
        s.src=script;
        s.type='text/javascript';
        s.onload = callback;
        s.onreadystatechange = function(){ if( this.readyState == 'complete' ) callback(); };
        document.getElementsByTagName('head')[0].appendChild(s);
    }
    
    function _load_styles(styles)
    {
        for(var i=0; i<styles.length; i++){
            _load_style(styles[i]);
        }
    }
    function _load_style(style)
    {
        var s = document.createElement('link');
        s.href = style;
        s.type = 'text/css';
        s.rel = 'stylesheet';
        document.getElementsByTagName('head')[0].appendChild(s);
    }

})(Bozuko);