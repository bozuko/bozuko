Ext.define('Bozuko.view.contest.builder.Card', {
    
    alias           :'widget.contestbuildercard',
    extend          :'Ext.panel.Panel',
    
    layout          :'border',
    cls             :'builder-card',
    
    border          :false,
    
    helpRegion      :'west',
    helpRegionWidth :210,
    
    autoScroll      :true,
    
    name            :'Builder Card',
    overview        :'Card Overview',
    
    constructor : function(){
        this.form = {
            region          :'center',
            border          :false,
            autoScroll      :true,
            xtype           :'form',
            ref             :'card-form',
            layout          :'anchor',
            cls             :'builder-card',
            bodyCls         :'builder-card-body',
            defaults        :{
                xtype           :'textfield',
                labelWidth      :160,
                anchor          :'0'
            },
            dockedItems     :[{
                ref             :'nav-bar',
                dock            :'bottom',
                xtype           :'toolbar',
                cls             :'x-toolbar card-nav-toolbar',
                defaults        :{
                    scale           :'medium'
                }
            }]
        };
        this.callParent(arguments);
    },
    
    initComponent   : function(){
        var me = this;
        
        Ext.apply(me,{
            defaults: {
                border          :false
            },
            items : [me.form,{
                xtype           :'panel',
                ref             :'help-panel',
                region          :me.helpRegion,
                width           :me.helpRegionWidth,
                cls             :'help-panel'
            }]
        });
        
        me.callParent(arguments);
        
        me.form = me.down('[ref=card-form]');
        
        var fields = me.query('[ref=card-form] field');
        Ext.Array.each(fields, function(field){
            
            field.on('focus', function(field){
                me.onFieldFocus(field);
            });
            field.on('blur', function(field){
                me.onFieldBlur(field);
            });
            field.on({
                scope           :me,
                blur            :me.updateRecord,
                select          :me.updateRecord
            });
        });
        
        Ext.Array.each(me.query('[ref=card-form] htmleditor'), function(field){
            field.on('activate', function(field){
                me.onFieldFocus(field);
            });
            field.on('deactivate', function(field){
                me.onFieldBlur(field);
            });
            field.on({
                scope           :me,
                change          :me.updateRecord
            });
        });
        
        if( me.intro ){
            me.form.insert(0, {
                xtype           :'component',
                autoEl          :{
                    tag             :'div',
                    cls             :'intro'
                },
                html            :(Ext.isArray(me.intro)?me.intro.join(''):me.intro)
            });
        }
        
        me.loadContest();
    },
    
    updateRecord : function(){
        var me = this;
        me.contest.set(me.getValues());
    },
    
    loadContest : function(){
        var me = this;
        me.form.loadRecord( me.contest );
    },
    
    getValues : function(){
        var me = this,
            values = {};
        Ext.each( me.form.query('field'), function(field){
            values[field.name] = field.getValue();
        });
        return values;
    },
    
    /**
     * Template function
     */
    validate : function(){
        return this.form.getForm().isValid();
    },
    
    onRender : function(){
        var me = this;
        me.callParent(arguments);
        me.helpPanel = me.down('[ref=help-panel]');
        me.arrow = document.createElement('div');
        me.arrow.className = 'builder-arrow';
        me.updateHelpText( me.overview );
    },
    
    onFieldFocus : function(field){
        var me = this;
        setTimeout(function(){
            me.blurred = false;
            field.getEl().dom.appendChild(me.arrow);
            var helpText = field.helpText || '';
            if( Ext.isArray(helpText) ) helpText = helpText.join('');
            helpText = '<h3>'+field.fieldLabel+'</h3>'+helpText;
            me.updateHelpText( helpText );
        }, 10);
        
        
    },
    
    onFieldBlur : function(field){
        var me = this;
        me.blurred = true;
        setTimeout( function(){
            if( !me.blurred ) return;
            me.arrow.parentNode.removeChild( me.arrow );
            me.updateHelpText( me.overview );
        }, 500);
    },
    
    updateHelpText : function(html){
        var me = this;
        if( Ext.isArray(html) ) html = html.join('');
        me.helpPanel.update( '<div class="help-text">'+html+'</div>' );
    },
    
    addNavigationButtons : function(btns){
        var me = this;
        var buttons = [];
        
        if( ~btns.indexOf('back') ) buttons.push({
            text: 'Back',
            handler: function(){
                me.fireEvent('back', me);
            },
            icon: '/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/badge-circle-direction-left-24.png'
        });
        
        buttons.push('->');
        
        if( ~btns.indexOf('next') ) buttons.push({
            text: "Next",
            style: 'margin-right: 0',
            handler: function(){
                me.fireEvent('next', me);
            },
            icon: '/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/badge-circle-direction-right-24.png'
        });
        
        if( ~btns.indexOf('finish') ) buttons.push({
            text: 'Finish',
            style: 'margin-right: 0',
            handler: function(){
                me.fireEvent('finish', me);
            },
            icon: '/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/badge-circle-check-24.png'
        });
        buttons.unshift(' ');
        buttons.push(' ');
                
        me.down('[ref=nav-bar]').add(buttons);
    }
});