(function(){
    
    var Bus = new Ext.util.Observable();
    
    Ext.define('Bozuko.lib.form.field.Integration', {
    
        extend              :'Ext.form.field.Display',
        alias               :'widget.integration',
        
        integrationType     :'mailchimp',
        windowWidth         :400,
        windowHeight        :560,
        
        fieldCls: Ext.baseCSSPrefix + 'form-integration-field',
        
        fieldSubTpl: [
            '<div id="{id}" class="integration {fieldCls}">',
                '<div class="{integration}">',
                    '<span class="icon"></span>',
                    '<span class="text">Not Connected</span>',
                    '<span class="button"></span>',
                    '<span class="list"></span>',
                '</div>',
            '</div>',
            {
                compiled: true,
                disableFormats: true
            }
        ],
        
        initComponent : function(){
            this.callParent(arguments);
            Bus.on(this.integrationType, this.onConnect, this);
        },
        
        onConnect : function(values){
            this.setValue( values.access_token );
            this.fireEvent('connect', this, values);
        },
        
        getSubTplData: function() {
            Ext.applyIf( this.subTplData, {
                integration: this.integrationType
            });
            return this.callParent();
        },
        
        setRawValue: function(value) {
            var me = this;
            value = value || '';
            me.value = me.rawValue = value;
            if (me.rendered) {
                if( !this.connectBtn ) this.connectBtn = Ext.create('Ext.button.Button',{
                    text: 'Connect',
                    handler : this.toggleConnect,
                    scope: this,
                    renderTo : this.getEl().down('.button')
                });
                this.getEl().down('.text').update( value=='' ? 'Not Connected' : '<span style="font-weight: bold; color:green">Connected</span>' );
                this.connectBtn.setText( value==''? 'Connect' : 'Disconnect' );
            }
            return value;
        },
        
        toggleConnect : function(){
            this[ this.getValue() == '' ? 'connect' : 'disconnect' ]();
        },
        
        connect : function(){
            return window.open('/'+this.integrationType+'/oauth', this.integrationType+'_oauth', 'width='+this.windowWidth+',height='+this.windowHeight);
        },
        
        disconnect : function(){
            this.setValue('');
            this.fireEvent('disconnect', this);
        }
        
    }, function(){
        window.integration = function(name, values){
            Bus.fireEvent(name, values);
        };
    });
})();