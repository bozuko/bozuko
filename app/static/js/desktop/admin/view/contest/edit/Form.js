Ext.define('Bozuko.view.contest.edit.Form' ,{
    
    extend: 'Ext.panel.Panel',
    alias : 'widget.contestform',
    
    requires: [
        'Bozuko.view.contest.edit.Details',
        'Bozuko.view.contest.edit.Prizes'
    ],
    
    layout: 'border',
    border: false,
    
    initComponent : function(){
        var me = this;
        
        me.tbar = Ext.create('Ext.toolbar.Toolbar',{
            ref         :'contestform-navbar',
            cls         :'title-toolbar',
            defaults: {
                xtype: 'button',
                scale: 'medium',
                iconAlign: 'top'
            },
            items:[{
                text        :'Back',
                action      :'back',
                icon        :'/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/badge-circle-direction-left-24.png'
            },' ',{
                xtype       :'tbtext',
                ref         :'edit-label-text',
                text        :'Edit Campaign:'
            },{
                xtype       :'tbtext',
                ref         :'edit-campaign-text',
                text        :''
            }]
        });
        
        me.items = [{
            region: 'center',
            border: false,
            layout: 'card',
            activeItem: 0,
            defaults: {
                border: false
            },
            items: [{
                xtype           :'contestformdetails',
                ref             :'contest'
            },{
                xtype           :'contestformprizes',
                ref             :'prizes'
            },{
                html            :'game stuff',
                ref             :'game'
            }]
        },{
            region: 'west',
            border: false,
            width: 150,
            items: [{
                xtype: 'dataview',
                cls: 'campaign-nav',
                itemSelector: '.nav-item',
                trackOver: true,
                overItemCls: 'nav-item-over',
                selectedItemCls: 'nav-item-selected',
                allowDeselect: false,
                onContainerClick : function(){
                    return false;
                },
                store: new Ext.data.Store({
                    fields: ['type', 'text'],
                    data: [
                        {type:'contest', text:'Contest Details'},
                        {type:'prizes', text:'Prizes'},
                        {type:'game', text:'Game'}
                    ],
                    autoLoad: true
                }),
                tpl: new Ext.XTemplate(
                    '<ul class="campaignform-nav">',
                        '<tpl for=".">',
                            '<li class="nav-item {type}">',
                                '{text}',
                            '</li>',
                        '</tpl>',
                    '</ul>'
                ),
                listeners : {
                    render: function(){
                        // select the first item
                        Ext.Function.defer(this.select, 10, this, [0]);
                    }
                }
            }]
        },{
            region: 'east',
            width: 200,
            bodyPadding: 10,
            border: false,
            autoScroll: true,
            style: 'border-left: 1px solid #ccc',
            title: 'Campaign Details',
            html: 'Details of the campaign'
        }];
        
        me.bbar = ['->',{
            scale           :'medium',
            type            :'button',
            action          :'save',
            icon            :'/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/badge-circle-check-24.png',
            autoWidth       :true,
            text            :'Save'
        }];
        
        me.callParent();
    },
    
    setRecord : function(record){
        this.record = record;
        this.down('contestformprizes').bindStore( record.prizes() );
        this.down('contestformdetails').getForm().loadRecord( this.record );
        this.down('[ref=edit-campaign-text]').setText(record.get('name'));
        if( !record.get('_id') ){
            this.down('[ref=edit-label-text]').setText('Create Campaign');
        }
    }
});