Ext.define('Beta.controller.Pages' ,{
    extend: 'Bozuko.lib.app.Controller',
    
    views: [
        
    ],
    stores: [
        
    ],
    
    models: [
        'Bozuko.model.Page'
    ],
    
    refs : [
        {ref: 'statusField', selector: '[ref=statusField]'},
        {ref: 'updateStatusButton', selector: '[ref=updateStatus]'},
        {ref: 'pagesPanel', selector: '[ref=pages]'}
    ],
    
    init : function(){
        window.pageController = this;
        var me = this;
        me.control({
            '[ref=navigation] button' : {
                'click' : me.changePage
            },
            '[ref=statusField]' : {
                'render' : me.onStatusFieldRender
            },
            'button[ref=updateStatus]' : {
                'click' : me.updateStatus
            }
        });
    },
    
    onLaunch: function(){
        var me = this,
            page = me.application.page,
            btn = me.getUpdateStatusButton(),
            btnText = btn.getText();
        ;
        
        page.on('beforesave', function(){
            btn.setText('Updating Announcement...');
            btn.disable();
        });
        page.on('save', function(){
            btn.setText(btnText);
            btn.enable();
        });
    },
    
    onStatusFieldRender : function(field){
        var me = this;
        field.setValue( me.application.page.get('announcement') );
    },
    
    updateStatus : function(){
        var me = this,
            page = me.application.page
        ;
        page.set('announcement', me.getStatusField().getValue());
        page.save();
    },
    
    changePage : function( btn ){
        var me = this,
            toolbar = btn.up('toolbar')
            ;
        toolbar.items.each(function(cmp){
            if( cmp.xtype == 'button' && cmp.pressed ) cmp.toggle();
        });
        if( !btn.pressed ) btn.toggle();
        
        var panel = me.getPagesPanel(),
            page = panel.down('> [ref='+btn.page+']')
            ;
        
        if( !page ) return;
        if( panel.getLayout().getActiveItem() === page ) return;
        panel.getLayout().setActiveItem( page );
        page.doComponentLayout();
    }
});
