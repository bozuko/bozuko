Bozuko.views.winners.List = Ext.extend(Ext.List, {
    
    itemTpl : new Ext.XTemplate(
        '<div class="winner" style="clear: both; border-bottom: 1px;">',
            '<div style="margin-bottom: .4em; font-size: .9em;">',
                '{page.name} - {contest.name}',
            '</div>',
            '<img height="60" src="{[this.getImage(values)]}" style="float: left; margin: 0 6px 0 0;" />',
            '<h4>{user.name}</h4>',
            '<h3>{prize.name}</h3>',
            '{prize.state}',
        '</div>',
        {
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
                remoteFilter: true
            })
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
                console.log(records);
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
                if( j > 0 ) me.onRefresh();
                while( me.store.getCount() > 100 ) me.store.removeAt(100);
            }
        });
    }
    
});

Ext.reg('app-winners-list', Bozuko.views.winners.List);