Ext.onReady(function(){
    var pages = Ext.select('.pages .page');
    var submit = Ext.get(Ext.DomQuery.selectNode('input[type=submit]'));
    pages.on('mouseenter', function(){
        Ext.fly(this).addClass('page-hover');
    });
    pages.on('mouseleave', function(){
        Ext.fly(this).removeClass('page-hover');
    });
    pages.on('click', function(){
        pages.each(function(page){
            page.down('input[type=checkbox]').dom.checked = false;
            page.removeClass('page-selected');
        });
        Ext.fly(this).addClass('page-selected');
        Ext.fly(this).down('input[type=checkbox]').dom.checked = true;
        submit.dom.disabled = false;
        submit.removeClass('big-button-disabled');
    });
});