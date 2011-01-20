module(..., package.seeall)

local games = {}
function games.coinflip(result)
   local coinflip = require("coinflip")
   return coinflip.new(result)
end

function new(t)
   local group = display.newGroup()

   local navBar = widget.newNavBar()
   group:insert(navBar)

   local backButton = widget.newBackButton(function(event) 
					      director:changeScene("checkinScreen","flip", t.place)
					   end)
   group:insert(backButton)

   local disclaimer = widget.newDisclaimer()
   group:insert(disclaimer)

   local menuBar = widget.newMenuBar()
   group:insert(menuBar)
   
   group:insert(games[t.game.name](t.game.result))
   return group
end
