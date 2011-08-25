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
            layoutConfig    :{
                pack            :'center',
                align           :'middle'
            },
            height          :22,
            
            items :[{
                xtype: 'component',
                autoEl: {tag:'div'},
                html: 'One in every',
                flex: 1,
                style: 'height: auto; line-height: 18px; text-align:right;'
            },{xtype:'splitter'},{
                xtype: 'textfield',
                style:'text-align:center;',
                ref: 'value',
                width: 40
            },{xtype:'splitter'},{
                xtype: 'component',
                autoEl: {
                    tag:'div',
                    style: 'height: auto;  line-height: 18px;'
                },
                flex: 1,
                html: 'entries win.'
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