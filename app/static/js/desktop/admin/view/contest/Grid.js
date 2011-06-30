Ext.define('Admin.view.contest.Grid' ,{
    
    extend: 'Ext.grid.Panel',
    alias : 'widget.contestgrid',
    
    initComponent : function(){
        var me = this;
        
        me.viewConfig = {
            emptyText :[
                '<div style="text-align: center; padding: 6px; color: #f00; text-transform: uppercase;">',
                    'No Campaigns yet!',
                '</div>'].join('')
        };
        
        // need to add the headings for the contest
        me.columns = [{
            header      :'Name',
            dataIndex   :'name',
            flex        :1,
            renderer    :function(v){
                return v || 'Untitled'
            }
        },{
            header      :'Total Entries',
            dataIndex   :'total_entries',
            width       :80
        },{
            header      :'Game',
            dataIndex   :'game',
            width       :60,
            renderer    :function(v){
                return v.substr(0,1).toUpperCase()+v.substr(1);
            }
        },{
            header      :'Start',
            dataIndex   :'start',
            width       :100
        },{
            header      :'Active',
            dataIndex   :'active',
            width       :60
        },{
            header      :'Complete',
            dataIndex   :'play_cursor',
            width       :60,
            renderer    :function(v, opts, record){
                if( record.get('engine_type') == 'time' ){
                    // this will be the percentage of time
                }
                else{
                    var tp = parseInt(record.get('total_plays')),
                        pc = parseInt(Math.max(0, record.get('play_cursor')));
                    v = parseInt( 10000 * ((tp - (tp - pc)) / tp) ) / 100;
                    v = v+'%';
                }
                return v;
            }
        }];
        
        me.callParent();
    }
});