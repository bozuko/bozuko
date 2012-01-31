var Bozuko={};

(function _bozuko_client_loader(exports){
    
    var default_game_id, server, ready, index=0, id, options={
        width       :350,
        height      :454
    };
    
    parse_script_url();
    parse_url();
    
    exports.show = show;
    exports.hide = hide;
    
    var scripts = ['https://s3.amazonaws.com/bozuko/public/scripts/tinybox2/tinybox.js'];
    if( !document.querySelectorAll )
        scripts.push('https://s3.amazonaws.com/bozuko/public/scripts/sizzle.js');
    
    _load_styles([
        'https://s3.amazonaws.com/bozuko/public/scripts/tinybox2/style.css',
        server+'/css/client/embed.css'
    ]);
    _load_scripts(scripts, on_script_loaded);
    
    function on_script_loaded()
    {
        // make sure document is ready
        r(init);
    }
    
    function init()
    {
        // do we have a game...
        if( options.openOnLaunch ){
            show();
        }
    }
    
    function show(game_id){
        r(function(){
            
            var id = 'bozuko_game_'+(index++);
            
            TINY.box.show({
                boxid: id,
                iframe: server+'/client/game/'+(game_id || options.game)+'?play=1',
                animate: false,
                width: options.width,
                height: options.height,
                openjs: function(){
                    // lets find this bad boy...
                    var box = document.getElementById(id),
                        iframe = box.getElementsByTagName('iframe')[0],
                        cw = iframe.contentWindow;
                    
                    iframe.setAttribute('scrolling', 'no');
                    
                    if( cw.addEventListener ) cw.addEventListener('message', function(message){
                        if( message.data === 'gamedone' ){
                            setTimeout( hide, 1000 );
                        }
                    });
                }
            });
        });
    }
    
    function hide()
    {
        r(TINY.box.hide);
    }
    
    function parse_script_url()
    {
        // lets find this script.
        var scripts = document.getElementsByTagName('script');
        for(var i=0; i<scripts.length; i++){
            if( scripts[i].src.match(/(client\/loader|js\/client\/loader\.js)/) ){
                // this should be the file...
                var src = scripts[i].src,
                    a = document.createElement('a');
                    
                a.href = src;
                server = a.protocol+'//'+a.host;
                
                // if there are no passed parameters, we can go
                if( !~src.indexOf('?') ) return;
                
                // okay... lets get the params
                parse_query_string(src.split('?',2)[1], options);
                return;
            }
        }
    }
    
    function parse_url()
    {
        var s = window.location.search;
        if( !s || s.length < 2 ) return;
        var o = parse_query_string(s.substr(1));
        for(var i in o){
            if( o.hasOwnProperty(i) && /^boz_/.test(i) && i.length > 4){
                options[i.substr(4)] = o[i];
            }
        }
    }
    
    function parse_query_string(string, o){
        o=o||{};
        // okay... lets get the params
        var p = string.split('&');
        for(var j=0; j<p.length; j++){
            var v = p[j].split('=', 2);
            o[v[0]] = unescape(v[1]);
        }
        return o;
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
        s.defer = true;
        s.async = true;
        s.onreadystatechange = function(){ if( !/in/.test(this.readyState) ) callback(); };
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
    /**
     * Document Ready Detection
     */
    function r(f){
        if( ready ){
            f();
            return;
        }
        if( /in/.test(document.readyState) ){
            setTimeout(function(){r(f);},9);
        }
        else{
            ready=true;
            f();
        }
    }
})(Bozuko);