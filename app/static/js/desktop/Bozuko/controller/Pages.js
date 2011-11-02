Ext.define('Bozuko.controller.Pages' ,{
    extend: 'Bozuko.lib.app.Controller',
    
    requires: [
        'Bozuko.lib.app.Controller',
        'Bozuko.lib.Util',
        'Bozuko.model.Page'
    ],
    
    views: [
        
    ],
    stores: [
        
    ],
    
    models: [
        
    ],
    
    refs : [
        
    ],
    
    init : function(){
        var me = this;
        me.control({
            'pagepanel' : {
                'render' : me.onPagePanelRender
            },
            '[ref=navigation] button[group=page]' : {
                'click' : me.changePage
            },
            '[ref=statusField]' : {
                'render' : me.onStatusFieldRender
            },
            'button[ref=updateStatus]' : {
                'click' : me.updateStatus
            },
            'pagesettings [action=save]' : {
                'click' : me.saveSettings
            },
            '[ref=help-button]' : {
                'click' : me.openHelp
            },
            'pagesettings' : {
                'save'  : function(pagesettings){
                    me.saveSettings(pagesettings.down('button[action=save]'));
                }
            },
            'pagewelcome' : {
                'welcomeloaded' : function(panel){
                    
                    var nav = panel.up('pagepanel').down('toolbar[ref=navigation]');
                    
                    // attach handlers to buttons, etc
                    panel.getEl().select('.ilink').on('click', function(e, t){
                        // open this up...
                        if( !Ext.fly(t).hasCls('ilink') ){
                            t = Ext.fly(t).up('.ilink').dom;
                        }
                        var rel = t.getAttribute('rel');
                        
                        if( rel == 'create-campaign'){
                            var btn = nav.down('button[page=campaigns]');
                            me.changePage(btn);
                            return setTimeout(function(){
                                var builder_btn = panel.up('pagepanel').down('contestspanel button[action=builder]');
                                builder_btn.fireEvent('click', builder_btn);
                            },0);
                        }
                        var btn = nav.down('button[page='+rel+']');
                        return me.changePage(btn);
                    });
                    
                    panel.getEl().select('.welcome li').addClsOnOver('hover');
                    var h = 0;
                    panel.getEl().select('.welcome li .inner')
                        .each(function(el){
                            // check for the height
                            h = Math.max(h, Ext.fly(el).getHeight());
                        })
                        .setStyle({height:h+'px'})
                        ;
                    panel.doLayout();
                }
            }
        });
    },
    
    onPagePanelRender : function(pagePanel){
        var me = this,
            page = pagePanel.page,
            btn = pagePanel.down('button[ref=updateStatus]'),
            btnText = btn.getText();
        ;
        var beforesave = function(){
            btn.setText('Updating Announcement...');
            btn.disable();
        };
        var save = function(){
            btn.setText(btnText);
            btn.enable();
            // update announcement
            pagePanel.down('[ref=statusField]').setValue( page.get('announcement') );
            pagePanel.down('pagesettings').loadRecord( page );
            pagePanel.successStatus('Page Saved');
            
            Ext.select('.page-info img').each(function(img){
                img.dom.src = page.get('image');
            });
            
        };
        page.on('beforesave', beforesave);
        page.on('save', save);
        pagePanel.on('destroy', function(){
            page.un('beforesave', beforesave);
            page.un('save', save);
        });
        
        var item = pagePanel.down('[ref=pages]').getLayout().getActiveItem();
        
        var pageBtn = pagePanel.down('[ref=navigation] button[page='+item.ref+']');
        pageBtn.on('render', pageBtn.toggle, pageBtn);
    },
    
    onStatusFieldRender : function(field){
        var me = this,
            pagePanel = field.up('pagepanel');
        field.setValue( pagePanel.page.get('announcement') );
    },
    
    updateStatus : function(btn){
        var me = this,
            pagePanel = btn.up('pagepanel'),
            page = pagePanel.page
        ;
        page.set('announcement', pagePanel.down('[ref=statusField]').getValue());
        page.save();
    },
    
    getValues : function(form, selector){
        var values = {};
        selector = selector ? selector+' field' : 'field';
        Ext.Array.each(form.query( selector ), function(field){
            var ns = field.getName().split('.'), cur = values;
            
            if( ns.length > 1 ) while( ns.length > 1 ){
                var p = ns.shift();
                if( !cur[p]) cur[p] = {};
                cur = cur[p];
            }
            
            cur[ns.shift()] = field.getValue();
        });
        return values;
    },
    
    changePage : function( btn ){
        var me = this,
            pagePanel = btn.up('pagepanel'),
            toolbar = btn.up('toolbar')
            ;
            
        toolbar.items.each(function(cmp){
            if( cmp.xtype == 'button' && cmp.pressed ) cmp.toggle();
        });
        if( !btn.pressed ) btn.toggle();
        
        var panel = pagePanel.down('[ref=pages]'),
            page = panel.down('> [ref='+btn.page+']')
            ;
        
        if( !page ) return;
        if( panel.getLayout().getActiveItem() === page ) return;
        panel.getLayout().setActiveItem( page );
        page.doComponentLayout();
    },
    
    saveSettings : function(saveBtn){
        var me = this,
            form = saveBtn.up('form'),
            values = this.getValues(form);
            
        form.record.set(values);
        form.record.commit();
        saveBtn.disable();
        form.record.save({
            callback: function(){
                // also double check that we have this
                saveBtn.enable();
            },
            failure: function(){
                alert('Error Saving Page');
            }
        });
    },
    
    openHelp : function(){
        Bozuko.lib.Util.howto();
    }
});
