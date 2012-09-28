Ext.define( 'Bozuko.lib.panel.AceEditor', {
    
    extend              :'Ext.panel.Panel',
    alias               :'widget.aceeditor',
    mode                :'javascript',
    value               :'',
    
    initComponent : function(){
        
        this.addEvents({save: true});
        
        this.callParent();
        // this.on('render', this.renderAce, this );
        this.on('afterrender', this.renderAce, this);
        this.on('resize', this.resizeAce, this);
    },
    
    renderAce : function(){
        
        var me = this;
        
        this.editor = ace.edit(this.body.dom);
        this.editor.setTheme("ace/theme/tomorrow_night_bright");
        this.editor.getSession().setMode("ace/mode/"+this.mode);
        if( this.value ) this.editor.setValue( this.value, -1 );
    },
    
    resizeAce : function(){
        if( this.editor ) this.editor.resize( true );
    },
    
    getValue : function(){
        if( this.editor ){
            this.value = this.editor.getValue();
            this.editor.resize();
        }
        return this.value;
    },
    
    setValue : function(v){
        this.value = v;
        if( this.editor ) this.editor.setValue( v );
    }
    
});