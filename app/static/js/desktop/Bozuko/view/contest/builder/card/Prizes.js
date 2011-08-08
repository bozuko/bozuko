Ext.define('Bozuko.view.contest.builder.card.Prizes', {
    
    extend          :'Bozuko.view.contest.builder.Card',
    alias           :'widget.contestbuilderprizes',
    
    requires : [
        'Bozuko.view.contest.builder.card.prize.Form'
    ],
    
    name            :"Prizes",
    overview        :[
        "<p>Add your prizes</p>"
    ],
    
    initComponent : function(){
        var me = this;
        me.prizes = me.contest.prizes();
        
        Ext.apply( me.form, {
            
            layout      :'card',
            
            activeItem  : me.prizes.getCount() ? 0 : 1,
            
            defaults :{
                border          :false,
                bodyStyle       :'background-color: transparent'
            },
            
            listeners : {
                
            },
            
            items : [{
                xtype           :'panel',
                items :[{
                    xtype           :'dataview',
                
                    cls             :'select-list prize-list',
                    
                    emptyText       :'<p>No Prizes</p>',
                    
                    disableSelection:true,
                    
                    itemTpl         :new Ext.XTemplate(
                        '<div class="prize">',
                            '<div class="name">{name}</div>',
                        '</div>'
                    ),
                    
                    store : me.prizes
                }]
            },{
                xtype : 'contestbuilderprizeform'
            }]
        });
        
        me.callParent(arguments);
        me.dataview = me.down('dataview');
    }
});