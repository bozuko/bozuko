Ext.define( 'Bozuko.lib.form.field.Codes', {
    extend              :'Ext.form.field.TextArea',
    alias               :'widget.codes',
    
    delimiter           :'\n',
    
    getValue : function(){
        var v = Ext.form.field.TextArea.prototype.getRawValue.apply(this),
            ret = [],
            ar = v.replace(/\r/,'').replace(/^\n+/,'').replace(/\n+$/, '').split(this.delimiter);
        
        for(var i=0; i<ar.length; i++){
            if( ar[i] !== '' ) ret.push( ar[i] );
        }
        return ret;
    },
    
    setValue : function(v){
        if( Ext.isString(v) ) v = v.split( this.delimiter );
        return this.callParent([(v||[]).join( this.delimiter )]);
    }
});