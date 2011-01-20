module(..., package.seeall)

local widget = require("widget")

function new(result)
   local group = display.newGroup()
   
   local heads = display.newImage("goldEagleHeads160x160.png")
   local coinY = widget.screenTop + 40 + heads.height/2
   local coinX = display.contentWidth/2
  
   heads.x = coinX
   heads.y = coinY
   group:insert(heads)

   local tails = display.newImage("goldEagleTails160x160.png")
   tails.isVisible = false
   group:insert(tails)

   local fxTime = 50
   local flipCt = 0
   local faceShowing = "heads"
   local done = false

   local function flip(pick)
      local flipToTails = function()
	 heads.isVisible = false
	 tails.isVisible = true
	 tails.x = coinX
	 tails.xScale=0.001
	 tails.yScale=0.7
	 tails.y=coinY
	 transition.to ( tails, { xScale=0.7, delay=fxTime*2, time=fxTime } )
	 transition.to ( tails, { xScale=1, delay=fxTime*3, time=fxTime } )
	 transition.to ( tails, { yScale=1, delay=fxTime*3, time=fxTime, onComplete = flip } )
	 faceShowing = "tails"
      end
      
      local flipToHeads = function()
	 heads.isVisible = true
	 tails.isVisible = false
	 transition.to ( heads, { xScale=0.7, time=fxTime } )
	 transition.to ( heads, { yScale=0.7, time=fxTime } )
	 transition.to ( heads, { xScale=0.001, delay=fxTime, time=fxTime, onComplete = flip } )
	 faceShowing = "heads"
      end
      
      if done then
	 return
      end

      if flipCt < 20 then
	 -- Keep spinning
	 if faceShowing == "heads" then
	    flipToTails()
	 else
	    flipToHeads()
	 end
	 flipCt = flipCt +1
      else
	 -- Make sure proper result is showing
	 if result ~= faceShowing then
	    if faceShowing == "heads" then
	       flipToHeads()
	    else
	       flipToTails()
	    end
	 end
	 done = true
      end
 
   end

   local function onComplete(e)
      if e.action == "clicked" then
	 if e.index == 1 then
	    flip("heads")
	 elseif e.index == 2 then
	    flip("tails")
	 end
      end
   end

   local alert = native.showAlert("Coin Flip", "Please choose heads or tails", {"heads", "tails"}, onComplete)

   return group
end
