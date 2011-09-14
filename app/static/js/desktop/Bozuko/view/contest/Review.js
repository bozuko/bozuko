Ext.define('Bozuko.view.contest.Review', {
    
    extend          :'Ext.panel.Panel',
    alias           :'widget.contestreview',
    
    requires : [
        'Bozuko.store.EntryTypes',
        'Bozuko.store.Games'
    ],
    
    durations: [
        {label: 'Years', value: 1000 * 60 * 60 * 24 * 365},
        {label: 'Months', value: 1000 * 60 * 60 * 24 * 30},
        {label: 'Weeks', value: 1000 * 60 * 60 * 24 * 7},
        {label: 'Days', value: 1000 * 60 * 60 * 24},
        {label: 'Hours', value: 1000 * 60 * 60},
        {label: 'Minutes', value: 1000 * 60},
        {label: 'Seconds', value: 1000}
    ],
    
    initComponent : function(){
        var me = this;
        if( me.contest && me.contest.get('active') ) me.name = 'Review';
        Ext.apply( me, {
            data : me.contest.data,
            tpl : new Ext.XTemplate(
                '<div class="campaign-overview">',
                    '<div class="row big-row first-row">',
                        '<div class="label">Campaign:</div>',
                        '<div class="content">{name}</div>',
                    '</div>',
                    '<div class="row timeline">',
                        '<div class="label">Timeline:</div>',
                        '<div class="content">{[this.timeline()]}</div>',
                    '</div>',
                    '<div class="row entry">',
                        '<div class="label">Contest Odds:</div>',
                        '<div class="content">{[this.contestOdds()]}</div>',
                    '</div>',
                    '<div class="row entry">',
                        '<div class="label">Entry Method:</div>',
                        '<div class="content">{[this.entryMethod()]}</div>',
                    '</div>',
                    '<div class="row game">',
                        '<div class="label">Game:</div>',
                        '<div class="content">{[this.game()]}</div>',
                    '</div>',
                    '<div class="row game-name">',
                        '<div class="label">Game Name:</div>',
                        '<div class="content">{[this.gameName()]}</div>',
                    '</div>',
                    '{[this.gameOptions()]}',
                    '<div class="row prizes">',
                        '<div class="label">Prizes:</div>',
                        '<div class="content">{[this.prizes()]}</div>',
                    '</div>',
                '</div>',
                {
                    timeline : function(){
                        var fmt = 'D M d, Y h:i A';
                        return Ext.Date.format(me.contest.get('start'),fmt)+
                               ' &mdash; '+
                               Ext.Date.format(me.contest.get('end'),fmt)
                    },
                    entryMethod : function(){
                        
                        // lets get the icon
                        var img = Ext.data.StoreManager
                            .lookup('entry-types')
                            .findRecord('type', me.contest.getEntryConfig().type)
                            .get('img');
                        
                        
                        
                        return [
                            '<img src="',img,'" height="50" style="float: right; margin: 0 0 0 6px;" />',
                            me.contest.getEntryType(false),
                            '<br />',
                            'Users can play every ',me.getFormattedDuration(me.contest.getEntryConfig().duration)
                        ].join('');
                    },
                    
                    game : function(){
                        
                        // lets get the icon
                        var img = Ext.data.StoreManager
                            .lookup('games')
                            .findRecord('game', me.contest.get('game') )
                            .get('img');
                        
                        var html = [
                            '<img src="',img,'" height="50" style="float: right; margin: 0 0 0 6px;" />',
                            me.contest.getGameName(),
                            '<br />',
                            me.contest.getEntryConfig().tokens+' plays per Entry'
                        ];
                        return html.join('');
                    },
                    
                    gameName : function(){
                        var cfg = me.contest.get('game_config');
                        return cfg.name || (me.contest.get('game')=='slots'?'Slots':'Scratch');
                    },
                    
                    gameOptions : function(){
                        var cfg = me.contest.get('game_config'),
                            game = me.contest.get('game');
                        if( cfg.theme ){
                            var themeName = cfg.theme.substr(0,1).toUpperCase()+cfg.theme.substr(1),
                                img = Bozuko.Router.route('/themes/'+game+'/'+cfg.theme+'/image');
                                
                                /*
                            // try to get the theme from the game panel
                            var themeChooser = me.up('contestbuilder')
                                .down('contestbuildergame [ref=theme-chooser]')
                                ;
                            if( themeChooser ){
                                var record= themeChooser
                                    .store.findRecord('theme', cfg.theme )
                                    ;
                                themeName = record.get('title');
                                img = record.get('icon');
                            }
                                */
                            
                            return [
                                '<div class="row game-theme">',
                                    '<div class="label">Game Theme:</div>',
                                    '<div class="content">',
                                        (img?'<img src="'+img+'" height="50" style="float:right;" />':''),
                                        themeName,
                                    '</div>',
                                '</div>'
                            ].join('')
                        }
                        return '';
                    },
                    
                    prizes : function(){
                        
                        var prizes_classes = ['prizes-container'];
                        if( me.prizes_expanded ) prizes_classes.push('expanded');
                        
                        var html = [
                            '<div class="prizes-overview">',
                                '<div class="expander"></div>',
                                '<strong>',me.contest.prizes().count(),'</strong> Prize Types<br />',
                                '<strong>',
                                me.contest.getTotalPrizeCount(),
                                '</strong> Total Prizes<br />',
                                '<strong>$',
                                me.contest.getTotalPrizesValue().toFixed(2),'</strong>',
                                ' Total Value',
                            '</div>'
                        ];
                        html.push('<div class="prizes-list">');
                        me.contest.prizes().each(function(prize, i){
                            var redemption_type = (function(){
                                switch(prize.get('redemption_type')){
                                    case 'image':
                                        return 'Security Image';
                                    case 'barcode':
                                        return 'Barcode';
                                    case 'email':
                                        return 'Email';
                                }
                                return 'Unknown';
                            })();
                            
                            var classes = ['prize'];
                            if( i == me.contest.prizes().getCount()-1 ) classes.push('last-prize');
                            
                            html = html.concat([
                                '<div class="',classes.join(' '),'">',
                                    '<div class="prize-odds">',
                                        'Odds: ',me.contest.getPrizeOdds(i),
                                    '</div>',
                                    '<div class="prize-name">',
                                        prize.get('name'),
                                    '</div>',
                                    '<div class="prize-details">',
                                        '<div class="prize-redemption">',
                                            '<span class="plabel">Redemption Type:</span><span class="val">',redemption_type,'</span>',
                                        '</div>',
                                        '<div class="prize-value">',
                                            '<span class="plabel">Value:</span><span class="val">$',prize.get('value'),'</span>',
                                        '</div>',
                                        '<div class="prize-quantity">',
                                            '<span class="plabel">Quantity:</span><span class="val">',prize.get('total'),'</span>',
                                        '</div>',
                                    '</div>',
                                '</div>'
                            ]);
                        });
                        html.push('</div>');
                        return ['<div class="',prizes_classes.join(' '),'">']
                            .concat(html)
                            .concat(['</div>'])
                            .join('');
                    },
                    
                    contestOdds : function(){
                        return [
                            '1 in '+me.contest.get('win_frequency').toFixed(1)+' entries will win',
                            '<br />',
                            me.contest.get('total_entries')+' Total Entries'
                        ].join('');
                    }
                }
            )
        });
        me.callParent();
        me.on('render', me.refresh, me);
    },
    
    getFormattedDuration : function(v){
        var d, l;
        for(var i=0; i<this.durations.length; i++){
            if( v >= this.durations[i].value ){
                var value = this.durations[i].value;
                d = v / value, u = value, l = this.durations[i].label;
                if( Math.round(d) != d && !this.isTwoDecimalPlacesOrLess(d) ){
                    // go through the rest and see if we can get an evenish
                    // number
                    for(var j=i; j<this.durations.length; j++){
                        value = this.durations[j].value;
                        var test = v/value;
                        if( Math.round(test) == test || this.isTwoDecimalPlacesOrLess(test) ){
                            d = test, u = value, l = this.durations[j].label;
                            break;
                        }
                    }
                }
                break;
            }
        }
        if( d===1 ){
            d = '';
            l = l.replace(/s$/,'');
        }
        return (d||0)+' '+((l||'seconds').toLowerCase());
    },
    
    isTwoDecimalPlacesOrLess : function(n){
        var s = new String(n);
        if( !~s.indexOf('.') ) return true;
        return s.split('.')[1].length < 3;
    },
    
    refresh : function(){
        var me = this;
        if(!me.rendered ) return;
        if(!me.contest) return;
        me.update( me.contest.data );
        setTimeout(function(){
            var expander = me.getEl().down('.prizes .expander');
            if( expander ) expander.on('click', function(e,t){
                var ct = Ext.fly(t).up('.prizes-container');
                ct.toggleCls('expanded');
                me.prizes_expanded = ct.hasCls('expanded');
            });
        },300);
    }
});