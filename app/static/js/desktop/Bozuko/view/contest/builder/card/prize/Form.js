Ext.define('Bozuko.view.contest.builder.card.prize.Form', {
    extend : 'Ext.form.Panel',
    alias : 'widget.contestbuilderprizeform',
    
    cls : 'builder-prize-form',
    bodyCls : 'builder-prize-form-body',
    
    requires: [
        'Bozuko.lib.form.field.Duration',
        'Bozuko.lib.form.field.Codes'
    ],
    
    barcodeRegex : {
        'ean'   :/^([0-9]{8}|[0-9]{13})$/,
        'upc'   :/^[0-9]{11,12}$/,
        'isbn'  :/.*/,
        '39'    :/^[0-9a-zA-Z\-\.\s\$\/\+\%]+$/,
        '93'    :/^[0-9a-zA-Z\-\.\s\$\/\+\%!"§&]+$/,
        '128c'  :/.*/,
        '128b'  :/.*/,
        '128'   :/.*/,
        'i25'   :/.*/,
        'cbr'   :/.*/,
        'msi'   :/.*/,
        'pls'   :/.*/
    },
    
    initComponent : function(){
        var me = this;
        
        Ext.apply(me, {
            layout          :'anchor',
            style           :'clear:both',
            defaults        :{
                anchor          :'0'
            },
            
            items: [{
                xtype               :'container',
                ref                 :'the-summary',
                border              :false,
                layout              :'hbox',
                hidden              :me.mode != 'summary',
                items               :[{
                    flex                :1,
                    xtype               :'component',
                    ref                 :'summary-tpl',
                    tpl                 :new Ext.XTemplate(
                        '<tpl if="name">',
                            '<div style="padding-top: 2px;"><table style="width:100%; line-height: 20px;"><tr valign="top">',
                                '<td>{name}</td>',
                                '<td width="5%" style="padding-right:12px;">',
                                    '<table style="font-size: 11px;">',
                                        '<tr valign="top">',
                                            '<td><div style="text-align: right; white-space:nowrap; color: #666; padding-right: 6px;">',
                                                'Total Quantity:',
                                            '</div></td>',
                                            '<td><div style="white-space:nowrap; text-align: left; ">',
                                                '{total}',
                                            '</div></td>',
                                        '</tr>',
                                        '<tr valign="top">',
                                            '<td><div style="text-align: right; white-space:nowrap; color: #666; padding-right: 6px;">',
                                                'Total Value:',
                                            '</div></td>',
                                            '<td><div style="white-space:nowrap; text-align:left;">',
                                                '${[(values.value*values.total).toFixed(2)]}',
                                            '</div></td>',
                                        '</tr>',
                                    '</table>',
                                '</td>',
                            '</tr></table></div>',
                        '</tpl>'
                    ),
                    data                :me.prize.data
                },{xtype:'splitter'},{
                    xtype               :'button',
                    text                :'Edit',
                    icon                :'/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/page-pencil-16.png',
                    handler             :me.switchMode,
                    scope               :me
                },{xtype:'splitter'},{
                    xtype               :'button',
                    text                :'Delete',
                    icon                :'/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/badge-circle-minus-16.png',
                    handler             :function(){
                        me.fireEvent('deleteme', me, me.prize);
                    }
                }]
                
            },{
                xtype               :'container',
                ref                 :'the-form',
                hidden              :me.mode == 'summary',
                border              :false,
                layout              :'anchor',
                defaults        :{
                    xtype           :'textfield',
                    labelWidth      :120,
                    anchor          :'0'
                },
                autoHeight          :true,
                items : [{
                
                    xtype               :'container',
                    arrowCt             :true,
                    layout              :'hbox',
                    border              :false,
                    autoHeight          :true,
                    defaults            :{
                        autoHeight          :true,
                        labelAlign          :'left',
                        xtype               :'textfield'
                    },
                    items : [{
                        name                :'name',
                        fieldLabel          :'Prize Name',
                        flex                :1,
                        labelWidth          :120,
                        emptyText           :'Enter the prize name',
                        allowBlank          :false,
                        helpText            :[
                            "<p>",
                                "Enter the prize name. Please try to keep it as short as possible.",
                            '</p>',
                            '<div style="padding: 6px; border: 1px solid #ccc; border-radius: 4px; margin: 6px 0; background: #f3f3f3;">',
                                '<h4 style="font-weight: bold; margin-bottom: .5em; color: red; text-align: center;">Important!</h4>',
                                '<p style="margin: .2em 0;">Available prizes must comply with state and federal laws.</p>',
                            '</div>'
                        ]
                    },{xtype:'splitter'},{
                        name                :'value',
                        fieldLabel          :'Value',
                        labelWidth          :36,
                        width               :80,
                        emptyText           :'USD',
                        allowBlank          :false,
                        value               :0,
                        helpText            :[
                            "<p>",
                                "Enter the value per prize for tracking purposes.",
                            '</p>'
                        ]
                    },{xtype:'splitter'},{
                        name                :'total',
                        fieldLabel          :'Quantity',
                        labelWidth          :52,
                        width               :94,
                        regex               :/^[0-9]+$/,
                        maskRe              :/[0-9]/,
                        emptyText           :'',
                        allowBlank          :false,
                        helpText            :[
                            "<p>",
                                "Enter the total quantity of this prize.",
                            '</p>'
                        ]
                    }]
                },{
                    xtype               :'textarea',
                    name                :'description',
                    fieldLabel          :'Prize Description',
                    emptyText           :'Enter the complete prize description',
                    helpText            :[
                        "<p>",
                            "This will be the full prize description that the user can see.",
                        '</p>',
                        '<div style="padding: 6px; border: 1px solid #ccc; border-radius: 4px; margin: 6px 0; background: #f3f3f3;">',
                            '<h4 style="font-weight: bold; margin-bottom: .5em; color: red; text-align: center;">Important!</h4>',
                            '<p style="margin: .2em 0;">Add any restrictions for the prize. For example, if you were offering a <em>T-Shirt</em>, ',
                            'a stipulation may be <strong>Sizes subject to availability</strong>. If you are operating restaurant and offering a prize of <em>$5.00 off ',
                            'your check</em>, you could require <strong>Dine-In Only</strong>.</p>',
                        '</div>'
                    ]
                },{
                    xtype               :'duration',
                    name                :'duration',
                    fieldLabel          :'Redemption Period',
                    emptyText           :'Length of redemption period',
                    allowBlank          :false,
                    helpText            :[
                        "<p>",
                            "Enter the amount of time a player will have to redeem their prize from the time they win.",
                        '</p>'
                    ]
                },{
                    xtype               :'hidden',
                    name                :'redemption_type',
                    fieldLabel          :'Redemption Method',
                    emptyText           :'Please choose the redemption method',
                    value               :'image'
                    /*
                    editable            :false,
                    forceSelection      :true,
                    value               :'image',
                    displayField        :'display',
                    valueField          :'value',
                    queryMode           :'local',
                    allowBlank          :false,
                    store               :Ext.create('Ext.data.Store',{
                        fields              :['value','display'],
                        data                :[
                            {value: 'image',        display:'In Person / Security Image'},
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
                    */
                },{
                    xtype               :'container',
                    layout              :'anchor',
                    autoHeight          :true,
                    border              :false,
                    ref                 :'redemption_fields',
                    defaults            :{
                        anchor              :'0',
                        labelWidth          :120,
                        autoHeight          :true,
                        labelAlign          :'left',
                        xtype               :'textfield'
                    }
                },{
                    xtype               :'container',
                    layout              :'hbox',
                    border              :false,
                    items               :[{
                        xtype               :'splitter',
                        flex                :1
                    },{
                        xtype               :'button',
                        scale               :'medium',
                        text                :'Cancel',
                        hidden              :true,
                        ref                 :'cancel-btn',
                        icon                :'/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/badge-circle-direction-up-24.png',
                        handler             :function(){
                            // cancel!
                            me.getForm().setValues(me._original_values);
                            me.updateRecord();
                            me.switchMode();
                        }
                    },{xtype:'splitter'},{
                        xtype               :'button',
                        scale               :'medium',
                        text                :'Delete',
                        icon                :'/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/badge-circle-minus-24.png',
                        handler             :function(){
                            me.fireEvent('deleteme', me, me.prize);
                        }
                    },{xtype:'splitter'},{
                        xtype               :'button',
                        scale               :'medium',
                        text                :'Save',
                        icon                :'/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/badge-circle-check-24.png',
                        handler             :me.save,
                        scope               :me
                    }]
                }]
            }]
        });
        
        me._original_values = Ext.Object.merge({}, me.prize.data);
        
        me.callParent(arguments);
        
        var updateSummary = function(){
            me.down('[ref=summary-tpl]').update(me.prize.data);
        };
        
        me.prize.on('modify', updateSummary);
        me.on('destroy', function(){
            me.prize.un('modify', updateSummary);
        });
        
        me.redemption_fields = {
            'common' : [{
                    xtype               :'textarea',
                    height              :36,
                    name                :'instructions',
                    fieldLabel          :'Instructions',
                    emptyText           :'Describe how a user will redeem this prize',
                    allowBlank          :false,
                    helpText            :[
                        "<p>",
                            "Describe what the user needs to do to redeem this prize. For example, ",
                            '"Show this screen to an employee."',
                        '</p>'
                    ]
                }],
            'image' : [],
            'barcode' : [{
                    xtype               :'combo',
                    name                :'barcode_type',
                    fieldLabel          :'Barcode Format',
                    emptyText           :'What is the barcode format',
                    allowBlank          :false,
                    editable            :false,
                    forceSelection      :true,
                    displayField        :'display',
                    valueField          :'value',
                    queryMode           :'local',
                    allowBlank          :false,
                    store               :Ext.create('Ext.data.Store',{
                        fields              :['value','display'],
                        data                :[
                            {value: 'ean',          display:'EAN-8, EAN-13'},
                            {value: 'upc',          display:'UPC'},
                            {value: 'isbn',         display:'ISBN'},
                            {value: '39',           display:'Code 39'},
                            {value: '93',           display:'Code 93'},
                            {value: '128c',         display:'Code 128 C'},
                            {value: '128b',         display:'Code 128 B'},
                            {value: '128',          display:'Code 128'},
                            {value: 'i25',          display:'Interleaved 2 of 5'},
                            {value: 'cbr',          display:'Codabar'},
                            {value: 'msi',          display:'MSI'},
                            {value: 'pls',          display:'Plessey'}
                        ]
                    }),
                    helpText            :[
                        "<p>",
                            "Please choose the format for your barcodes.",
                        '</p>'
                    ]
                },{
                    xtype               :'codes',
                    name                :'barcodes',
                    fieldLabel          :'Barcodes',
                    emptyText           :'Please enter the barcodes (one per line)',
                    allowBlank          :false,
                    height              :100,
                    helpText            :[
                        "<p>",
                            "Enter the text values for your barcodes. You should have one barcode per line.",
                        '</p>'
                    ]
                }],
            'email' : [{
                    name                :'email_subject',
                    fieldLabel          :'Email Subject',
                    emptyText           :'Subject of your email',
                    allowBlank          :false,
                    helpText            :[
                        "<p>",
                            "Please enter the subject of your email. The text will be processed before sending and the ",
                            "following replacements will be made:",
                        '</p>',
                        '<table class="prize-help-table">',
                            '<tr><th>{code}</th><td>The code</td></tr>',
                            '<tr><th>{prize}</th><td>The prize name.</td></tr>',
                            '<tr><th>{name}</th><td>The user\'s name.</td></tr>',
                            '<tr><th>{email}</th><td>The user\s email.</td></tr>',
                        '</table>'
                    ]
                },{
                    xtype               :'htmleditor',
                    name                :'email_body',
                    fieldLabel          :'Email Body',
                    height              :300,
                    labelAlign          :'top',
                    allowBlank          :false,
                    helpText            :[
                        "<p>",
                            "Please enter the body of your email. The text will be processed before sending and the ",
                            "following replacements will be made:",
                        '</p>',
                        '<table class="prize-help-table">',
                            '<tr><th>{code}</th><td>The code</td></tr>',
                            '<tr><th>{prize}</th><td>The prize name.</td></tr>',
                            '<tr><th>{name}</th><td>The user\'s name.</td></tr>',
                            '<tr><th>{email}</th><td>The user\s email.</td></tr>',
                        '</table>'
                    ]
                },{
                    xtype               :'codes',
                    name                :'email_codes',
                    fieldLabel          :'Email Codes',
                    height              :100,
                    emptyText           :'Please enter the email codes (one per line)',
                    allowBlank          :false,
                    helpText            :[
                        "<p>",
                            "Enter each all the individual email codes. Each code should be on its own line.",
                        '</p>'
                    ]
                }]
        };
        
        if( me.prize.get('name') ){
            me.down('[ref=cancel-btn]').show();
        }
        me.on('render', function(){
            if( me.prize ){
                me.loadForm(me.prize);
                me.onRedemptionTypeChange();
            }
            me.body.addCls('mode-'+me.mode);
            me.initFieldEvents();
        });
    },
    
    switchMode : function(){
        
        var me = this,
            mode = me.mode == 'summary' ? 'form' : 'summary';
        
        me.body.removeCls('mode-'+me.mode);
        me.mode = mode;
        
        me.down('[ref=the-form]')[mode=='summary'?'hide':'show']();
        me.down('[ref=the-summary]')[mode=='summary'?'show':'hide']();
        
        if( me.mode == 'form' ){
            if( me.prize.get('name') ){
                me.down('[ref=cancel-btn]').show();
            }
            me.focusFirstField();
        }
        me.fireEvent('sizechange');
        me.body.addCls('mode-'+me.mode);
    },
    
    focusFirstField : function(){
        this.down('field').focus();
    },
    
    initFieldEvents : function(ct){
        
        var me = this;
        
        var bufferedOnChange = Ext.Function.createBuffered( me.onChange, 700, me );
        
        Ext.Array.each( (ct||me).query('field'), function(field){
            field.on('focus', function(){
                me.card.onFieldFocus(field);
            });
            field.on('blur', function(){
                // me.card.onFieldBlur(field);
            });
            field.on('change', function(field){
                bufferedOnChange(field);
            });
        });
        
        Ext.Array.each( (ct||me).query('htmleditor'), function(field){
            field.on('activate', function(field){
                me.card.onFieldFocus(field);
                field.clearInvalid();
                Ext.EventManager.on( field.getWin(),'focus', function(){
                    me.card.onFieldFocus(field);
                    field.clearInvalid();
                });
            });
        });
    },
    
    onRedemptionTypeChange : function(){
        
        var me = this,
            ct = me.down('[ref=redemption_fields]'),
            type = me.down('[name=redemption_type]').getValue();
            
        // clean out any old stuff.
        ct.removeAll();
        
        ct.add( me.redemption_fields.common );
        if( me.redemption_fields[type] && me.redemption_fields[type].length ){
            ct.add( me.redemption_fields[type] );
        }
        
        Ext.Array.each( ct.query('field,fieldcontainer,htmleditor'), function(field){
            if( me.prize.get(field.name)){
                field.setValue( me.prize.get(field.name) );
            }
        });
        
        // update instructions
        if( type != me.prize.get('redemption_type') ){
            me.down('[name=instructions]').setValue(me.prize.getDefaultInstructions(type));
            if( type == 'email' ){
                me.down('[name=email_subject]').setValue(me.prize.getDefaultEmailSubject());
                me.down('[name=email_body]').setValue(me.prize.getDefaultEmailBody());
            }
        }
        
        me.initFieldEvents( ct );
        me.fireEvent('sizechange');
    },
    
    loadForm : function(prize){
        var me = this;
        // reset the form
        me.getForm().reset();
        //Ext.Array.each( me.query('[redemption_field=yes]'), function(field){ field.hide(); } );
        me.prize = prize;
        if( prize.get('name') ){
            // backwards compatability..
            if( !prize.get('redemption_type') ){
                var email_codes = prize.get('email_codes'),
                    barcodes = prize.get('barcodes');
                    
                // clean the arrays
                function clean_array(ar){
                    var i =0;
                    while(i < ar.length){
                        if( ar[i] == '' ) ar.splice(i,1);
                        else i++;
                    }
                }
                clean_array(barcodes);
                clean_array(email_codes);
                prize.set('redemption_type', email_codes && email_codes.length ? 'email' : (barcodes && barcodes.length ? 'barcode' : 'image') );
            }
            me.getForm().loadRecord(prize);
        }
        else{
            // only set the fields we want
            var values = {
                duration: prize.get('duration'),
                value: prize.get('value')
            };
            me.getForm().setValues(values);
        }
    },
    
    updateRecord : function(){
        var me = this;
        me.prize.set(me.getValues());
    },
    
    getValues : function(){
        var me = this,
            values = {};
            
        Ext.each( me.query('field,htmleditor'), function(field){
            if( !field.up('duration') ) values[field.name] = field.getValue();
        });
        if( me.down('duration')){
            values['duration'] = me.down('duration').getValue();
        }
        return values;
    },
    
    onChange : function(){
        this.updateRecord();
    },
    
    validate : function(){
        var me = this,
            type = me.getValues().redemption_type,
            values = me.getValues(),
            valid = me.getForm().isValid();
            
        if( !valid || type == 'image' ) return valid;
        
        var codes = type == 'barcode' ? values.barcodes : values.email_codes;
        if( codes.length != Number(values.total) ){
            var field_name = type=='barcode'?'barcodes':'email_codes';
            me.down('[name='+field_name+']').markInvalid('The number of codes does not match the quantity above.');
            return {
                title: 'Quantity Mismatch',
                message: 'The quantity specified does not match the number of codes'
            };
        }
        
        if( type == 'email'){
            if( !~Ext.Array.indexOf(values.email_body,'{code}') ){
                me.down('[name=email_body]').markInvalid();
                return {
                    title: 'Email Code',
                    message: 'The email body does not contain {code}. You must include this somewhere to be populated with the unique email codes.'
                };
            }
        }
        if( type == 'barcode' ){
            var barcode_type = me.down('[name=barcode_type]').getValue(),
                re = me.barcodeRegex[barcode_type]
                ;
                
            var result = Ext.Array.each(codes, function(code){
                return re.test(code);
            });
            if( Ext.isNumeric(result) ){
                return {
                    title: 'Barcode Format Error',
                    message: 'One of the barcodes does not match the selected format.'
                };
            }
        }
        
        return true;
    },
    
    alert :function(valid){
        var title, message, defaultTitle = 'Uh-oh';
            
        if( Ext.isObject(valid) ){
            title = valid.title||defaultTitle;
            message = valid.message;
        }
        else if( Ext.isString(valid) ){
            title = defaultTitle;
            message = valid;
        }
        if( !valid ){
            title = defaultTitle;
            message = 'Please fix the errors on the form before moving on to the next step';
        }
        Ext.Msg.alert(title, message);
    },
    
    save : function(){
        var me = this,
            valid = this.validate();
            
        if( valid === true ){
            this.prize.set( this.getValues() );
            me.prize.set('is_email', me.prize.get('redemption_type') == 'email');
            me.prize.set('is_barcode', me.prize.get('redemption_type') == 'barcode');
            this.prize.commit();
            if( this.mode=='form' ) this.switchMode();
            return;
        }
        me.alert(valid);
        return;
    }
    
});