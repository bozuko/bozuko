Ext.define('Bozuko.view.contest.edit.Prizes' ,{
    
    extend: 'Ext.panel.Panel',
    alias : 'widget.contestformprizes',
    
    requires: [
        'Bozuko.view.contest.edit.Prize'
    ],
    autoScroll: true,
    
    initComponent : function(){
        
        var me = this;
        
        // lets get the prizes
        me.items = [];
        
        if( me.store ) me.updateForms();
        me.callParent();
        
        me.on('activate', me.doLayout, me);
    },
    
    bindStore : function(store){
        this.store = store;
        this.removeAll();
        this.updateForms();
    },
    
    updateForms : function(){
        var me = this;
        
        if( !me.store ) return;
        
        me.addBtn = me.add({
            xtype           :'button',
            scale           :'medium',
            text            :'Add Prize',
            icon            :'/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/badge-circle-plus-24.png',
            handler         :me.createPrize,
            scope           :me
        });
        
        me.store.each( me.addPrize, me );
        me.doLayout();
    },
    
    createPrize : function(){
        var me = this,
            prize = Ext.create('Bozuko.model.Prize');
            
        me.store.add( prize );
        me.addPrize( prize );
        
        me.doLayout();
    },
    
    addPrize : function(prize){
        var me = this,
            index = me.items.indexOf(me.addBtn),
            form = me.insert( index, {
            xtype           :'contestformprize',
            border          :false,
            listeners       :{
                removeprize     :me.onRemovePrize,
                scope           :me
            }
        });
        
        form.record = prize;
        form.loadRecord(prize);
    },
    
    onRemovePrize : function( prize, cmp ){
        var me = this;
        Ext.Msg.confirm('Remove Prize', 'Are you sure you would like to remove this prize?', function(btnId){
            if( btnId != 'yes') return;
            me.remove(cmp);
            // also delete the prize from our store
            me.store.remove( prize );
        });
        me.doLayout();
    },
    
    updateRecords : function(){
        Ext.Array.each(this.query('contestformprize'), function(prize){
            prize.updateRecord();
        });
    }
});