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
        
        me.on('activate', me.focusFirstField, me );
        
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
                Ext.EventManager.on( field.getWin(),'focus', function(){
                    me.onFieldFocus(field);
                });
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
    
    focusFirstField : function(){
        var me = this;
        
        var firstField = me.form.getEl().down('input,select,textarea');
        if( firstField ) firstField.focus();
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
            var parts = field.name.split('.'),
                cur = values;
            while( parts.length > 1 ){
                var key = parts.shift();
                if( !cur[key] ) cur[key] = {};
                cur = cur[key];
            }
            cur[parts.shift()] = field.getValue();
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
        setTimeout(function(){
            me.updateHelpText( me.overview );
        }, 100);
    },
    
    onFieldFocus : function(field){
        var me = this;
        
        if( field.up('duration') ) field = field.up('duration');
        if( field.up('fieldcontainer') ) field = field.up('fieldcontainer');
        
        setTimeout(function(){
            me.blurred = false;
            field.getEl().dom.appendChild(me.arrow);
            var helpText = field.helpText || '',
                label = field.helpLabel || field.fieldLabel;
            if( Ext.isArray(helpText) ) helpText = helpText.join('');
            helpText = '<h3>'+label+'</h3>'+helpText;
            me.updateHelpText( helpText );
        }, 10);
    },
    
    onFieldBlur : function(field){
        var me = this;
        me.blurred = true;
        
        setTimeout( function(){
            if( !me.blurred ) return;
            try{
                me.arrow.parentNode.removeChild( me.arrow );
            }catch(e){};
            me.updateHelpText( me.getOverview() );
        }, 500);
    },
    
    getOverview : function(){
        return this.overview;
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
            icon: '/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/arrow-left-24.png'
        });
        
        buttons.push('->');
        
        if( ~btns.indexOf('next') ) buttons.push({
            text: "Next",
            style: 'margin-right: 0',
            handler: function(){
                me.fireEvent('next', me);
            },
            icon: '/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/arrow-right-24.png'
        });
        
        if( ~btns.indexOf('finish') ) buttons.push({
            text: 'Finish',
            style: 'margin-right: 0',
            handler: function(){
                me.fireEvent('finish', me);
            },
            icon: '/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/badge-circle-check-24.png'
        });
        
        if( ~btns.indexOf('save') ) buttons.push({
            text: 'Save',
            ref: 'save',
            style: 'margin-right: 0',
            handler: function(){
                me.fireEvent('save', me);
            },
            icon: '/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/badge-circle-check-24.png'
        });
        
        if( ~btns.indexOf('save-draft') ) buttons.push({
            text: 'Save as Draft',
            ref: 'save',
            style: 'margin-right: 0',
            handler: function(){
                me.fireEvent('save', me);
            },
            icon: '/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/badge-circle-check-24.png'
        });
        
        if( ~btns.indexOf('publish') ) buttons.push({
            text: 'Publish',
            style: 'margin-right: 0',
            handler: function(){
                me.fireEvent('publish', me);
            },
            icon: '/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/badge-circle-direction-right-24.png'
        });
        
        buttons.unshift(' ');
        buttons.push(' ');
                
        me.down('[ref=nav-bar]').add(buttons);
    }
});