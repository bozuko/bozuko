The game\_state object will change more frequently than all other objects. The
[game_state](#/links/game_state) link can be polled for the current information.

When displaying the game description page, the Play / Enter button will either
be enabled or disabled. If enabled, the button_action will be one of two states:

+ **enter** This requires a call to the [game_entry](#/links/game_entry) link which
  will return an updated game state (most likely increased amount of tokens). This
  needs to be called before the game screen is displayed (a loading icon should be
  displayed while waiting for the response).
  
+ **play** This does not require a call to the server and the game screen can
  immediately be shown to the user.