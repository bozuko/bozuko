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
        Bozuko.views.winners.List.superclass.initComponent.apply(this, arguments);
    }
    
});

Ext.reg('app-winners-list', Bozuko.views.winners.List);