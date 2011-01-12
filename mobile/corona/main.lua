display.setStatusBar(display.HiddenStatusBar)
io.output():setvbuf('no') 

local ui = require("ui")
local json = require("json")
local tableView = require("tableView")
local facebook = require("facebook")
local director = require("director")
local util = require("util")
local places = require("places")

local latitude = nil
local longitude = nil
local group = display.newGroup()

local function onLocation(event)
   places.latitude = event.latitude
   places.longitude = event.longitude
   places.stale = true
   if (not places.places) then
      places:loadPlaces()
      director:changeScene("placesScreen", "flip")
   end
end


group:insert(director.directorView)
director:changeScene("splashScreen")
system.setLocationAccuracy(10)
system.setLocationThreshold(5)
Runtime:addEventListener("location", onLocation)
