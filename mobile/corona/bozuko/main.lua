display.setStatusBar(display.HiddenStatusBar)
io.output():setvbuf('no') 

local director = require("director")
local places = require("places")

local latitude = nil
local longitude = nil
local group = display.newGroup()

local function onLocation(event)
   places.latitude = event.latitude
   places.longitude = event.longitude
   places.stale = true
   if (not places.data) then
      places:loadPlaces()
      director:changeScene("placesScreen", "flip")
   end
end


group:insert(director.directorView)
director:changeScene("splashScreen")
system.setLocationAccuracy(1)
system.setLocationThreshold(5)
Runtime:addEventListener("location", onLocation)
