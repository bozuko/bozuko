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
    
    editable: false,
    
    initComponent : function(){
        var me = this;
        if( me.contest && me.contest.get('active') ) me.name = 'Review';
        Ext.apply( me, {
            data : me.contest.data,
            tpl : new Ext.XTemplate(
                '<div class="campaign-overview">',
                    '<div class="row big-row first-row">',
                        '<div class="label">Game:</div>',
                        '<div class="content">{name}</div>',
                    '</div>',
                    '<tpl if="this.embeddable()">',
                        '<div class="row entry">',
                            '<div class="label">Embed Code:</div>',
                            '<div class="content">',
                                '<textarea style="background: #fff; padding: 4px; border: 1px solid #ccc; font-family: Courier New; display: block; width: 98%; height: 30px; font-size: 11px; ">',
                                    '{[this.getEmbedCode()]}',
                                '</textarea>',
                            '</div>',
                        '</div>',
                        '<div class="row entry">',
                            '<div class="label">Facebook Tab Url:</div>',
                            '<div class="content">',
                                '{[this.getFacebookTabUrl()]}',
                            '</div>',
                        '</div>',
                    '</tpl>',
                    '<div class="row share">',
                        '<div class="label">Share URL:</div>',
                        '<div class="content">{[this.shareUrl()]}</div>',
                    '</div>',
                    '<div class="row timeline">',
                        '<div class="label">Timeline:</div>',
                        '<div class="content">{[this.timeline()]}</div>',
                    '</div>',
                    '<tpl if="this.showContestOdds()">',
                        '<div class="row entry">',
                            '<div class="label">Contest Odds:</div>',
                            '<div class="content">{[this.contestOdds()]}</div>',
                        '</div>',
                    '</tpl>',
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
                    '<div class="row rules">',
                        '<div class="label">Official Rules:</div>',
                        '<div class="content">',
                            '<div class="rules-content">{[this.rulesLink()]}</div>',
                        '</div>',
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
                    showContestOdds : function(){
                        return me.contest.get('engine_type') !== 'time';
                    },
                    embeddable : function(){
                        return me.contest.get('web_only');
                    },
                    getEmbedCode : function(){
                        var l = window.location,
                            h = l.host.replace(/((api|site|dashboard)\.)bozuko/, 'bozuko'),
                            url = l.protocol+'//'+h+'/client/loader/?game=',
                            page = me.up('pagepanel').page;
                        
                        url += page.get('alias') || page.get('_id');
                        url += ('/' + (me.contest.get('alias') || me.contest.get('_id')));
                        
                        
                        // should we have branding here?
                        if( me.up('pagepanel').page.get('nobranding') ){
                            url+= '&nobranding=1';
                        }
                        
                        url = url.replace(/((api|site|dashboard)\.)bozuko/, 'bozuko');
                        
                        return '<script type="text/javascript" src="'+url+'"></script>';
                    },
                    getFacebookTabUrl : function(){
                        var l = window.location,
                            h = l.host.replace(/((api|site|dashboard)\.)bozuko/, 'bozuko'),
                            page = me.up('pagepanel').page,
                            url = l.protocol+'//'+h+'/facebook/tab/'+
                                (page.get('alias') || page.get('_id')) + '/' +
                                (me.contest.get('alias') || me.contest.get('_id'))
                            ;
                        return url;
                    },
                    entryMethod : function(){
                        
                        // lets get the icon
                        var img = Ext.create('Bozuko.store.EntryTypes')
                            .findRecord('type', me.contest.getEntryConfig().type)
                            .get('img');
                        
                        return [
                            '<img src="',img,'" height="50" style="float: right; margin: 0 0 0 6px;" />',
                            me.contest.getEntryType(false),
                            '<br />',
                            'Users can play every ',me.getFormattedDuration(me.contest.getEntryConfig().duration)
                        ].join('');
                    },
                    
                    rulesLink : function(){
                        var text = me.editable ? 'View / Edit Rules' : 'View Rules';
                        return '<a href="javascript:return false;" class="open-rules">'+text+'</a>';
                    },
                    
                    game : function(){
                        
                        // lets get the icon
                        var img = Ext.create('Bozuko.store.Games')
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
                    
                    shareUrl : function(){
                        var l = window.location,
                            h = l.host.replace(/((api|site|dashboard)\.)bozuko/, 'bozuko'),
                            url = l.protocol+'//'+h+'/game/'+me.contest.get('_id')+'/share'
                            ;
                        return url;
                    },
                    
                    gameOptions : function(){
                        var cfg = me.contest.get('game_config'),
                            game = me.contest.get('game');
                        if( cfg.theme ){
                            var themeName = cfg.theme.substr(0,1).toUpperCase()+cfg.theme.substr(1),
                                img = Bozuko.Router.route('/themes/'+game+'/'+cfg.theme+'/image');
                                
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
                                '<strong>',me.contest.prizes().count(),'</strong> Different Prizes<br />',
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
                                    me.contest.get('engine_type') == 'odds' ? '<div class="prize-odds">'+
                                        'Odds: '+me.contest.getPrizeOdds(i)+
                                    '</div>' : '',
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
        return d+' '+((l||'seconds').toLowerCase());
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
        setTimeout(function(){
            me.update( me.contest.data );
            var expander = me.getEl().down('.prizes .expander');
            if( expander ) expander.on('click', function(e,t){
                var ct = Ext.fly(t).up('.prizes-container');
                ct.toggleCls('expanded');
                me.prizes_expanded = ct.hasCls('expanded');
            });
            var rulesLink = me.getEl().down('.open-rules');
            if( rulesLink ) rulesLink.on('click', function(){
                me.openRules();
            });
        },10);
    },
    
    openRules : function(){
        var me = this;
        if( me.rulesWindow ){
            me.rulesWindow.focus();
            return;
        }
        var dockedItems = null;
        if( me.editable ) dockedItems = [{
            xtype: 'panel',
            border: false,
            layout: 'hbox',
            dock: 'bottom',
            bodyPadding: 10,
            items: [
                { xtype: 'component', flex: 1 },
                {
                    xtype           :'button',
                    text            :'Save',
                    icon            :'/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/badge-circle-check-16.png',
                    handler         :function(){
                        me.contest.set('rules', me.rulesWindow.down('[name=rules]').getValue());
                    }
                },
                { xtype: 'component', flex: 1 }
            ]
        }];
        
        me.rulesWindow = Ext.create('Ext.window.Window', {
            title           :'Official Rules',
            modal           :true,
            width           :600,
            height          :400,
            layout          :'fit',
            border          :false,
            items           :[{
                xtype           :'tabpanel',
                activeTab       :0,
                items           :[{
                    title           :'Official Rules',
                    ref             :'bozuko-rules',
                    autoScroll      :true,
                    bodyPadding     :10,
                    listeners       :{
                        render          :function(p){
                            setTimeout(function(){
                                var writer = me.contest.getProxy().getWriter(),
                                    data = writer.getRecordData( me.contest );
                                
                                p.setLoading(true);
                                Ext.Ajax.request({
                                    url:Bozuko.Router.route('/contest/rules'),
                                    jsonData: data,
                                    method:'post',
                                    success: function(response){
                                        p.setLoading(false);
                                        var text = response.responseText.replace(/\r?\n/g,'<br />');
                                        p.update('<div style="font-size: 12px; font-family: \'Courier New\'">'+text+'</div>');
                                    }
                                })
                            },10);
                        }
                    }
                },{
                    title           :'Customized Addendum',
                    layout          :'anchor',
                    bodyPadding     :10,
                    bodyStyle       :'border-bottom-width: 0 !important;',
                    items           :[{
                        xtype           :'textarea',
                        anchor          :'0 0',
                        readOnly        :!me.editable,
                        labelAlign      :'top',
                        fieldLabel      :'Add any custom rules or legal stipulations below. '+
                                         'They will be displayed after the Bozuko Official Rules',
                        name            :'rules',
                        value           :me.contest.get('rules')
                    }],
                    dockedItems         :dockedItems
                }]
            }],
            buttons         :[{
                text            :'Close',
                handler         :function(){
                    me.rulesWindow.close();
                }
            }],
            listeners       :{
                scope           :me,
                destroy         :function(){
                    delete this.rulesWindow;
                }
            }
        });
        
        me.rulesWindow.show();
    }
});