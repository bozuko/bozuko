Ext.define('Bozuko.view.contest.form.Prize' ,{
    
    extend: 'Ext.form.Panel',
    alias : 'widget.contestformprize',
    
    requires: [],
    border          :false,
    autoHeight      :true,
    
    initComponent : function(){
        
        var me = this;
        
        me.items = [{
            xtype           :'fieldset',
            title           :'Prize',
            layout          :'anchor',
            style           :'background-color: #f3f3f3',
            defaults        :{
                xtype           :'textfield',
                anchor          :'0'
            },
            items           :[{
                name            :'name',
                fieldLabel      :'Name',
                allowBlank      :false
            },{
                name            :'value',
                fieldLabel      :'Value',
                allowBlank      :false
            },{
                xtype           :'textarea',
                height          :60,
                name            :'description',
                fieldLabel      :'Description',
                allowBlank      :false
            },{
                name            :'instructions',
                fieldLabel      :'Instructions',
                allowBlank      :false
            },{
                xtype           :'container',
                border          :false,
                style           :'text-align:right',
                html            :[
                    '<a class="remove-prize" href="javascript:;" style="color: red; font-weight: bold;">Remove Prize</a>'
                ].join(''),
                listeners       :{
                    afterrender     :function(){
                        this.el.down('a').on('click', function(){
                            me.fireEvent('removeprize', me.record, me);
                        });
                    }
                }
            }]
        }];
        
        me.callParent();
        
        if( me.record ) {
            me.loadRecord( record );
        }
    },
    
    updateRecord : function(){
        var v = this.getForm().getValues();
        this.record.set(v);
    }
});