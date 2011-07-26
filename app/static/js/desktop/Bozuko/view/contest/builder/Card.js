Ext.define('Bozuko.view.contest.builder.Card', {
    
    alias           :'widget.contestbuildercard',
    extend          :'Ext.panel.Panel',
    
    layout          :'border',
    
    helpRegion      :'east',
    helpRegionWidth :280,
    overview        :'Card Overview - override me',
    
    form            :{
        ref             :'card-form',
        region          :'center',
        xtype           :'panel',
        layout          :'anchor',
        autoScroll      :true,
        cls             :'card-form',
        defaults        :{
            xtype           :'textfield',
            anchor          :'-10',
            labelWidth      :160
        }
    },
    
    initComponent   : function(){
        var me = this;
        
        Ext.apply(me, {
            
            border          :false,
            
            defaults        :{
                border          :false
            },
            
            items : [{
                ref             :'help-panel',
                cls             :'help-panel',
                xtype           :'panel',
                layout          :'fit',
                bodyPadding     :10,
                region          :me.helpRegion,
                width           :me.helpRegionWidth,
                html            :'<div class="help-text">'+me.overview+'</div>'
            },me.form]
        });
        
        me.callParent(arguments);
        var fields = me.query('[ref=card-form] field');
        Ext.Array.each(fields, function(field){
            field.on('focus', function(field){
                me.onFieldFocus(field);
            })
        });
    },
    
    onRender : function(){
        var me = this;
        me.callParent(arguments);
        me.arrow = document.createElement('div');
        me.arrow.className = 'builder-arrow';
    },
    
    onFieldFocus : function(field){
        var me = this;
        if( !me.helpPanelText ) me.helpPanelText = me.down('[ref=help-panel]').getEl().down('.help-text');
        var helpText = field.helpText || '';
        if( Ext.isArray(helpText) ) helpText = helpText.join('');
        helpText = '<h3>'+field.fieldLabel+'</h3>'+helpText;
        me.helpPanelText.update( helpText );
        field.getEl().dom.appendChild(me.arrow);
    }
});