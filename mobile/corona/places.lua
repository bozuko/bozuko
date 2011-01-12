local http = require("socket.http")

local t = {
   places = nil,
   latitude = nil,
   longitude = nil,
   stale = true
}

function t:loadPlaces()
   local req = "http://bozuko.com:8000/places/list?lat="..self.latitude.."&lng="..self.longitude
   local path = system.pathForFile("places.json", system.DocumentsDirectory)
   
   native.setActivityIndicator(true)
   local resp = http.request(req)
   if (not resp) then
      native.setActivityIndicator(false)
      native.showAlert("Error", "Failed to retrieve data from bozuko.com", {"OK"}, function(e) end)
      -- FIXME
      return "false"
   end
   
   local jsonTable = json.decode(resp)
   native.setActivityIndicator(false)
   self.places = jsonTable.data
   self.stale = false
end

return t