local physics = require( "physics" )

local gameScreen = display.newGroup()
function gameScreen:init()
   self.name = "games"

   local width = 320
   local height = 480
   physics.start()
   physics.setScale( 60 )
   physics.setGravity( 0, 9.8 ) -- initial gravity points downwards
   
   system.setAccelerometerInterval(100) -- set accelerometer to maximum responsiveness
   Runtime:addEventListener("accelerometer", self)

   local walls = {top = display.newImage("horiz_border.png", 0, 0),
		 right = display.newImage("vert_border.png", width-10, 0),
		 bottom = display.newImage("horiz_border.png", 0, height-10),
		 left = display.newImage("vert_border.png", 0, 0)}

   for k,v in pairs(walls) do
      self:insert(v)
      physics.addBody(v, "static", {density = .8, friction = 0.3, bounce = 0.2})
   end

   local dieProps = {density = 1.2, friction = 0.3, bounce = 0.2}
   
   local die1 = display.newImage("dice_1.png", 100, 100)
   local die2 = display.newImage("dice_2.png", 150, 150)
   self:insert(die1)
   self:insert(die2)
   physics.addBody(die1, dieProps)
   physics.addBody(die2, dieProps)

   die1:addEventListener("touch", self)
   die2:addEventListener("touch", self)
end

function gameScreen:accelerometer(event) 
   physics.setGravity( ( 9.8 * event.xGravity ), ( -9.8 * event.yGravity ) )
end

function gameScreen:touch(event)
   local body = event.target
   local phase = event.phase
   local stage = display.getCurrentStage()
   
   if "began" == phase then
      stage:setFocus( body, event.id )
      body.isFocus = true
      
      -- Create a temporary touch joint and store it in the object for later reference
      body.tempJoint = physics.newJoint( "touch", body, event.x, event.y )
      
   elseif body.isFocus then
      if "moved" == phase then
	 
	    -- Update the joint to track the touch
	 body.tempJoint:setTarget( event.x, event.y )
	 
      elseif "ended" == phase or "cancelled" == phase then
	 stage:setFocus( body, nil )
	 body.isFocus = false
	 
	 -- Remove the joint when the touch ends                 
	 body.tempJoint:removeSelf()
      end
   end

   -- Stop further propagation of touch event
   return true
end

function gameScreen.new() 
   gameScreen:init()
   return gameScreen
end

return gameScreen
