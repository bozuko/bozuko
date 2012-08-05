(function($){
    
    var modal = false
      , styled = false
      ;
      
    function addStyle(server){
        if( styled ) return;
        $('<link href="'+server+'/css/widgets/themechooser.css" rel="stylesheet" type="text/css"></style>')
            .appendTo($('head'))
            ;
        
        styled = true;
    }
    
    function loadThemes(server, key, callback){
        $.ajax({
            url: server+'/themes',
            data: {limit: 1000, api_key:key},
            dataType: 'jsonp'
        })
        .success(function(result){
            return callback(null, result.themes);
        })
        .error(function(error){
            // handle error
            return callback(error);
        });
    }
    
    function createTheme(theme, server){
        var t = $([
            '<div class="theme">',
                '<div class="preview">',
                    '<img src="'+server+'/images/assets/icons/unknown.jpg" class="logo" />',
                    '<img src="'+theme.background+'" class="bg"/>',
                '</div>',
                '<div class="name">'+theme.name+'</div>',
            '</div>'
        ].join(''));
        return t;
    }
    
    function openModal(){
        if( !modal ) {
            modal = {};
            modal.bg = $('<div class="themechooser-modal-bg" />').appendTo($('body')).click( closeModal );
            modal.dialogCt = $('<div class="themechooser-modal-dialog-ct" />').appendTo($('body'));
            modal.dialog= $('<div class="themechooser-modal-dialog" />').appendTo(modal.dialogCt);
            modal.header=$('<div class="themechooser-modal-header">Select a Theme</div>').appendTo(modal.dialog);
            modal.body = $('<div class="themechooser-modal-body bozuko-theme-chooser" />').appendTo(modal.dialog);
            modal.footer = $('<div class="themechooser-modal-footer" />').appendTo(modal.dialog);
            modal.select = $('<button type="button" class="btn btn-primary">Select Theme</button>').appendTo( modal.footer );
            modal.cancel = $('<button type="button" class="btn">Cancel</button>').appendTo( modal.footer );
            
            modal.cancel.click( closeModal );
            modal.select.click( selectTheme );
        }
        
        $('body').addClass("themechooser-modal");
    }
    
    function closeModal(){
        $('body').removeClass("themechooser-modal");
    }
    
    var selected_value, current_input, current_el;
    
    function openPicker(el, themes, server, id, input, btn){
        
        current_el = el;
        current_input = input;
        selected_value = id;
        selected_index = 0;
        
        openModal();
        
        modal.body.empty();
        modal.select.attr('disabled', true);
        
        // populate
        var all = $()
          , cur = false
          ;
          
        for(var i=0; i<themes.length; i++){
            var p = createTheme(themes[i], server);
            p.attr('data-id', themes[i].id );
            p.attr('data-index', i);
            p.appendTo( modal.body );
            all = all.add(p);
            if( id == themes[i].id ){
                selected_index = i;
                cur = p;
            }
        }
        
        all.click( function(){
            all.removeClass('selected');
            $(this).addClass('selected');
            selected_value = $(this).attr('data-id');
            selected_index = $(this).attr('data-index');
            modal.select.attr('disabled', false);
        });
        
        if( cur ){
            modal.body.scrollTop( cur.position().top - 5 );
            cur.click();
        }
        
        modal.dialogCt.css('top', btn.parent().offset().top);
    }
    
    function selectTheme(){
        current_input.val( selected_value );
        
        var d = current_el.data('themechooser')
          , p = createTheme( d.themes[selected_index], d.options.server )
          , t = d.chooser.find('.theme')
          ;
          
        p.insertBefore(t);
        t.remove();
        closeModal();
    }
    
    var methods = {
        init : function( options ){
            
            if( !this.length ) return;
            
            options = $.extend({
                server      :this.attr('data-server'),
                key         :this.attr('data-key')
            }, options||{});
            
            if( !options.server || !options.key){
                $.error('bozukothemechooser: "server" and "key" options are required');
                return;
            }
            
            // add the css
            addStyle( options.server );
            
            var $this = $(this);
            
            return loadThemes( options.server, options.key, function(error, themes){
            
                return $this.each(function(){
                    var $this = $(this);
                    
                    // hide the input...
                    $this.hide();
                    
                    // create the theme div
                    var chooser = $('<div class="themechooser bozuko-theme-chooser" />');
                    chooser.insertAfter($this);
                    
                    // find the chosen theme
                    var found = false
                      , v = $this.val()
                      ;
                      
                    for(var i=0; v && i<themes.length && !found; i++){
                        if( themes[i].id == v ){
                            found = i;
                            break;
                        }
                    }
                    if( found === false ){
                        found = 0;
                        $this.val( themes[0].id );
                    }
                    
                    var t = createTheme( themes[found], options.server );
                    t.appendTo( chooser );
                    
                    // add the change button
                    var btn = $('<button type="button" class="btn themechooser-btn">Change Theme</button>')
                        .appendTo(chooser)
                        ;
                        
                    btn.click( function(){
                        openPicker( $this, themes, options.server, $this.val(), $this, btn );
                    });
                    
                    $this.data('themechooser',  {
                        themes: themes,
                        chooser: chooser,
                        options: options
                    });
                    
                });
            });
        }
    };
    
    $.fn.bozukothemechooser = function(method){
        if( methods[method] )
            return methods[method].apply(this, Array.prototype.slice.call(arguments,1));
        else if( typeof method === 'object' || !method )
            return methods.init.apply(this, arguments);
        else
            return $.error( 'Method ' + method + 'does not exist on bozukothemechooser');
    };
    
})(jQuery);

jQuery(function($){
    $('[data-bozuko-widget="themechooser"]').bozukothemechooser();
});