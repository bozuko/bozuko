Ext.define('Bozuko.view.page.Form' ,{
    
    extend          :'Ext.form.Panel',
    alias           :'widget.pageform',
    
    layout          :'fit',
    
    initComponent : function(){
        var me = this;
       
        me.items = [{
            xtype           :'tabpanel',
            activeTab       :0,
            plain           :true,
            defaults        :{
                autoScroll      :true,
                bodyPadding     :10
            },
            items:[{
                title           :'Basic Information',
                layout          :'anchor',
                bodyStyle           :'border-right-width: 0',
                border          :false,
                defaults        :{
                    border          :false,
                    anchor          :'0'
                },
                dockedItems :[{
                    width           :60,
                    dock            :'right',
                    xtype           :'panel',
                    border          :false,
                    ref             :'image',
                    bodyStyle       :'text-align: center; padding: 10px 10px 0 0;',
                    tpl             :[
                        '<tpl if="image"><img src="{image}&type=square" height="50" /></tpl>'
                    ]
                }],
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
                    xtype           :'textfield',
                    name            :'location.street',
                    fieldLabel      :'Street'
                },{
                    xtype           :'textfield',
                    name            :'location.city',
                    fieldLabel      :'City'
                },{
                    xtype           :'textfield',
                    name            :'location.state',
                    fieldLabel      :'State'
                },{
                    xtype           :'textfield',
                    name            :'location.zip',
                    fieldLabel      :'Zip'
                }]
            },{
                title           :'Business',
                layout          :'anchor',
                defaults        :{
                    anchor          :'0'
                },
                items           :[{
                    xtype           :'textarea',
                    height          :60,
                    name            :'announcement',
                    fieldLabel      :'Announcement'
                }]
            }]
        }];
        
    
        me.buttons = [{
            text            :'Save',
            action          :'save'
        }];
        me.callParent();
    },
    
    loadRecord : function( record ){
        var me = this;
        
        me.callParent(arguments );
        // lets fill out the sub stuff too
        me.record = record;
        
        var location = record.get('location');
        var values = {};
        if( location ) Ext.Object.each( location, function(key, value){
            values['location.'+key] = value;
        });
        me.getForm().setValues(values);
        
        me.down('panel[ref=image]').update(record.data);
    }
});