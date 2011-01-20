module(..., package.seeall)
local places = require("places")
local util = require("util")
local widget = require("widget")
local tableView = require("tableView")

local isSimulator = "simulator" == system.getInfo("environment")

function new()
   local data = places.data
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

      for k,v in ipairs(data) do
	 table.insert(names, v.name)
      end

      pl = tableView.newList{
	 data = names,
	 top = navBar.height,
	 bottom = disclaimer.height,
	 default = "listItemBg.png",
	 over = "listItemBgOver.png",
	 onRelease = function(event)
			local place = data[event.target.id]
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
      native.setActivityIndicator(true)
      timer.performWithDelay(1, function()
				   places:loadPlaces()
				   addPlacesList()
				   transition.from(placesList, {time = 500, alpha = 0})
				   native.setActivityIndicator(false)
				end)
   end

   navBar = widget.newNavBar()
   group:insert(navBar)
   loopButton = widget.newLoopButton(refresh)
   group:insert(loopButton)
   disclaimer = widget.newDisclaimer()
   group:insert(disclaimer)
   menuBar = widget.newMenuBar()
   group:insert(menuBar)
   addPlacesList()

   return group
end
