Ext.define('Bozuko.view.winners.List' ,{
    
    extend: 'Ext.panel.Panel',
    alias : 'widget.winnerslist',
    
    requires: [
        'Bozuko.store.Winners'
    ],
    
    blinkTime : 1000 * 60 * 1,
    blinkRate : 1000,
    
    layout: {
        type        :'fit'
    },
    
    showNotifications : function(){
        
    },
    
    initComponent : function(){
        var me = this;
        me.blinkers = [];
        me.store = Ext.create('Bozuko.store.Winners');
        
        me.tbar = ['->',{
            text: 'Refresh',
            icon: '/images/icons/famfamfam/icons/arrow_refresh.png',
            handler: function(){
                if( me.store ) me.store.load();
            }
        }];
        
        // going to create a view within this panel.
        me.items = [{
            xtype: 'dataview',
            
            trackOver: true,
            
            loadMask: false,
            
            itemSelector: '.list-item',
            overItemCls : 'list-item-over',
            selectedItemCls : 'list-item-selected',
            
            emptyText: '<p>No Winners yet!</p>',
            
            autoScroll: true,
            
            store: me.store,
            tpl: new Ext.XTemplate(
                '<ul class="bozuko-list winners-list">',
                    '<tpl for=".">',
                        '<li class="list-item prize-{prize.state}">',
                            '<tpl if="!this.isContestSpecific() && !this.isPageSpecific()">',
                                '<div class="page-name">',
                                    '{page.name}',
                                '</div>',
                            '</tpl>',
                            '<tpl if="!this.isContestSpecific()">',
                                '<div class="contest-name">',
                                    '{contest.name}',
                                '</div>',
                            '</tpl>',
                            '<div class="winner-body">',
                                '<img src="{[this.getImage(values.user.image)]}" />',
                                '<div class="user-name">{user.name}</div>',
                                '<div class="prize-name">{prize.name}</div>',
                                '<div class="prize-timestamp">{[this.getFormattedDate(values.prize.timestamp)]}</div>',
                            '</div>',
                        '</li>',
                    '</tpl>',
                '</ul>',
                {
                    
                    isPageSpecific : function(){
                        return !!me.store.page_id;
                    },
                    
                    isContestSpecific : function(){
                        return !!me.store.contest_id;
                    },
                    
                    getImage: function(image){
                        if( /facebook\.com/.test(image) ){
                            image = image.replace(/type=large/, 'type=square');
                        }
                        return image;
                    },
                    
                    getFormattedDate : function(str){
                        var date = new Date();
                        date.setTime( Date.parse(str) );
                        return Ext.Date.format(date, 'm/d/Y h:i a');
                    }
                }
            ),
            
            listeners :{
                scope : me,
                refresh: me.onRefresh
            }
        }];
        
        me.callParent(arguments);
    },
    
    onRefresh : function(){
        
        var me = this,
            view = me.down('dataview'),
            blinkers = [];
        
        // lets start blinking!
        me.store.each(function(record, index){
            var blink = false,
                color = '#9effc0',
                now = new Date()
                ;
                
            switch( record.get('prize').state ){
                
                case 'redeemed':
                    var time = new Date();
                    time.setTime( Date.parse(record.get('prize').redeemed_time) );
                    var diff = +now -time;
                    if( diff > me.blinkTime ) break;
                    blink = true;
                    break;
                    
                default:
                    break;
            }
            
            
            if( !blink ) return;
            blinkers.push({
                node: view.getNode(index),
                time: time,
                color: color,
                blinking: false
            });
        });
        me.blinkers = blinkers;
        me.blink();
    },
    
    blink : function(){
        var me = this,
            now = new Date();
        
        clearTimeout( me.blinkTimeout );
        if( !me.blinkers.length ) return;
        
        var blinkers = [];
        while(me.blinkers.length){
            
            var blinker = me.blinkers.shift(),
                diff = +now -blinker.time;
                
            blinker.blinking = diff > me.blinkTime ? false : !blinker.blinking;
                
            Ext.fly(blinker.node).setStyle({
                backgroundColor: blinker.blinking ? blinker.color : ''
            });
            
            if( diff <= me.blinkTime ) blinkers.push( blinker );
            
        }
        me.blinkers = blinkers;
        if( !me.blinkers.length ) return;
        me.blinkTimeout = setTimeout(function(){
            me.blink();
        }, me.blinkRate);
    },
    
    setContest : function(contest){
        var me = this;
        me.contest = contest;
        me.store.contest_id = contest.get('_id');
        me.store.load();
    },
    
    setPage : function(page){
        var me = this;
        me.page = page;
        me.store.page_id = page.get('_id');
        me.store.load();
    }
});