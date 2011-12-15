jQuery(function($){
    
    var SlideShow = {}, Demo={};
    
    (function slideshow(exports){
        
        var $slideshow = $('.slideshow'),
            index = 0,
            duration = 7000,
            timeout,
            last,
            running = true,
            $phoneScroller = $slideshow.find('.phone .scroller');
            phoneWidth = $slideshow.find('.phone').width(),
            $slides = $slideshow.find('.content .slide'),
            contentHeight = $slideshow.find('.content').height(),
            contentWidth = $slideshow.find('.content').width(),
            marginTop = contentHeight/2,
            marginLeft = contentWidth/2,
            count = $slides.length;
        
        $slides.removeClass('active');
        
        $controls = $('<div class="controls" />').appendTo($slideshow.find('.content'));
        
        for( var i=0; i<count; i++){
            (function(i){
                var $trigger = $('<a class="trigger">&bull;</a>').appendTo($controls);
                if( !i) $trigger.addClass('active-trigger');
                $trigger.click(function(){
                    slide(i);
                });
            })(i);
        }
        $controls.css({
            'visibility' : 'visible',
            'z-index': 10,
            'margin-left': -$controls.width()/2
        });
        
        setTimeout(function(){
            slide(0);
            run();
        }, 500);
        
        exports.run = run;
        exports.stop = stop;
        
        function stop(){
            
            clearTimeout(timeout);
            running = false;
        }
        
        function run(){
            clearTimeout(timeout);
            last = Date.now();
            running = true;
            timeout = setTimeout(nextSlide, duration);
        }
        
        function nextSlide(){
            slide(index+1);
        }
        
        function slide(i){
            
            clearTimeout(timeout);
            if( !running ) return;
            
            if( i >= count ) i=0; else if( i<0 ) i = count-1;
            
            index = i;
            $slides.removeClass('active');
            $slides.eq(index).addClass('active');
            
            $controls.find('.trigger')
                .removeClass('active-trigger')
                .eq(index).addClass('active-trigger');
            
            var from = {
                    'width':0,
                    'height':0,
                    'margin-top':marginTop,
                    'margin-right':marginLeft
                },
                
                to = {
                    'width':contentWidth,
                    'height':contentHeight,
                    'margin-top':0,
                    'margin-right':0
                },
                easing = 'easeInOutCubic',
                dur = 400;
            
            switch( index ){
                case 0:
                    from.right = contentWidth;
                    to.right = 0;
                    $slides.eq(index).stop().css(from).animate(to,dur,easing);
                    break;
                case 1:
                    from.top = contentHeight;
                    to.top = 0;
                    $slides.eq(index).css(from).stop().animate(to,dur,easing);
                    break;
                case 2:
                    from.top = -1 * contentHeight;
                    to.top = 0;
                    $slides.eq(index).css(from).stop().animate(to,dur,easing);
                    break;
            }
            
            $phoneScroller.stop();
            $phoneScroller.animate({'margin-left': (-1*166*index)},dur,easing);
            run();
            
        };
        
    })(SlideShow);
    
    (function(exports){
        var added =false;
        $('.demo-popup').appendTo($('body'));
        $('.demo-button').overlay({
            mask: true,
            closeOnClick: true,
            target : $('.demo-popup')[0],
            onClose : SlideShow.run,
            onLoad : function(){
                SlideShow.stop();
                if( !added ) $('.demo-popup iframe')[0].src = 'https://bozuko.com/demo?play=1';
                added =  true;
            }
        });
        
    })(Demo);
    
});