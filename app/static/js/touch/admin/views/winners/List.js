Bozuko.views.winners.List = Ext.extend(Ext.List, {
    
    cls : 'winners-list',
    blinkCls: 'winner-blink',
    blinkTime: 1000 * 60,
    blinkRate: 600,
    disableSelection: true,
    
    itemTpl : new Ext.XTemplate(
        '<div class="winner prize-{prize.state}" style="clear: both; border-bottom: 1px;">',
            '<div style="margin-bottom: .4em; font-size: .9em;">',
                '{page.name} - {contest.name}',
            '</div>',
            '<img height="60" src="{[this.getImage(values)]}" style="float: left; margin: 0 6px 0 0;" />',
            '<h4>{user.name}</h4>',
            '<h3>{prize.name}</h3>',
            '<div class="date">',
                '<span class="title {[values.prize.redeemed ? "redeemed" : "expires"]}">',
                    '{[values.prize.redeemed ? "Redeemed" : "Expires"]}:',
                '</span> {[this.getDate(values)]}',
            '</div>',
        '</div>',
        {
            getDate : function(data){
                var time = new Date();
                if( data.prize.state == 'redeemed' ){
                    time.setTime( Date.parse(data.prize.redeemed_time) );
                }
                else{
                    time.setTime( Date.parse(data.prize.expires) );
                }
                return time.format('m/d/Y h:i a');
            },
            getImage : function(data){
                return data.user.image.replace(/type=large/, 'type=square');
            }
        }
    ),
    
    initComponent : function(){
        Ext.applyIf(this, {
            store: new Ext.data.Store({
                model: "Winner",
                autoLoad: true,
                remoteFilter: true,
                listeners: {
                    scope: this,
                    load: this.onRefresh
                }
            }),
            blinkState : true
        });
        this.tmpStore = new Ext.data.Store({
            model: "Winner",
            autoLoad: false,
            remoteFilter: true
        });
        Bozuko.views.winners.List.superclass.initComponent.apply(this, arguments);
    },
    
    updateStore : function(){
        var me = this;
        
        me.tmpStore.load({
            scope : me,
            callback : function(records){
                var j =0;
                Ext.Array.each( records, function(record, i){
                    var r = me.store.getById( record.getId() );
                    if( r ){
                        r.set( record.data );
                        r.commit();
                    }
                    else{
                        me.store.insert(j++, record);
                    }
                });
                me.onRefresh();
                while( me.store.getCount() > 100 ) me.store.removeAt(100);
            }
        });
    },
    
    onRefresh : function(){
        
        var me = this,
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
            var blinker = {
                node: me.getNode(index),
                time: time,
                blinking: false
            };
            blinkers.push(blinker);
        });
        me.blinkers = blinkers;
        me.blink();
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
            me.blinkState = false;
            return;
        }
        me.blinkTimeout = setTimeout(function(){
            me.blink();
        }, me.blinkRate);
    },
    
});

Ext.reg('app-winners-list', Bozuko.views.winners.List);