Ext.define('Bozuko.view.page.Form' ,{
    
    extend          :'Ext.form.Panel',
    alias           :'widget.pageform',
    
    layout          :'fit',
    
    initComponent : function(){
        
       
        this.items = [{
            xtype           :'tabpanel',
            activeTab       :0,
            defaults        :{
                autoScroll      :true,
                bodyPadding     :10,
                border          :false
            },
            items:[{
                title           :'Basic Information',
                layout          :'anchor',
                defaults        :{
                    anchor          :'0'
                },
                items: [{
                    xtype           :'textfield',
                    name            :'name',
                    fieldLabel      :'Name'
                },{
                    xtype           :'textfield',
                    name            :'category',
                    fieldLabel      :'Category'
                },{
                    xtype           :'textfield',
                    name            :'website',
                    fieldLabel      :'Website'
                }]
            },{
                title           :'Address',
                layout          :'anchor',
                defaults        :{
                    anchor          :'0'
                },
                items           :[{
                    anchor          :'0',
                    xtype           :'textfield',
                    name            :'location.street',
                    fieldLabel      :'Street'
                },{
                    anchor          :'0',
                    xtype           :'textfield',
                    name            :'location.city',
                    fieldLabel      :'City'
                },{
                    anchor          :'0',
                    xtype           :'textfield',
                    name            :'location.state',
                    fieldLabel      :'State'
                },{
                    anchor          :'0',
                    xtype           :'textfield',
                    name            :'location.zip',
                    fieldLabel      :'Zip'
                }]
            }]
        }];
        
    
        this.buttons = [{
            text            :'Save',
            action          :'save'
        }];
        this.callParent();
    },
    
    loadRecord : function( record ){
        
        this.callParent(arguments );
        // lets fill out the sub stuff too
        this.record = record;
        
        var location = record.get('location');
        var values = {};
        if( location ) Ext.Object.each( location, function(key, value){
            values['location.'+key] = value;
        });
        this.getForm().setValues(values);
    }
});