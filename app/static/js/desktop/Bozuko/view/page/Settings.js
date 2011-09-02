Ext.define('Bozuko.view.page.Settings' ,{
    
    extend          :'Ext.form.Panel',
    alias           :'widget.pagesettings',
    
    requires        :[
        'Bozuko.view.page.Preview'
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
                tbar : [{
                    text            :'Save',
                    action          :'save',
                    scale           :'medium',
                    icon            :'/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/badge-circle-check-24.png'
                }],
                items:[{
                    title           :'Basic Information',
                    layout          :'hbox',
                    
                    items: [{
                        xtype           :'container',
                        border          :false,
                        autoHeight      :true,
                        layout          :'anchor',
                        flex            :1,
                        defaults        :{
                            border          :false,
                            anchor          :'0'
                        },
                        items:[{
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
                        }]
                    },{xtype:'splitter', width:10},{
                        xtype           :'container',
                        ref             :'profile-pic-ct',
                        border          :false,
                        fieldLabel      :'Profile Image',
                        layout          :{
                            type            :'vbox',
                            align           :'center'
                        },
                        autoHeight      :true,
                        labelAlign      :'top',
                        width           :100,
                        height          :90,
                        items : [{
                            xtype           :'component',
                            ref             :'profile-pic',
                            tpl             :new Ext.XTemplate(
                                '<img src="{[this.image(values.image)]}" height="60" />',
                                {
                                    image:function(value){
                                        return value.replace(/type=large/,'type=square');
                                    }
                                }
                            )
                        },{
                            xtype           :'button',
                            text            :'Change Image',
                            handler         :me.openImageDialog,
                            scope           :me
                        }]
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
        if( !Bozuko.beta ){
            me.items[0].items.push({
                title           :'Administration',
                defaults        :{
                    anchor          :'0'
                },
                items           :[{
                    xtype           :'textfield',
                    name            :'image',
                    fieldLabel      :'Image'
                },{
                    xtype           :'checkbox',
                    name            :'active',
                    fieldLabel      :'Active'
                },{
                    xtype           :'checkbox',
                    name            :'test',
                    fieldLabel      :'Test page'
                },{
                    xtype           :'checkbox',
                    name            :'featured',
                    fieldLabel      :'Featured'
                },{
                    xtype           :'textfield',
                    readOnly        :true,
                    name            :'sharelink',
                    fieldLabel      :'Share Link'
                },{
                    xtype           :'textfield',
                    readOnly        :true,
                    name            :'betalink',
                    fieldLabel      :'Beta Link'
                }]
            });
        }
        me.callParent(arguments);
        if( me.record ){
            me.loadRecord( me.record );
            
            var fixProfilePic = Ext.Function.createBuffered(function(){
                me.down('[ref=profile-pic-ct]').doLayout();
                me.down('[ref=profile-pic-ct]').doComponentLayout();
            },200);
            
            me.record.on('save', fixProfilePic);
            me.on('destroy', function(){
                me.record.un('save', fixProfilePic);
            });
        }
        var pp = me.down('pagepreview');
        me.on('activate', pp.fixImage, pp);
    },
    
    openImageDialog : function(){
        var me = this;
        if( !me._imageDialog ){
            me._imageDialog = Ext.create('Ext.window.Window',{
                title           :'Change Profile Picture',
                layout          :'fit',
                width           :450,
                modal           :true,
                autoHeight      :true,
                items           :[{
                    xtype           :'form',
                    layout          :'hbox',
                    url             :Bozuko.Router.route('/page/image?'+Date.now()),
                    baseParams      :{
                        page_id         :me.record.get('_id')
                    },
                    autoHeight      :true,
                    bodyPadding     :10,
                    border          :false,
                    items           :[{
                        xtype           :'component',
                        width           :100,
                        tpl             :new Ext.XTemplate(
                            '<img src="{[this.image(values.image)]}" height="70" />',
                            {
                                image:function(value){
                                    return value.replace(/type=large/,'type=square');
                                }
                            }
                        ),
                        data            :me.record.data
                    },{
                        xtype           :'container',
                        flex            :1,
                        autoHeight      :true,
                        border          :false,
                        layout          :'anchor',
                        defaults        :{anchor: '0'},
                        items :[{
                            xtype           :'component',
                            html            :'Please choose a new profile image from your computer and then hit "Upload". '+
                                             '<br /><br /><span style="font-size:11px; color: #666;">The image should be 100px x 100px.</span><br />'
                        },{
                            xtype           :'filefield',
                            name            :'image',
                            hideLabel       :true,
                            buttonText      :'Select Image...'
                        }]
                    }]
                }],
                
                buttons: [{
                    text            :'Cancel',
                    handler         :function(){
                        me._imageDialog.close();
                    }
                },{
                    text            :'Upload',
                    handler         :function(){
                        me._imageDialog.setLoading('Uploading...');
                        me._imageDialog.down('form').submit({
                            success : function(form, action){
                                me._imageDialog.setLoading(false);
                                // do something..
                                // me._imageDialog.close();
                                me.record.set('image', action.result.url);
                                if( me.down('[name=image]') ){
                                    me.down('[name=image]').setValue( action.result.url );
                                }
                                me.fireEvent('save', me);
                                me._imageDialog.close();
                            },
                            failure : function(form, action){
                                me._imageDialog.setLoading(false);
                                alert(action.result.err);
                            }
                        })
                    }
                }],
                
                listeners : {
                    destroy         :function(){
                        delete me._imageDialog;
                    }
                }
            });
        }
        me._imageDialog.show();
    },
    
    loadRecord : function( record ){
        var me = this;
        
        me.callParent(arguments );
        // lets fill out the sub stuff too
        me.record = record;
        me.down('[ref=profile-pic]').update(me.record.data);
        
        var location = record.get('location');
        var values = {};
        if( location ) Ext.Object.each( location, function(key, value){
            values['location.'+key] = value;
        });
        values.betalink = window.location.protocol+'//'+window.location.host+'/beta/page/'+record.get('_id');
        values.sharelink = window.location.protocol+'//'+window.location.host+'/p/'+record.get('_id');
        me.getForm().setValues(values);
        
        me.down('pagepreview').loadRecord( record );
    }
});