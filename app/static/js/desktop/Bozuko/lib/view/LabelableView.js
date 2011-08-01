Ext.define('Bozuko.lib.view.LabelableView', {
    extend: 'Ext.view.View',
    alias: 'widget.labelabledataview',
    mixins: {
        labelable: 'Ext.form.Labelable',
        field: 'Ext.form.field.Field'
    },
    initComponent : function(){
        this.callParent(arguments);
        this.initLabelable();
        this.initField();
    },
    initRenderTpl: function() {
        var me = this;
        if (!me.hasOwnProperty('renderTpl')) {
            me.renderTpl = me.getTpl('labelableRenderTpl');
        }
        return me.callParent();
    },

    initRenderData: function() {
        return Ext.applyIf(this.callParent(), this.getLabelableRenderData());
    },
    
    onRender : function() {
        var me = this,
            renderSelectors = me.renderSelectors;

        Ext.applyIf(renderSelectors, me.getLabelableSelectors());
        me.callParent(arguments);
    }
});