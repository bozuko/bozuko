Ext.define( 'Admin.view.theme.Window', {
    
    extend          :'Ext.window.Window',
    alias           :'widget.themewindow',
    
    requires        :['Ext.form.Panel'],
    
    layout          :'fit',
    modal           :true,
    width           :500,
    
    initComponent : function(){
        var me = this;
        
        me.items = [{
            border          :false,
            xtype           :'form',
            autoScroll      :true,
            bodyPadding     :10,
            items           :[{
                xtype           :'hidden',
                name            :'_id'
            },{
                xtype           :'textfield',
                anchor          :'0',
                name            :'name',
                allowBlank      :false,
                fieldLabel      :'Name'
            },{
                xtype           :'textfield',
                anchor          :'0',
                name            :'background',
                allowBlank      :false,
                fieldLabel      :'Background'
            }]
        }];
        
        me.buttons = [{
            text            :'Save',
            ref             :'savebtn'
        },{
            text            :'Cancel',
            ref             :'cancelbtn'
        }];
        
        me.callParent();
        
        if( this.theme ){
            me.down('form').getForm().loadRecord(this.theme);
        }
    }
    
});