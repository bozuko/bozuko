module(..., package.seeall)

local widget = require("widget")

function new(result)
   local group = display.newGroup()

   local coinY = widget.screenTop + 40 + 80
   local coinX = display.contentWidth/2
   
   local tails = display.newImage("goldEagleTails160x160.png")
   tails.isVisible = true
   tails.x = coinX
   tails.y = coinY
   group:insert(tails)

   local heads = display.newImage("goldEagleHeads160x160.png")
   heads.x = coinX
   heads.y = coinY
   group:insert(heads)


   local fxTime = 50
   local flipCt = 0
   local faceShowing = "heads"
   local done = false
   local pick = nil

   local function flip()
      local flipToTails = function()
	 transition.to(heads, {xScale=0.001, time=fxTime, transition = easing.linear})		     
    	 tails.xScale = 0.001
	 transition.to (tails, {xScale=1, delay=fxTime, time=fxTime*2, 
				transition = easing.linear, onComplete = flip})
	 faceShowing = "tails"
      end
      
      local flipToHeads = function()
         transition.to(tails, {xScale=0.001, time=fxTime, transition = easing.linear})		     
	 heads.xScale = 0.001
	 transition.to (heads, {xScale=1, delay=fxTime, time=fxTime*2, 
				transition = easing.linear, onComplete = flip})
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
	       flipToTails()
	    else
	       flipToHeads()
	    end
	 end
	 done = true

	 if result == pick then
	    print("you won")
	    group:insert(widget.newWinMsg())
	    group:insert(widget.newRedemptionButton(nil))
	 else
	    print("you lost")
	    group:insert(widget.newLoseMsg())
	 end
	 
      end
 
   end

   local function onComplete(e)
      if e.action == "clicked" then
	 if e.index == 1 then
	    pick = "heads"
	 elseif e.index == 2 then
	    pick = "tails"
	 end
	 flip()
      end
   end

   local alert = native.showAlert("Coin Flip", "Please choose heads or tails", {"heads", "tails"}, onComplete)

   return group
end
