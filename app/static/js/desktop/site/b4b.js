jQuery( function($){
    var
        self = {},
        bottom = $('.b4b-bottom'),
        nextBtn, prevBtn,
        tabs = $('.tabs li', bottom),
        slides_ct = $('.slides', bottom),
        scroller = $('.slides .scroller', bottom),
        slides = $('.slides .slide', bottom),
        width = slides_ct.width()
        ;
    
    if( tabs.length !== slides.length ) throw "Unmatched number of slides and tabs";
    
    var count = slides.length,
        active = 0,
        h = 0,
        imgs = 0,
        loaded =0
        ;
    
    tabs.each( function(index, tab){
        
        $(slides[index])
            .css({
                position: 'absolute',
                top: 0,
                overflow: 'hidden',
                width: width,
                left: index * width,
                display: 'block'
            });
        
        
        $('img', slides[index]).each(function(j, img){
            imgs++;
            img.onload = setHeight;
        });
        
        $(tab).click(function(){
            goTo(index);
        });
    });
    function setHeight(){
        if( imgs !== ++loaded ) return;
        slides.each(function( index, slide ){
             h = Math.max(h, $(slide).height() );
        });
        slides_ct.animate({height: h});
    }
    
    // add next / previous arrows
    
    $.each(['next', 'prev'], function(index, action){
        var str = action == 'next' ? '&gt;' : '&lt;';
        self[action+'Btn'] = $('<a class="nav-arrow nav-arrow-'+action+'"><span>'+str+'</span></a>')
            .appendTo(bottom)
            .hover(
                function over(){
                    $(this).addClass('nav-arrow-hover');
                },
                function out(){
                    $(this).removeClass('nav-arrow-hover');
                }
            )
            .click(function(){
                self[action]();
            });
        disableSelect( self[action+'Btn'][0] );
    });
    self.prevBtn.addClass('nav-arrow-inactive');
    
    /*
    hero.hover(
        function over(){
            isOver=true;
            if( interval ) clearInterval(interval);
        },
        function out(){
            isOver=false;
            resetInterval();
        }
    )
    
    resetInterval();
    
    function resetInterval(){
        if( interval ) clearInterval(interval);
        if( !isOver ) interval = setInterval(next, slideInterval);
    }
    */
    
    function disableSelect(target){
        if (typeof target.onselectstart!="undefined") //IE route
            target.onselectstart=function(){return false}
    
        else if (typeof target.style.MozUserSelect!="undefined") //Firefox route
            target.style.MozUserSelect="none"
    
        else //All other route (ie: Opera)
            target.onmousedown=function(){return false}
    }
    
    function goTo(index){
        //resetInterval();
        if( index === active ) return;
        
        $('.tabs .active', bottom).removeClass('active');
        $(tabs[index]).addClass('active');
        scroller.stop().animate({left: -width* index});
        active = index;
        
        // self.nextBtn[active >= count-1 ? 'addClass' : 'removeClass']('nav-arrow-inactive');
        // self.prevBtn[active <= 0 ? 'addClass' : 'removeClass']('nav-arrow-inactive');
    }
    
    function next(){
        goTo( active + 1 >= count ? 0 : active + 1 );
    }
    
    function prev(){
        goTo( active - 1 < 0 ? count - 1 : active - 1);
    }
    
    self.next = next;
    self.prev = prev;
    
    goTo(0);
});