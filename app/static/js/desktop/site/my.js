jQuery(function(){
    var $form = $('.prize-form').submit(function(e){e.preventDefault()}),
        $accountForm = $('.account-form').submit(function(e){e.preventDefault(); saveSettings()}),
        $updateSettingsButton = $('.update-settings-button'),
        $list = $('.prize-list'),
        $none = $('.none'),
        $start = $('input[name=start]'),
        $loadMore = $('.load-more'),
        searchTimeout,
        lastParams
        ;
        
    $('.submit, .reset').hide();
    $('.states input[type=checkbox]').change(updateAndReplace);
    $('.search').change(updateAndReplace);
    $('.search').click(updateAndReplace);
    $('.search').keyup(delayedSearch);
    
    $loadMore.click(function(e){
        e.preventDefault();
        update(true);
    });
    
    if( Prizes.total > Prizes.loaded ) $loadMore.show();
    
    function saveSettings()
    {
        $updateSettingsButton
            .val('Updating...')
            .attr('disabled',true)
            .addClass('disabled');
            
        $.post('/my/account', $accountForm.serialize(), function(response){
            
            $updateSettingsButton
                .val('Update Settings')
                .removeClass('disabled')
                .attr('disabled',false);
            
            if( response && response.success && response.message ){
                var $info = $('<div class="info fade" />')
                    .html(response.message);
                $accountForm
                    .parents('.pane')
                    .append($info);
                setTimeout(function(){
                    $info.animate({opacity:'0',height:'0'}, function(){
                        $info.remove();
                    });
                }, 3000);
            }
        })
    }
    
    function getParams()
    {
        return $form.serialize();
    }
    
    function delayedSearch()
    {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(updateAndReplace, 250);
    }
    
    function updateAndReplace()
    {
        update();
    }
    
    function update(append)
    {
        clearTimeout(searchTimeout);
        
        if( append ){
            $loadMore.html('Loading...');
            $start.val(Prizes.loaded);
        }
        else{
            $start.val(0);
        }
        var params = getParams();
        
        if( params == lastParams ) return;
        lastParams = params;
        
        $.get('/my/prizes', params, function(response){
            
            $loadMore.html('Load More');
            
            Prizes.total = response.total;
            Prizes.loaded = append ? Prizes.loaded + response.items.length : response.items.length;
            
            if( !response.items.length ){
                
                if(!append){
                    $list.hide();
                    $none.show();
                }
            }
            else{
                $list.show();
                $none.hide();
                $list[append?'append':'html'](response.html);
            }
            if( Prizes.loaded < Prizes.total ){
                $loadMore.show();
            }
            else{
                $loadMore.hide();
            }
            
        });
    }
});