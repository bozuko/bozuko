Ext.define('Bozuko.view.contest.builder.card.prize.Form', {
    extend : 'Ext.form.Panel',
    alias : 'widget.contestbuilderprizeform',
    
    initComponent : function(){
        var me = this;
        
        Ext.apply(me, {
            bodyCls         :'builder-card-body',
            layout          :'anchor',
            
            defaults        :{
                xtype           :'textfield',
                labelWidth      :160,
                anchor          :'0'
            },
            
            items: [{
                xtype               :'component',
                ref                 :'title',
                autoEl              :{tag:'h3',cls:'card-title'}
            },{
                name                :'name',
                fieldLabel          :'Prize Name',
                emptyText           :'Enter the prize name',
                allowBlank          :false,
                helpText            :[
                    "<p>",
                        "Enter the prize name. Please try to keep it as short as possible.",
                    '</p>'
                ]
            },{
                name                :'value',
                fieldLabel          :'Prize Value',
                emptyText           :'Enter the value of the prize in USD',
                allowBlank          :false,
                helpText            :[
                    "<p>",
                        "Enter the value of the prize for tracking purposes.",
                    '</p>'
                ]
            },{
                xtype               :'textarea',
                name                :'description',
                fieldLabel          :'Prize Description',
                emptyText           :'Enter the complete prize description',
                allowBlank          :false,
                helpText            :[
                    "<p>",
                        "This will be the full prize description that the user can see. You can add any ",
                        "stipulations or restrictions here.",
                    '</p>'
                ]
            },{
                xtype               :'combo',
                name                :'redemption_type',
                fieldLabel          :'Redemption Method',
                emptyText           :'Please selection the redemption method',
                editable            :false,
                forceSelection      :true,
                displayField        :'display',
                valueField          :'value',
                store               :Ext.create('Ext.data.Store',{
                    fields              :['value','display'],
                    data                :[
                        {value: 'bozuko',       display:'In Person / Security Image'},
                        {value: 'barcode',      display:'Barcode'},
                        {value: 'email',        display:'Email'}
                    ]
                }),
                helpText            :[
                    "<p>",
                        "Describe each method here.",
                    '</p>'
                ],
                listeners           :{
                    scope               :me,
                    change              :me.onRedemptionTypeChange
                }
            },{
                redemption_field    :'yes',
                redemption_group    :'all',
                xtype               :'textfield',
                name                :'instructions',
                hidden              :true,
                fieldLabel          :'Redemption Instructions',
                emptyText           :'Describe how a user will redeem this prize',
                allowBlank          :false,
                helpText            :[
                    "<p>",
                        "Describe what the user needs to do to redeem this prize. For example, ",
                        '"Show this screen to an employee."',
                    '</p>'
                ]
            },{
                redemption_field    :'yes',
                redemption_group    :'all',
                xtype               :'textfield',
                name                :'duration',
                hidden              :true,
                fieldLabel          :'Redemption Period',
                emptyText           :'Length of redemption period',
                allowBlank          :false,
                helpText            :[
                    "<p>",
                        "Enter the amount of time a player will have to redeem their prize from the time they win.",
                    '</p>'
                ]
            },{
                redemption_field    :'yes',
                redemption_group    :'barcode',
                xtype               :'textarea',
                grow                :true,
                hidden              :true,
                name                :'barcode_type',
                fieldLabel          :'Barcodes',
                emptyText           :'Please enter the barcodes (one per line)',
                allowBlank          :false,
                helpText            :[
                    "<p>",
                        "Enter the text values for your barcodes. You should have one barcode per line.",
                    '</p>'
                ]
            },{
                redemption_field    :'yes',
                redemption_group    :'email',
                xtype               :'textarea',
                grow                :true,
                hidden              :true,
                name                :'email_codes',
                fieldLabel          :'Email Codes',
                emptyText           :'Please enter the email codes (one per line)',
                allowBlank          :false,
                helpText            :[
                    "<p>",
                        "Enter each all the individual email codes. Each code should be on its own line.",
                    '</p>'
                ]
            },{
                redemption_field    :'yes',
                redemption_group    :'all',
                xtype               :'textfield',
                name                :'total',
                hidden              :true,
                fieldLabel          :'Total Prizes',
                emptyText           :'Please enter the total number of prizes',
                allowBlank          :false,
                helpText            :[
                    "<p>",
                        "Please enter the total amount of this prize that you would like to distribute.",
                    '</p>'
                ]
            },{
                redemption_field    :'yes',
                redemption_group    :'email',
                xtype               :'htmleditor',
                name                :'email_body',
                hidden              :true,
                fieldLabel          :'Email Body',
                height              :300,
                labelAlign          :'top',
                allowBlank          :false,
                helpText            :[
                    "<p>",
                        "Please enter the body of your email. The text will be processed before sending and the ",
                        "following replacements will be made:",
                    '</p>',
                    '<table cellpadding="2">',
                        '<tr><th>{code}</th><td>The code</td></tr>',
                        '<tr><th>{name}</th><td>The user\'s name.</td></tr>',
                    '</table>'
                ]
            }]
        });
        
        me.callParent(arguments);
        
        if( me.prize ){
            me.loadForm(me.prize);
        }
    },
    
    onRedemptionTypeChange : function(){
        var me = this,
            type = me.down('[name=redemption_type]').getValue();
        // show hide the corresponding fields
        Ext.each( me.query('[redemption_group=all]'), function(field){ field.show();} );
        Ext.each( me.query('[redemption_field=yes]'), function(field){
            if(field.redemption_group!=='all'){
                field.hide();
                field.disable();
            }
        });
        Ext.each( me.query('[redemption_group='+type+']'), function(field){
            field.show();
            field.enable();
        });
        me.down('[name=total]').setReadOnly(type=='bozuko'?false:true);
    },
    
    loadForm : function(prize){
        var me = this;
        me.prize = prize;
        if( prize.get('name') ) me.getForm().loadRecord(prize);
        me.down('[ref=title]').update( prize.get('name') ? 'Edit Prize' : 'Add Prize');
    },
    
    updateRecord : function(){
        var me = this;
        
        me.prize.set(me.getValues());
    },
    
    getValues : function(){
        var me = this,
            values = {};
        Ext.each( me.query('field'), function(field){
            values[field.name] = field.getValue();
        });
        return values;
    },
    
    validate : function(){
        var me = this;
        
        return me.getForm().isValid();
    }
    
});