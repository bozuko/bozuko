Ext.define('Ext.ux.picker.DateTime', {
    
    extend: 'Ext.picker.Date',
    
    requires: [
        'Ext.form.field.Time'
    ],
    
    alias: 'widget.datetimepicker',
    alternateClassName: 'Ext.DateTimePicker',
    
    renderTpl: [
        '<div class="{cls} x-datetime-picker" id="{id}" role="grid" title="{ariaTitle} {value:this.longDay}">',
            '<div role="presentation" class="{baseCls}-header">',
                '<div class="{baseCls}-prev"><a href="#" role="button" title="{prevText}"></a></div>',
                '<div class="{baseCls}-month"></div>',
                '<div class="{baseCls}-next"><a href="#" role="button" title="{nextText}"></a></div>',
            '</div>',
            '<table class="{baseCls}-inner" cellspacing="0" role="presentation">',
                '<thead role="presentation"><tr role="presentation">',
                    '<tpl for="dayNames">',
                        '<th role="columnheader" title="{.}"><span>{.:this.firstInitial}</span></th>',
                    '</tpl>',
                '</tr></thead>',
                '<tbody role="presentation"><tr role="presentation">',
                    '<tpl for="days">',
                        '{#:this.isEndOfWeek}',
                        '<td role="gridcell" id="{[Ext.id()]}">',
                            '<a role="presentation" href="#" hidefocus="on" class="{parent.baseCls}-date" tabIndex="1">',
                                '<em role="presentation"><span role="presentation"></span></em>',
                            '</a>',
                        '</td>',
                    '</tpl>',
                '</tr></tbody>',
            '</table>',
            '<tpl if="showToday || showTime">',
                '<div role="presentation" class="{baseCls}-footer"></div>',
            '</tpl>',
        '</div>',
        {
            firstInitial: function(value) {
                return value.substr(0,1);
            },
            isEndOfWeek: function(value) {
                // convert from 1 based index to 0 based
                // by decrementing value once.
                value--;
                var end = value % 7 === 0 && value !== 0;
                return end ? '</tr><tr role="row">' : '';
            },
            longDay: function(value){
                return Ext.Date.format(value, this.longDayFormat);
            }
        }
    ],
    
    initComponent: function(){
        var me = this;
        me.addEvents({
            'timechange': true
        });
        me.on('select', me._onSelect, me);
        me.callParent(arguments);
    },
    
    showTime: true,
    
    onRender : function(){
        var me = this;
        
        Ext.apply(me.renderData, {
            showTime: me.showTime
        });
        
        me.callParent(arguments);
        
        me.hourField = Ext.create('Ext.form.field.Spinner', {
            renderTo: me.footerEl,
            width: 40,
            value: '12',
            hideLabel: true,
            listeners:{
                scope: me,
                spin: me.onHourSpin
            }
        });
        
        me.minuteField = Ext.create('Ext.form.field.Spinner', {
            renderTo: me.footerEl,
            width: 40,
            value: '00',
            hideLabel: true,
            listeners:{
                scope: me,
                spin: me.onMinuteSpin
            }
        });
        
        me.ampmField = Ext.create('Ext.form.field.Spinner', {
            renderTo: me.footerEl,
            width: 42,
            value: 'PM',
            hideLabel: true,
            listeners:{
                scope: me,
                spin: me.onAmPmSpin
            }
        });
    },
    
    onHourSpin : function(spinner, direction){
        this.spin(spinner, direction, 1, 12, 1);
        this.setTimeValue();
        this.fireEvent('timechange', this.value);
    },
    
    onMinuteSpin : function(spinner, direction){
        this.spin(spinner, direction, 0, 55, 5);
        this.setTimeValue();
        this.fireEvent('timechange', this.value);
    },
    
    spin : function(spinner, direction, min, max, inc){
        var dir = direction == 'up',
            v = parseInt(spinner.getValue(), 10);
            
        v += ((dir?1:-1)*inc);
        if( v < min ) v = max;
        else if( v > max ) v = min;
        spinner.setValue( Ext.String.leftPad(v,2,'0') );
    },
    
    onAmPmSpin : function(spinner, direction){
        spinner.setValue(spinner.getValue()=='AM'?'PM':'AM');
        this.setTimeValue();
        this.fireEvent('timechange', this.value);
    },
    
    _onSelect : function(e, t){
        var me = this;
        me.setTimeValue();
    },
    
    setTimeValue: function(){
        var me = this;
        var h = parseInt(me.hourField.getValue(), 10);
        var m = parseInt(me.minuteField.getValue(), 10);
        var a = me.ampmField.getValue() == 'AM';
        if( h!= 12 && !a ) h+=12;
        else if( h == 12 && a ) h = 24;
        me.value.setHours(  h == 24  ? 0 : h  );
        me.value.setMinutes( m );
    }
    
});