module(..., package.seeall)
local places = require("places")
local util = require("util")
local widget = require("widget")

local isSimulator = "simulator" == system.getInfo("environment")

function new()
   local places = places.places
   local group = display.newGroup()
   local navBar = nil
   local disclaimer = nil
   local placesList = nil
   local menuBar = nil
   local loopButton = nil

   local function addPlacesList()
      local names = {}
      local k,v
      local pl = nil

      for k,v in ipairs(places) do
	 table.insert(names, v.name)
      end

      pl = tableView.newList{
	 data = names,
	 top = navBar.height,
	 bottom = disclaimer.height,
	 default = "listItemBg.png",
	 over = "listItemBgOver.png",
	 onRelease = function(event)
			local place = places[event.target.id]
			director:changeScene("checkinScreen","flip", place)
			return true
		     end,
	 callback = function(row) 
		       local t = display.newText(row, 0, 0, native.systemFont, 16)
		       t:setTextColor(0, 0, 0)
		       t.x = math.floor(t.width/2)
		       t.y = 23
		       return t
		    end
      }
      
      if (placesList) then
	 transition.dissolve(placesList, pl, 500, 0)
	 group:remove(placesList)
	 placesList = pl
      else
	 placesList = pl
	 transition.from(placesList, {time = 500, alpha = 0})
      end
      group:insert(placesList)
      
      navBar:toFront()
      loopButton:toFront()
      disclaimer:toFront()
      menuBar:toFront()
   end

   local function refresh(e)
      if places.stale then
	 addPlacesList()
      else
	 transition.from(placesList, {time = 500, alpha = 0})
      end 

   end

   navBar = widget.addNavBar()
   group:insert(navBar)
   loopButton = widget.addLoopButton(refresh)
   group:insert(loopButton)
   disclaimer = widget.addDisclaimer()
   group:insert(disclaimer)
   menuBar = widget.addMenuBar()
   group:insert(menuBar)
   addPlacesList()

   return group
end
