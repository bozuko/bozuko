jQuery(function($){
    var $notice = $('.notice'),
        $noticeBd = $('.notice-bd'),
        step=0, heights = [18,8,14,8,12,10], durations = [500, 300, 500, 300, 400, 200],
        floating = true;
    
    if( !$notice.length ) return;
    
    $notice.hover(
        function over()
        {
            $notice.addClass('notice-over');
            floating = false;
            $noticeBd.stop();
            $noticeBd.animate({'height':$noticeBd[0].scrollHeight}, 300);
        },
        function out()
        {
            $noticeBd.stop();
            $notice.removeClass('notice-over');
            floating=true;
            step = 0;
            $noticeBd.animate({'height':4}, 500, animateFloat);
        }
    );
    
    function animateFloat()
    {
        if( !floating || step > heights.length ) return;
        var h = heights[step],
            dur = durations[step];
        step++;
        $noticeBd.animate({'height':h}, dur, animateFloat);
    }
    $noticeBd.animate({'height':4}, 750, animateFloat);
});