Ext.define('Beta.view.page.Settings' ,{
    
    extend          :'Ext.form.Panel',
    alias           :'widget.pagesettings',
    
    requires        :[
        'Beta.view.page.Preview'
    ],
    
    autoScroll      :true,
    layout          :'border',

    initComponent : function(){
        var me = this;
       
        Ext.apply(me, {
            items : [{
                region          :'center',
                border          :false,
                layout          :'anchor',
                autoScroll      :true,
                style           :'border-right: 1px solid #ccc;',
                defaults        :{
                    xtype           :'fieldset',
                    margin          :'10',
                    layout          :'anchor',
                    style           :'background-color: #f3f3f3'
                },
                tbar : [' ', {
                    text            :'Save',
                    action          :'save',
                    scale           :'medium',
                    icon            :'/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/badge-circle-check-24.png'
                }],
                items:[{
                    title           :'Basic Information',
                    defaults        :{
                        border          :false,
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
                }]
            },{
                region          :'east',
                title           :'Page Preview',
                xtype           :'pagepreview',
                border          :false,
                autoScroll      :true
                
            }]
        });
        me.callParent();
        if( me.record ){
            me.loadRecord( me.record );
        }
        var pp = me.down('pagepreview');
        me.on('activate', pp.fixImage, pp);
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
        
        me.down('pagepreview').loadRecord( record );
    }
});