Ext.define('Bozuko.lib.form.field.WinFrequency', {
    extend: 'Ext.form.FieldContainer',
    alias: 'widget.winfrequencyfield',
    
    mixins: {
        field: 'Ext.form.field.Field'
    },
    
    cls : 'overallodds-field',
    
    fieldLabel : 'Overall Odds',
    
    initComponent : function(){
        var me = this;
        
        Ext.apply(me, {
            layout          :'hbox',
            height          :22,
            
            items :[{
                xtype: 'component',
                autoEl: {tag:'div'},
                html: 'One of every',
                width: 75,
                style: 'height: auto; line-height: 18px;'
            },{xtype:'splitter'},{
                xtype: 'textfield',
                ref: 'value',
                width: 30
            },{xtype:'splitter'},{
                xtype: 'component',
                autoEl: {tag:'div'},
                html: 'players win.',
                flex: 1,
                style: 'height: auto;  line-height: 18px;'
            }]
        });
        
        me.addEvents('change','keyup');
        
        me.callParent( arguments );
        me.valueField = me.down('[ref=value]');
        me.relayEvents( me.valueField, ['change','keyup'] );
        me.initField();
    },
    
    focus : function(){
        var me = this;
        me.valueField.focus();
    },
    
    setValue : function(v){
        var me = this;
        me.valueField.setValue(v);
    },
    
    getValue : function(){
        var me = this;
        return Number(me.valueField.getValue());
    }
});