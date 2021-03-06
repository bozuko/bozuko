local http = require("socket.http")
local json = require("json")

local t = {
   data = nil,
   latitude = nil,
   longitude = nil,
   stale = true
}

function t:loadPlaces()
   local req = "http://bozuko.com:8000/places/list?lat="..self.latitude.."&lng="..self.longitude
   
   local resp = http.request(req)
   if (not resp) then
      native.showAlert("Error", "Failed to retrieve data from bozuko.com", {"OK"}, function(e) end)
      -- FIXME
      return "false"
   end
   
   local jsonTable = json.decode(resp)
   self.data = jsonTable.data
   self.stale = false
end

return t
