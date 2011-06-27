jQuery( function($){
    var
        self = {},
        hero = $('.hero'),
        isOver = false,
        interval,
        nextBtn, prevBtn,
        slideInterval = 1000 * 6,
        imgs = $('.hero .iphone .screenshots img'),
        screenshots = $('.hero .iphone .screenshots'),
        scroller = $('.hero .iphone .screenshots .scroller'),
        slides_ct = $('.hero .slides'),
        slides = $('.hero .slide'),
        slide_ct = $('.hero .content'),
        slide_height = slide_ct.height(),
        slide_scroller = $('.hero .content .scroller'),
        nav = $('.hero .nav'),
        navs = [],
        width = screenshots.width()
        ;
    
    if( imgs.length !== slides.length ) throw "Unmatched number of slides and images";
    
    var count = imgs.length,
        active = 0
        ;
    
    imgs.each( function(index, img){
        
        $(img)
            .css({
                position: 'absolute',
                top: 0,
                left: index * width
            });
            
        $(slides[index])
            .css({
                position: 'absolute',
                left: 0,
                top: index * slide_height,
                display: 'block'
            });
            
        var text = $('h3 .title', slides[index]).text();
        
        var a = $('<a href="javascript:;">&bull;</a>')
            .attr('title', (index+1)+'. '+ text)
            .appendTo(nav)
            .click( function(){
                goTo(index)
            });
        
        navs.push(a);
        
        if( index === 0 ) a.addClass('active');
    });
    
    // add next / previous arrows
    $.each(['next', 'prev'], function(index, action){
        var str = action == 'next' ? '&gt;' : '&lt;';
        self[action+'Btn'] = $('<a class="nav-arrow nav-arrow-'+action+'">'+str+'</a>')
            .appendTo(slide_ct)
            .hover(
                function over(){
                    $(this).addClass('nav-arrow-hover');
                },
                function out(){
                    $(this).removeClass('nav-arrow-hover');
                }
            )
            .click(function(){self[action]()});
    });
    console.log(self);
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
    
    function goTo(index){
        //resetInterval();
        if( index === active ) return;
        
        $('.active', nav).removeClass('active');
        navs[index].addClass('active');
        scroller.stop().animate({left: -width* index});
        slide_scroller.stop().animate({top: -slide_height * index});
        active = index;
        
        self.nextBtn[active >= count-1 ? 'addClass' : 'removeClass']('nav-arrow-inactive');
        self.prevBtn[active <= 0 ? 'addClass' : 'removeClass']('nav-arrow-inactive');
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