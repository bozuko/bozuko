module(..., package.seeall)

local util = require("util")
local ltn12 = require("ltn12")
local http = require("socket.http")
local string = require("string")

local isSimulator = "simulator" == system.getInfo("environment")

function new(t)
   local group = display.newGroup()
   local place = t
   local navBar = nil

   math.randomseed(os.time())
   
   -- FIXME: this should get parsed from the place data
   local resultf = function()
		      if math.random() < .5 then
			 return "heads"
		      else
			 return "tails"
		      end
		   end
   local result = resultf()
   
   local game = {
      name = "coinflip", 
      result = result
   }
   
   local function checkin()
      local token, userId
      local path = system.pathForFile("fbauth.txt", system.DocumentsDirectory)

      local function sendCheckin()
	 http.request{url = "http://bozuko.com:8000/place/"..place.id.."/game",
		      headers = {BOZUKO_FB_USER_ID = userId, BOZUKO_FB_ACCESS_TOKEN = token}}
	 director:changeScene("gameScreen","flip", {place = place, game = game})
      end

      local function urlRequest(e)
	 local url = e.url
	 token, userId = string.match(url, "/token/(.+)/user/(%w+)")
	 if (token ~= nil) then
	    native.cancelWebPopup()
	    file = io.open(path, 'wb')
	    if file then
	       file:write(token, "\n", userId)
	       io.close(file)
	       print("Wrote fbauth.txt")
	       sendCheckin()
	    else
	       print("Could not open fbauth.txt for writing")
	    end
	    
	 end				      
	 return true
      end
      
      local file = io.open(path, 'r')
      if not file then
	 native.showWebPopup("http://bozuko.com:8000/get_token", {hasBackground = true, urlRequest = urlRequest})	 
      else
	 token = file:read()
	 userId = file:read()
	 io.close(file)
	 sendCheckin()
      end

   end

   local function addDivider(y)
      print("addDivider")
      y = y + 10
      dividerBar = display.newRect(group, 0, y, display.contentWidth, 25)
      dividerBar:setFillColor(150,150,150)
      dividerText = display.newText(group, "Available Games", 0, 0, native.systemFontBold, 20)
      dividerText.x = display.contentWidth/2
      dividerText.y = dividerBar.y
      dividerText:setTextColor(0,0,0)
      return y
   end

   local function addGames(y)
      print("addGames")
      
      -- retrieve all game images if they don't already exist. We probably want some kind of 
      -- expiry timer for them so they can be updated on the server
      local k, v
      local regex = "%/([^%/]+%.png)"
      for k,v in pairs(place.games) do
	 local filename = string.match(v.icon, regex)
	 local path = system.pathForFile(filename, system.DocumentsDirectory)
	 local file = io.open(path, 'r')
	 if not file then
	    file = io.open(path, 'wb')
	    http.request{url = "http://bozuko.com:8000"..v.icon, sink = ltn12.sink.file(file)}
	 else
	    io.close(file)
	 end
      end

      local gamesList = tableView.newList{
	 data = place.games,
	 top = y,
	 onRelease = function(event) 
		     end,
	 callback= function(row)
		     local group = display.newGroup()
		     
		     local filename = string.match(row.icon, regex)
		     local img = display.newImage(filename, system.DocumentsDirectory, 0, 0)

		     -- Fixme: The images coming from the server shouldn't need to be scaled
		     img:scale(.3,.3)
		     img:setReferencePoint(display.CenterLeftReferencePoint)
		     img.x = 0
		     group:insert(img)

		     local nameX = img.contentWidth + 10
		     local nameY = img.y - img.contentHeight/2
		     local name = display.newText(group, row.name, nameX, nameY, native.systemFontBold, 16)
		     name:setTextColor(0,0,0)

		     local desc = display.newText(group, "You could win:", nameX, 0, native.systemFont, 16)
		     desc.y = nameY + name.contentHeight + 20
		     desc:setTextColor(0,0,0)

		     local prize = util.autoWrappedText(row.prize, native.systemFont, 16, {0,0,0}, display.contentWidth - nameX)
		     prize:setReferencePoint(display.TopLeftReferencePoint)
		     prize.x = nameX
		     prize.y = nameY + 2*name.contentHeight + 20
		     group:insert(prize)

		     local button = ui.newButton {
			default = "buttonGreen.png",
			over = "buttonGreenOver.png",
			onEvent = function(event)
				     if (isSimulator) then
					director:changeScene("gameScreen","flip", 
							     {place = place, game = game})
				     else
					checkin()
				     end
				  end,
			text = "Checkin and Play",
			textColor = {255,255,255},
			size = 22,
			id = "checkinButton",
			emboss = true
		     }
		     button.x = display.contentWidth/2
		     button.y = prize.y + prize.contentHeight + 40
		     button.contentWidth = display.contentWidth - nameX
		     group:insert(button)
		     return group
		  end
      }
      group:insert(gamesList)
   end
   
   local function addBackground()
      local bg = display.newRect(group, 0,0,display.contentWidth,display.contentHeight-display.screenOriginY)
      bg:setFillColor(255,255,255)
   end

   local function addData()
      print("addData")
      local y = navBar.height + 20
      local placeName = display.newText(group, place.name, 0, y, native.systemFontBold, 16)
      placeName:setTextColor(0, 0, 0)
      y = y + placeName.height + 20
      if (place.location.street) then
	 local placeStreet = display.newText(group, place.location.street, 0, y, native.systemFont, 12)
	 placeStreet:setTextColor(75,75,75)
	 y = y + placeStreet.height
	 if (place.location.city) then
	    local placeCityState = display.newText(group, place.location.city..", "..place.location.state, 
						  0, y, native.systemFont, 12)
	    placeCityState:setTextColor(75,75,75)
	    y = y + placeCityState.height
	 end
      end
      y = addDivider(y)
      addGames(y)
   end

   addBackground()
   navBar = widget.newNavBar()
   group:insert(navBar)
   local backButton = widget.newBackButton(function(event) 
					director:changeScene("placesScreen","flip")
				     end)
   group:insert(backButton)
   local logoutButton = widget.newFacebookLogoutButton()
   group:insert(logoutButton)
   addData()
   return group
end