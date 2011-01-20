module(..., package.seeall)

function new()
   local group = display.newGroup()
   local img = display.newImage("bozukoCard.png")
   group:insert(img)
   return group
end