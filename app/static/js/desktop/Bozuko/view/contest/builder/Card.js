Ext.define('Bozuko.view.contest.builder.Card', {
    
    alias           :'widget.contestbuildercard',
    extend          :'Ext.panel.Panel',
    
    layout          :'anchor',
    
    border          :false,
    
    helpRegion      :'east',
    helpRegionWidth :280,
    
    autoScroll      :true,
    
    overview        :'Card Overview - override me',
    
    form            :{
        border          :false,
        layout          :'anchor',
        defaults        :{
            xtype           :'textfield',
            anchor          :'-10',
            labelWidth      :160
        },
        listeners       :{
            scope           :me,
            resize          :me.onFormResize
        }
    },
    
    initComponent   : function(){
        var me = this;
        
        me.form.anchor = String(-1*me.helpRegionWidth);
        
        Ext.apply(me,{
            items : [me.form]
        });
        
        me.callParent(arguments);
        /*
        var fields = me.query('[ref=card-form] field');
        Ext.Array.each(fields, function(field){
            field.on('focus', function(field){
                me.onFieldFocus(field);
            })
        });
        */
    },
    
    onRender : function(){
        var me = this;
        me.callParent(arguments);
        me.helpPanel = me.getEl().createChild({
            tag: 'div',
            cls: 'help-panel',
            style: {
                width: me.helpRegionWidth+'px'
            },
            html: '<div class="help-text"></div>'
        });
        me.arrow = document.createElement('div');
        me.arrow.className = 'builder-arrow';
    },
    
    onFieldFocus : function(field){
        var me = this;
        if( !me.helpPanelText ) me.helpPanelText = me.helpPanel.down('.help-text');
        var helpText = field.helpText || '';
        if( Ext.isArray(helpText) ) helpText = helpText.join('');
        helpText = '<h3>'+field.fieldLabel+'</h3>'+helpText;
        me.helpPanelText.update( helpText );
        field.getEl().dom.appendChild(me.arrow);
    }
});