(function($){
    
    var styled = false
      , types = {
            'entries'       :'Entries',
            'unique'        :'Unique Users'
        }
    ;
    
    function addStyle(server){
        if( styled ) return;
        $('<link href="'+server+'/css/widgets/reports.css" rel="stylesheet" type="text/css"></style>')
            .appendTo($('head'))
            ;
        
        styled = true;
    }
    
    var updateChart = function( $this, type ){
        
        var data = $this.data('bozukoreport')
          , options = data.options;
        
        type = type || options.type || 'entries';
        if( !types[type] ) type = 'entries';
        
        // get the data
        $.ajax({
            url: options.server+'/reports/'+type,
            data: {
                api_key:options.key,
                timezoneOffset: new Date().getTimezoneOffset(),
                game_id: options.game_id,
                page_id: options.page_id
            },
            dataType: 'jsonp'
        })
        .success(function(d){
            
            // if there is 0 data, tell people that...
            if( !d.length ){
                if( data.chart ){
                    data.chart.destroy();
                    data.chart = null;
                }
                data.ct.empty();
                data.ct.addClass('no-results-container');
                $('<div class="no-results">Sorry, there is no data to display</div>').appendTo(data.ct);
                return;
                
            }
            data.ct.removeClass('no-results-container');
            var chartOptions = $.extend(true, {
                chart: {
                    backgroundColor: 'transparent'
                },
                
                title : {
                    text : types[type]
                },
                
                yAxis : {
                    min : 0
                }
            }, options.chartOptions || {}, {
                chart : {
                    renderTo : data.ct[0]
                },
                
                series : [{
                    name : types[type],
                    data : d
                }]
            });
            var chart = new Highcharts.StockChart(chartOptions);
            
            $this.data('bozukoreport').chart = chart;
        })
        .error(function(error){
            // handle an error situation
        });
    }
    
    var methods = {
        init : function( options ){
            
            if( !window.Highcharts ){
                return $.error('bozukoreport: You must have a Highcharts license and the script must be included on the page');
            }
            
            return this.each(function(){
                var $this = $(this);
                
                var opts = $.extend({
                    server      :$this.attr('data-server'),
                    key         :$this.attr('data-key'),
                    page_id     :$this.attr('data-page_id'),
                    game_id     :$this.attr('data-game_id')
                }, options);
                
                if( !opts.server || !opts.key){
                    $.error('bozukoreport: "server" and "key" options are required');
                    return;
                }
                
                addStyle( opts.server );
                
                var data = $this.data('bozukoreport') || {};
                
                data.options = opts;
                
                if( !data.toolbar ){
                
                    // add a toolbar
                    data.toolbar = $('<div class="bozuko-toolbar" />').appendTo( $this );
                    data.itemlist = $('<ul class="bozuko-items" />').appendTo( data.toolbar );
                    
                    data.ct = $('<div class="bozuko-report" />').appendTo( $this );
                    
                    for(var i in types) if( types.hasOwnProperty( i ) ) {
                        $('<li><a href="#" class="action-button" data-type="'+i+'">'+types[i]+'</a></li>')
                            .appendTo(data.itemlist)
                        ;
                    }
                    
                    data.ct.height( $this.height() - data.toolbar.height() );
                    
                    data.itemlist.find('a').click(function(e){
                        e.preventDefault();
                        var type = $(this).attr('data-type');
                        data.toolbar.find('.action-button').removeClass('active');
                        $(this).addClass('active');
                        updateChart( $this, type );
                    });
                }
                
                $this.data('bozukoreport', data);
                
                if( opts.type ) data.toolbar.find('[data-type="'+opts.type+'"]').click();
                else data.toolbar.find('li:first-child .action-button').click();
                
            });
            
        }
    };
    
    $.fn.bozukoreport = function(method){
        if( methods[method] )
            return methods[method].apply(this, Array.prototype.slice.call(arguments,1));
        else if( typeof method === 'object' || !method )
            return methods.init.apply(this, arguments);
        else
            return $.error( 'Method ' + method + 'does not exist on bozukoreports');
    };
    
})(jQuery);

jQuery(function($){
    $('[data-bozuko-widget="report"]').bozukoreport();
});