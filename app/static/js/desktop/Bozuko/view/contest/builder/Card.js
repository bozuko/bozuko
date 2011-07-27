Ext.define('Bozuko.view.contest.builder.Card', {
    
    alias           :'widget.contestbuildercard',
    extend          :'Ext.panel.Panel',
    
    layout          :'anchor',
    cls             :'builder-card',
    bodyCls         :'builder-card-body',
    
    border          :false,
    
    helpRegion      :'east',
    helpRegionWidth :260,
    
    autoScroll      :true,
    
    overview        :'Card Overview - override me',
    
    form            :{
        border          :false,
        xtype           :'form',
        ref             :'card-form',
        layout          :'anchor',
        defaults        :{
            xtype           :'textfield',
            anchor          :'-10',
            labelWidth      :160
        }
    },
    
    initComponent   : function(){
        var me = this;
        
        me.form.anchor = String(-1*me.helpRegionWidth);
        
        me.form.items.push({
            xtype           :'toolbar',
            ui              :'footer',
            defaults        :{
                minWidth        :80
            },
            items           :['->',{
                text            :'Next',
                style           :'margin-right: 0'
            }]
        });
        
        Ext.apply(me,{
            items : [me.form]
        });
        
        me.callParent(arguments);
        
        me.form = me.down('[ref=card-form]');
        me.form.on('resize', me.onFormResize, me);
        
        var fields = me.query('[ref=card-form] field');
        Ext.Array.each(fields, function(field){
            field.on('focus', function(field){
                me.onFieldFocus(field);
            })
        });
        
    },
    
    onFormResize : function(panel, width){
        var me = this;
        if( !me.helpPanel ) return;
        me.helpPanel.setStyle({
            left: width+'px'
        });
    },
    
    onRender : function(){
        var me = this;
        me.callParent(arguments);
        me.helpPanel = me.getEl().createChild({
            tag: 'div',
            cls: 'help-panel',
            style: {
                left: 0,
                width: me.helpRegionWidth+'px'
            },
            html: '<div class="help-text">'+me.overview+'</div>'
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