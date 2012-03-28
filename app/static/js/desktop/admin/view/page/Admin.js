Ext.define('Admin.view.page.Admin' ,{
    
    extend          :'Ext.form.Panel',
    alias           :'widget.pageadmin',
    
    autoScroll      :true,
    
    initComponent : function(){
        var me = this;
        
        Ext.apply( me, {
            
            tbar : [{
                text            :'Save',
                action          :'save',
                scale           :'medium',
                icon            :'/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/badge-circle-check-24.png'
            }],
            
            bodyPadding         :10,
            layout              :'anchor',
            defaults            :{
                xtype               :'fieldset',
                anchor              :'0',
                labelWidth          :180
            },
            
            items : [{
                title           :'System',
                defaults        :{
                    anchor              :'0',
                    labelWidth          :180
                },
                items           :[{
                    xtype           :'textfield',
                    name            :'alias',
                    fieldLabel      :'Alias'
                },{
                    xtype           :'textfield',
                    name            :'image',
                    fieldLabel      :'Image'
                },{
                    xtype           :'checkbox',
                    name            :'nobranding',
                    fieldLabel      :'Remove Branding'
                },{
                    xtype           :'checkbox',
                    name            :'active',
                    fieldLabel      :'Active'
                },{
                    xtype           :'checkbox',
                    name            :'is_enterprise',
                    fieldLabel      :'Enterprise'
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
                    name            :'coords',
                    fieldLabel      :'Coordinates',
                    getValue        :function(){
                        var parts = this.getRawValue().split(',');
                        if( parts.length != 2 ) return [0,0];
                        parts.reverse();
                        parts[0] = parseFloat(parts[0]);
                        parts[1] = parseFloat(parts[1]);
                        return parts;
                    },
                    setValue        :function(v){
                        if( !v || !Ext.isArray(v) ) return;
                        var c = v.slice().reverse().join(',');
                        Ext.form.field.Text.prototype.setValue.call(this,c);
                    }
                },{
                    xtype           :'hidden',
                    name            :'location.lat',
                    getValue        :function(){
                        var v = this.up('fieldset').down('[name=coords]').getValue();
                        return ( v && Ext.isArray(v) ) ? v[1] : 0;
                    }
                },{
                    xtype           :'hidden',
                    name            :'location.lng',
                    getValue        :function(){
                        var v = this.up('fieldset').down('[name=coords]').getValue();
                        return ( v && Ext.isArray(v) ) ? v[0] : 0;
                    }
                }]
            },{
                title           :'Links',
                defaults        :{
                    anchor              :'0',
                    labelWidth          :180
                },
                items: [{
                    xtype           :'displayfield',
                    readOnly        :true,
                    name            :'sharelink',
                    fieldLabel      :'Share Link'
                },{
                    xtype           :'displayfield',
                    readOnly        :true,
                    name            :'betalink',
                    fieldLabel      :'Beta Link'
                }]
            },{
                title           :'Admins',
                items : [{
                    xtype           :'fieldcontainer',
                    anchor          :'0',
                    labelWidth      :180,
                    fieldLabel      :'Add Admin',
                    layout          :'hbox',
                    items           :[{
                        xtype           :'combo',
                        ref             :'admin-selector',
                        width           :210,
                        hideLabel       :true,
                        forceSelection  :true,
                        displayField    :'name',
                        valueField      :'_id',
                        pageSize        :25,
                        minChars        :1,
                        listConfig      :{
                            emptyText       :'No Users Found'
                        },
                        store           :Ext.create('Bozuko.store.Users',{
                            listeners       :{
                                beforeload      :function(store){
                                    store.getProxy().extraParams['exclude'] = me.page.get('admins').join(',');
                                }
                            }
                        })
                    },{xtype:'splitter', width: 10},{
                        xtype           :'button',
                        text            :'Add',
                        ref             :'add-admin',
                        icon            :'/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/badge-circle-plus-16.png',
                        listeners       :{
                            click           :function(){
                                var id = me.down('[ref=admin-selector]').getValue();
                                if( !id ) return;
                                Ext.Ajax.request({
                                    method: 'post',
                                    url : '/admin/page/'+me.page.get('_id')+'/admins/'+id,
                                    success: function(){
                                        // lets add this dude.
                                        var admins = me.page.get('admins');
                                        admins.push(id);
                                        me.page.set('admins', admins);
                                        me.down('[ref=admins]').store.load();
                                    }
                                })
                            }
                        }
                    }]
                },{
                    cls             :'admins-view',
                    xtype           :'dataview',
                    
                    ref             :'admins',
                    
                    trackOver       :true,
                    overItemCls     :'admin-hover',
                    
                    itemSelector    :'.admin',
                    
                    store           :Ext.create('Ext.data.Store',{
                        fields          :['name','image','_id'],
                        proxy           :{
                            type            :'ajax',
                            url             :'/admin/page/'+me.page.get('_id')+'/admins',
                            reader          :{
                                type            :'json',
                                idProperty      :'_id'
                            }
                        },
                        autoLoad        :true
                    }),
                    
                    itemTpl         :new Ext.XTemplate(
                        '<div class="admin">',
                            '<img src="{[values.image.replace("type=large","type=square")]}" />',
                            '<div class="name">{name}</div>',
                            '<div class="remove">X</div>',
                            '<div class="clr"></div>',
                        '</div>'
                    ),
                    
                    listeners : {
                        itemclick : function(view, record, item, index, e){
                            var el = e.getTarget('.remove');
                            if( el ){
                                // lets delete this dude
                                Ext.Msg.confirm(
                                    'Remove Admin',
                                    'Are you sure you want to remove this admin?',
                                    function(btn){
                                        if( btn != 'yes' ) return;
                                        Ext.Ajax.request({
                                            method: 'delete',
                                            url : '/admin/page/'+me.page.get('_id')+'/admins/'+record.get('_id'),
                                            success: function(){
                                                var admins = me.page.get('admins');
                                                var i = Ext.Array.indexOf(admins, record.get('_id') );
                                                if( ~i ) admins.splice(i,1);
                                                me.page.set('admins', admins);
                                                view.store.load();
                                            }
                                        })
                                    }
                                )
                            }
                        }
                    }
                }]
            }]
            
        });
        
        me.callParent( arguments );
        if( me.page ) me.loadRecord( me.page );
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
        values.sharelink = window.location.protocol+'//'+window.location.host+'/p/'+record.get('_id');
        me.getForm().setValues(values);
        
    }
    
});