Ext.define('Bozuko.view.contest.Winners' ,{
    
    extend: 'Ext.panel.Panel',
    alias : 'widget.contestwinners',
    
    requires: [
        'Bozuko.store.Winners'
    ],
    
    blinkTime : 1000 * 60 * 1,
    blinkRate : 800,
    blinkCls : 'winner-blink',
    
    autoScroll: true,
    
    showNotifications : function(){
        
    },
    
    initComponent : function(){
        var me = this;
        me.blinkState = false;
        me.blinkers = [];
        me.blinking = false;
        me.store = Ext.create('Bozuko.store.Winners', {
            autoLoad: true,
            contest_id : me.contest_id || (me.contest ? me.contest.get('_id') : null),
            page_id : me.page_id || (me.page ? me.page.get('_id') : null)
        });
        
        // going to create a view within this panel.
        me.items = [{
            xtype: 'dataview',
            cls: 'bozuko-list winners-list',
            
            trackOver: true,
            overItemCls : 'x-item-over',
            
            emptyText: '<p>No Winners yet!</p>',
            
            store: me.store,
            itemTpl: new Ext.XTemplate(
                '<div class="prize-{prize.state}">',
                    '<tpl if="!this.isContestSpecific()">',
                        '<div class="contest-name">',
                            '<tpl if="this.showPageTitle()">',
                                '<strong>{page.name}</strong> - ',
                            '</tpl>',
                            '{contest.name}',
                        '</div>',
                    '</tpl>',
                    '<div class="winner-body">',
                        '<img src="{[this.getImage(values.user.image)]}" />',
                        '<div class="user-name">{[this.getUserName(values)]}</div>',
                        '<div class="prize-name">{prize.name}</div>',
                        '<div class="prize-timestamp">{[this.getFormattedDate(values.prize.timestamp)]}</div>',
                    '</div>',
                '</div>',
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
                    },
                    
                    showPageTitle : function(){
                        return !this.isPageSpecific();
                    },
                    
                    getUserName : function(values){
                        var name = values.user.name;
                        if( values.user.services ) Ext.each(values.user.services,function(service){
                            if( service.name == 'facebook' && service.data && service.data.link ){
                                name ='<a href="'+service.data.link+'" target="_blank">'+name+'</a>';
                                return false;
                            }
                            return true;
                        });
                        return name;
                    }
                }
            ),
            
            listeners :{
                scope : me,
                refresh: me.onRefresh,
                itemadd: me.refresh,
                itemupdate: me.refresh,
                itemremove: me.refresh
            }
        }];
        
        me.callParent(arguments);
    },
    
    refresh : function(){
         this.down('dataview').refresh();
    },
    
    onRefresh : function(){
        
        var me = this,
            view = me.down('dataview'),
            blinkers = [];
        
        // lets start blinking!
        me.store.each(function(record, index){
            var blink = false,
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
                blinking: false
            });
        });
        me.blinkers = blinkers;
        if( !me.blinking ) me.blink();
    },
    
    blink : function(){
        var me = this,
            now = new Date();
        
        clearTimeout( me.blinkTimeout );
        if( !me.blinkers.length ) return;
        
        me.blinkState = !me.blinkState;
        
        var blinkers = [];
        while(me.blinkers.length){
            
            var blinker = me.blinkers.shift(),
                diff = +now -blinker.time;
                
            blinker.blinking = diff < me.blinkTime;
                
            var fn = blinker.blinking && me.blinkState ? 'addCls' : 'removeCls';
            Ext.fly(blinker.node)[fn](me.blinkCls);
            
            if( blinker.blinking ) blinkers.push( blinker );
            
        }
        me.blinkers = blinkers;
        if( !me.blinkers.length ){
            me.blinking = false;
            return;
        }
        me.blinking = true;
        me.blinkTimeout = setTimeout(function(){
            me.blink();
        }, me.blinkRate);
    },
    
    setContest : function(contest){
        var me = this;
        me.contest = contest;
        me.store.contest_id = contest.get('_id');
        me.tmpStore.contest_id = contest.get('_id');
        me.store.load();
    },
    
    setPage : function(page){
        var me = this;
        me.page = page;
        me.store.page_id = page.get('_id');
        me.tmpStore.page_id = page.get('_id');
        me.store.load();
    }
});