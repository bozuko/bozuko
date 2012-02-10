var Bozuko={};

(function _bozuko_client_loader(exports){
    
    /* Public API */
    exports.show = show;
    exports.hide = hide;
    exports.setupTab = setupTab;
    
    /* Private Variables */
    var default_game_id,
        server,
        ready,
        index=0,
        id,
        tab,
        options={
            width       :350,
            height      :454,
            tabText     :'Play Our Game!'
        };
    
    parse_script_url();
    parse_url_search();
    parse_url_hash();
    
    var scripts = ['https://s3.amazonaws.com/bozuko/public/scripts/tinybox2/tinybox.js'];
    if( !window['Modernizer'] )
        scripts.push(server+'/js/modernizr/min.js');
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
        if( options.tab ){
            setupTab( options.tab, options.tabText );
        }
        if( options.openOnLaunch ){
            show();
        }
    }
    
    function setupTab(position, text)
    {
        if( tab ) return;
        tab = document.createElement('a');
        tab.className = 'bozuko-tab bozuko-tab-'+position;
        listen( tab, 'click', show );
        document.body.appendChild( tab );
    }
    
    /**
     * DOM utilities
     */
    function setStyles(el, styles)
    {
        for( var i in styles ){
            if( styles.hasOwnProperty(i) ){
                addStyle(el, i, styles[i]);
            }
        }
    }
    
    function setStyle(el, prop, value)
    {
        try{
            el.style[prop] = value;
        }catch(e){
            // probably IE, that crazy SOB
        }
    }
    
    function listen(el, event, listener)
    {
        
        if( el.addEventListener ) return el.addEventListener(event,listener,false);
        if (el.attachEvent) return el.attachEvent("on"+event, listener );
        return false;
    }
    
    
    function show(game_id){
        if( typeof game_id !== 'string' ) game_id = false;
        
        
        if( Modernizr.touch ) {
            // lets just open a new window
            try{
                window.open(
                    server+'/client/game/'+(game_id || options.game)+'?play=1'
                );
            }catch(e){
                window.location.href = server+'/client/game/'+(game_id || options.game)+'?play=1';
            }
            return;
        }
        
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
                    
                    var poweredBy = document.createElement('a');
                    poweredBy.setAttribute('href', 'https://bozuko.com');
                    poweredBy.setAttribute('target', '_blank');
                    poweredBy.setAttribute('class', 'bozuko-powered');
                    box.appendChild(poweredBy);
                    
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
    
    function parse_url_search()
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
    
    function parse_url_hash()
    {
        var s = window.location.hash;
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
            var v = p[j].split('=', 2),
                val = v.length == 2 ? unescape(v[1]) : true;
                
            if( val === '0' || val === 'false' ) val = false;
            o[v[0]] = val;
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
    function r(f)
    {
        if( ready ) return f();
        if( /in/.test(document.readyState) ) return setTimeout(function(){r(f);},9);
        ready=true;
        return f();
    }
    
    /**
     * Window Size
     */
    function get_window_dimensions()
    {
        return {
            width: get_window_dimension('width'),
            height: get_window_dimension('height')
        }
    }
    function get_window_dimension(type)
    {
        type = type.substr(0,1).toUpperCase()+type.substr(1);
        return window['inner'+type] ||
            (document.documentElement && document.documentElement['offset'+type] ?
                document.documentElement['offset'+type] : document.body['offset'+type]
            );
    }
})(Bozuko);