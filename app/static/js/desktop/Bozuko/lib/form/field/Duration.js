Ext.define('Bozuko.lib.form.field.Duration', {
    extend: 'Ext.form.FieldContainer',
    alias: 'widget.duration',
    
    mixins: {
        field: 'Ext.form.field.Field'
    },
    
    cls : 'duration-field',
    
    fieldLabel : 'Duration',
    
    durations: [
        {label: 'Years', value: 1000 * 60 * 60 * 24 * 365},
        {label: 'Months', value: 1000 * 60 * 60 * 24 * 30},
        {label: 'Weeks', value: 1000 * 60 * 60 * 24 * 7},
        {label: 'Days', value: 1000 * 60 * 60 * 24},
        {label: 'Hours', value: 1000 * 60 * 60},
        {label: 'Minutes', value: 1000 * 60},
        {label: 'Seconds', value: 1000}
    ],
    
    initComponent : function(){
        var me = this;
        
        Ext.apply(me, {
            layout          :'hbox',
            
            items: [{
                flex            :1,
                xtype           :'textfield',
                ref             :'value'
            },{
                xtype           :'splitter'
            },{
                flex            :1,
                ref             :'unit',
                xtype           :'combo',
                editable        :false,
                forceSelection  :true,
                displayField    :'label',
                valueField      :'value',
                value           :this.durations[3].value,
                store           :Ext.create('Ext.data.Store',{
                    fields :['label','value'],
                    data : me.durations
                })
            }]
        });
        
        me.callParent( arguments );
        me.valueField = me.down('[ref=value]');
        me.unitField = me.down('[ref=unit]');
        me.initField();
    },
    
    focus : function(){
        me.valueField.focus();
    },
    
    setValue : function(v){
        
        var me = this,
            u = "m",
            d = 0;
            
        this.value = v;
        
        // v should be a number
        if( Ext.isString(v) ) v = parseInt(v, 10);
        for(var i=0; i<this.durations.length; i++){
            if( v >= this.durations[i].value ){
                var value = this.durations[i].value;
                d = v / value, u = value;
                if( Math.round(d) != d && !this.isTwoDecimalPlacesOrLess(d) ){
                    // go through the rest and see if we can get an evenish
                    // number
                    for(var j=i; j<this.durations.length; j++){
                        value = this.durations[j].value;
                        var test = v/value;
                        if( Math.round(test) == test || this.isTwoDecimalPlacesOrLess(test) ){
                            d = test, u = value;
                            break;
                        }
                    }
                }
                break;
            }
        }
        if( d == 0 ) return;
        me.unitField.setValue(u);
        me.valueField.setValue(d);
    },
    
    isTwoDecimalPlacesOrLess : function(n){
        var s = new String(n);
        if( !~s.indexOf('.') ) return true;
        return s.split('.')[1].length < 3;
    },
    
    getValue : function(){
        var me = this;
        
        var d = Number( me.valueField.getValue() ),
            u = Number( me.unitField.getValue() )
            ;
            
        return d*u;
    }
});