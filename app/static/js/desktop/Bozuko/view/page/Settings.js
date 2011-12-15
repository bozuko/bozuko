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
                        },{
                            xtype          :'displayfield',
                            name           :'pin',
                            fieldLabel     :'PIN',
                            editable       :false
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
                    title           :'Security Image',
                    items           :[{
                        xtype           :'dataview',
                        ref             :'security-image-view',

                        trackOver       :true,
                        singleSelect    :true,

                        itemSelector    :'.item',
                        overItemCls     :'item-over',
                        selectedItemCls :'item-selected',

                        tpl             :new Ext.XTemplate(
                            '<div class="security-images">',
                                '<div class="scroller">',
                                    '<tpl for=".">',
                                        '<div class="item" style="left: {[(xindex-1)*75]}px">',
                                            '<img src="{signedUrl}" />',
                                        '</div>',
                                    '</tpl>',
                                '</div>',
                            '</div>'
                        ),
                        store           :Ext.create('Ext.data.Store', {
                            fields : ['signedUrl', 'path'],
                            proxy : {
                                type: 'rest',
                                url: Bozuko.Router.route('/security/images'),
                                reader : {
                                    type: 'json',
                                    root: 'items'
                                }
                            },
                            autoLoad : true
                        }),
                        listeners : {
                            beforecontainerclick : function(view, e){
                                return false;
                            },
                            selectionchange : function(view, selections){
                                if( selections && selections.length ){
                                    me.record.set('security_img', selections[0].get('path') );
                                }
                            },
                            refresh : function(view){
                                // select and scroll to the right place
                                var r = view.store.findRecord('path', me.record.get('security_img') || 'security/sun.png' );
                                if( r ){
                                    view.select(r);
                                }
                            }
                        }
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
        me.on('activate', me.onActivate, me);
    },

    onActivate : function(){
        var me  = this,
            pp = me.down('pagepreview'),
            view = me.down('[ref=security-image-view]'),
            nodes = view.getSelectedNodes();

        if( !nodes || !nodes.length ) return;
        var node = Ext.get(nodes[0]),
            scroller = Ext.fly(node).up('.scroller'),
            left = node.getLeft(true),
            width = scroller.getWidth();

        scroller.scrollTo('l',left-(width/2)+35);
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
                                             '<br /><br /><span style="font-size:11px; color: #666;">The image should be at least 150px x 150px.</span><br />'
                        },{
                            xtype           :'filefield',
                            name            :'image',
                            hideLabel       :true,
                            buttonText      :'Select Image...'
                        }]
                    }]
                }],

                buttonAlign: 'left',

                buttons: [{
                    text            :'Use Facebook Picture',
                    handler         :function(){
                        var fb_url = 'https://graph.facebook.com/'+me.record.service('facebook').sid+'/picture?type=large';
                        if( me.down('[name=image]') ){
                            me.down('[name=image]').setValue( fb_url );
                        }
                        me.record.set('image', fb_url);
                        me.fireEvent('save', me);
                        me._imageDialog.close();
                    }
                },'->',{
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
                        });
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
