Ext.define('Bozuko.view.contest.edit.Prize' ,{

    extend: 'Ext.form.Panel',
    alias : 'widget.contestformprize',

    requires: ['Bozuko.lib.form.field.Duration'],
    border          :false,
    autoHeight      :true,

    initComponent : function(){

        var me = this;

        me.items = [{
            xtype           :'fieldset',
            title           :'Prize',
            layout          :'anchor',
            style           :'background-color: #f3f3f3',
            defaults        :{
                xtype           :'textfield',
                anchor          :'0',
                labelWidth      :150
            },
            items           :[{
                name            :'name',
                fieldLabel      :'Name',
                allowBlank      :false
            },{
                name            :'total',
                fieldLabel      :'Total',
                allowBlank      :false
            },{
                name            :'value',
                fieldLabel      :'Value',
                allowBlank      :false
            },{
                xtype           :'textarea',
                height          :60,
                name            :'description',
                fieldLabel      :'Description',
                allowBlank      :false
            },{
                xtype           :'textfield',
                name            :'instructions',
                fieldLabel      :'Instructions',
                allowBlank      :false
            },{
                xtype           :'duration',
                name            :'duration',
                fieldLabel      :'Redemption Period',
                allowBlank      :false,
                value           :1000 * 60 * 2
            },{
                xtype           :'checkbox',
                name            :'is_pdf',
                fieldLabel      :'Email PDF only',
                listeners       :{
                    change          :function(field){
                        me.down('[name=pdf_image]')[field.getValue()?'show':'hide']();
                        me.down('[name=pdf_image_only]')[field.getValue()?'show':'hide']();
                        var fn = field.getValue() ? 'show' : 'hide';
                        Ext.Array.each( me.query('[name=email_body], [name=email_subject], [name=email_format], [name=email_replyto]'), function(cmp){
                            cmp[fn]();
                        });
                    }
                }
            },{
                xtype           :'textfield',
                name            :'pdf_image',
                hidden          :true,
                fieldLabel      :'PDF Image Url'
            },{
                xtype           :'checkbox',
                name            :'pdf_image_only',
                hidden          :true,
                fieldLabel      :'PDF Image Only'
            },{
                xtype           :'checkbox',
                name            :'address_required',
                fieldLabel      :'Address Required'
            },{
                xtype           :'checkbox',
                name            :'is_barcode',
                fieldLabel      :'Use Barcodes',
                listeners       :{
                    scope           :me,
                    change          :me.onBarcodeChange
                }
            },{
                xtype           :'combo',
                name            :'barcode_type',
                fieldLabel      :'Barcode Type',
                value           :'39',
                hidden          :true,
                queryMode       :'local',
                editable        :false,
                forceSelection  :true,
                store           :Ext.create('Ext.data.Store',{
                    fields:['value'],
                    data:[
                        {value:'39'},
                        {value:'ean'},
                        {value:'upc'},
                        {value:'isbn'},
                        {value:'128c'},
                        {value:'128b'},
                        {value:'128'},
                        {value:'128raw'},
                        {value:'i25'},
                        {value:'cbr'},
                        {value:'msi'},
                        {value:'pls'},
                        {value:'93'}
                    ]
                }),
                displayField    :'value',
                valueField      :'value'
            },{
                xtype           :'textarea',
                height          :80,
                hidden          :true,
                name            :'barcodes',
                fieldLabel      :'Barcodes (one per line)',
                allowBlank      :false,
                getValue        :function(){
                    var v = Ext.form.field.TextArea.prototype.getRawValue.apply(this);
                    return v.split('\n');
                },
                setValue        :function(v){

                    if( Ext.isString(v) ) v = v.split('\n');
                    Ext.form.field.TextArea.prototype.setValue.apply(this, [(v||[]).join('\n')])
                },
                listeners       :{
                    scope           :me,
                    change          :me.onCodesChange
                }
            },{
                xtype           :'checkbox',
                name            :'hide_expiration',
                fieldLabel      :'Hide Expiration'
            },{
                xtype           :'checkbox',
                name            :'is_email',
                fieldLabel      :'Email Prize?',
                allowBlank      :false,
                listeners       :{
                    scope           :me,
                    change          :me.onEmailChange
                }
            },{
                hidden              :true,
                xtype               :'combo',
                name                :'email_format',
                fieldLabel          :'Email Format',
                value               :'text/plain',
                allowBlank          :false,
                editable            :false,
                forceSelection      :true,
                displayField        :'value',
                valueField          :'value',
                queryMode           :'local',
                store               :Ext.create('Ext.data.Store',{
                    fields              :['value'],
                    data                :[{value:'text/plain'},{value:'text/html'}]
                }),
                listeners           :{
                    change              :function(){
                        this.onTypeChange();
                    },
                    render              :function(){
                        var self = this;
                        setTimeout(function(){
                            self.onTypeChange();
                        }, 500);
                    }
                },
                
                onTypeChange    :function(){
                    var val = this.getValue();
                    var body = me.down('[name=email_body]');
                    switch(val){
                        case 'text/plain':
                            body.toggleSourceEdit(true);
                            break;
                        case 'text/html':
                            body.toggleSourceEdit(false);
                            break;
                    }
                }
            },{
                hidden          :true,
                name            :'email_subject',
                fieldLabel      :'Email Subject',
                value           :'You won a Bozuko prize!'
            },{
                hidden          :true,
                name            :'email_replyto',
                fieldLabel      :'Email Reply To',
                value           :''
            },{
                xtype           :'htmleditor',
                height          :200,
                hidden          :true,
                name            :'email_body',
                fieldLabel      :'Email Body',
                allowBlank      :false,
                listeners       :{
                    editmodechange  :function(){
                        var type = me.down('[name=email_format]').getValue();
                        // if( type == 'text/plain' && this.sourceEditMode ) this.toggleSourceEdit(true);
                    }
                }
            },{
                xtype           :'textarea',
                height          :80,
                hidden          :true,
                name            :'email_codes',
                fieldLabel      :'Email Codes (one per line)',
                allowBlank      :false,
                getValue        :function(){
                    var v = Ext.form.field.TextArea.prototype.getRawValue.apply(this);
                    var ar = v.split('\n');
                    if( ar.length ){
                        if( ar[0] === '' ) ar.shift();
                        if( ar.length ){
                            if( ar[ar.length-1] === '') ar.pop();
                        }
                    }
                    return ar;
                },
                setValue        :function(v){
                    if( Ext.isString(v) ) v = v.split('\n');
                    Ext.form.field.TextArea.prototype.setValue.apply(this, [(v||[]).join('\n')])
                },
                listeners       :{
                    scope           :me,
                    change          :me.onCodesChange
                }
            },{
                xtype           :'container',
                border          :false,
                style           :'text-align:right',
                html            :[
                    '<a class="remove-prize" href="javascript:;" style="color: red; font-weight: bold;">Remove Prize</a>'
                ].join(''),
                listeners       :{
                    afterrender     :function(){
                        this.el.down('a').on('click', function(){
                            me.fireEvent('removeprize', me.record, me);
                        });
                    }
                }
            }]
        }];

        me.callParent();

        if( me.record ) {
            me.loadRecord( record );

        }
    },

    onEmailChange : function(field, value){
        var fn = value || this.down('[name=is_pdf]').getValue() ? 'show' : 'hide';
        Ext.Array.each( this.query('[name=email_body], [name=email_subject], [name=email_format], [name=email_replyto]'), function(cmp){
            cmp[fn]();
        });
        this.down('[name=email_codes]')[value?'show':'hide']();
        this.query('[name=total]')[0].setDisabled( value ? true : false );
        this.onCodesChange( this.query('[name=email_codes]')[0] );
    },

    onBarcodeChange : function(field, value){
        var fn = value ? 'show' : 'hide';
        Ext.Array.each( this.query('[name=barcodes], [name=barcode_type]'), function(cmp){
            cmp[fn]();
        });
        this.query('[name=total]')[0].setDisabled( value ? true : false );
        this.onCodesChange( this.query('[name=barcodes]')[0] );
    },
    
    onCodesChange : function(cmp){
        var total = this.query('[name=total]')[0];
        if( total.isDisabled() ) total.setValue( cmp.getValue().length );
    },

    getValues : function(selector){
        var form = this;
        var values = {};
        selector = selector ? selector+' field, '+selector+' htmleditor' : 'field, htmleditor';
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

    updateRecord : function(){
        var v = this.getValues();
        this.record.set(v);
    }
});