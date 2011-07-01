Ext.define('Admin.view.page.Form' ,{
    
    extend          :'Ext.form.Panel',
    alias           :'widget.pageform',
    
    autoScroll      :true,
    border          :false,

    defaults        :{
        xtype           :'fieldset',
        margin          :'10',
        layout          :'anchor',
        style           :'background-color: #f3f3f3'
    },
    
    initComponent : function(){
        var me = this;
       
        me.items = [{
            title           :'Basic Information',
            defaults        :{
                border          :false,
                anchor          :'0'
            },
            items: [{
                xtype           :'textfield',
                readOnly        :true,
                name            :'betalink',
                fieldLabel      :'Beta Link'
            },{
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
            },{
                xtype           :'textfield',
                name            :'image',
                fieldLabel      :'Image'
            },{
                xtype           :'checkbox',
                name            :'test',
                fieldLabel      :'Test page'
            },{
                xtype           :'checkbox',
                name            :'featured',
                fieldLabel      :'Featured'
            }]
        },{
            title           :'Address',
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
            defaults        :{
                anchor          :'0'
            },
            items           :[{
                xtype           :'textarea',
                height          :60,
                name            :'announcement',
                fieldLabel      :'Announcement'
            }]
        }];
        
    
        me.bbar = ['->',{
            text            :'Save',
            action          :'save',
            scale           :'medium',
            icon            :'/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/badge-circle-check-24.png'
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
        values.betalink = window.location.protocol+'//'+window.location.host+'/beta/page/'+record.get('_id');
        me.getForm().setValues(values);
    }
});