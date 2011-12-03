Ext.define('Bozuko.view.contest.edit.Prize' ,{

    extend: 'Ext.form.Panel',
    alias : 'widget.contestformprize',

    requires: [],
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
                name            :'instructions',
                fieldLabel      :'Instructions',
                allowBlank      :false
            },{
                name            :'duration',
                fieldLabel      :'Redemption Period',
                allowBlank      :false,
                value           :1000 * 60 * 2
            },{
                xtype           :'checkbox',
                name            :'is_barcode',
                fieldLabel      :'Use Barcodes',
                allowBlank      :false,
                listeners       :{
                    scope           :me,
                    change          :me.onBarcodeChange
                }
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
                }
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
                hidden          :true,
                name            :'email_subject',
                fieldLabel      :'Email Subject',
                value           :'You won a Bozuko prize!',
                allowBlank      :false
            },{
                xtype           :'textarea',
                height          :100,
                hidden          :true,
                name            :'email_body',
                fieldLabel      :'Email Body',
                allowBlank      :false
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
                            if( ar[ar.length] === '') ar.pop();
                        }
                    }
                    return ar;
                },
                setValue        :function(v){
                    if( Ext.isString(v) ) v = v.split('\n');
                    Ext.form.field.TextArea.prototype.setValue.apply(this, [(v||[]).join('\n')])
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
        var fn = value ? 'show' : 'hide';
        Ext.Array.each( this.query('[name=email_body], [name=email_subject], [name=email_codes]'), function(cmp){
            cmp[fn]();
        });
    },

    onBarcodeChange : function(field, value){
        var fn = value ? 'show' : 'hide';
        Ext.Array.each( this.query('[name=barcodes]'), function(cmp){
            cmp[fn]();
        });
    },

    getValues : function(selector){
        var form = this;
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

    updateRecord : function(){
        var v = this.getValues();
        this.record.set(v);
    }
});