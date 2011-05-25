var Profiler = Bozuko.require('util/profiler');

exports.routes = {
  '/profiles' : {
      get: {
	  handler: function(req, res) {

	      var sort = req.param('sort');

              var profiles = Profiler.getProfileStrings(sort);
	      return res.send(profiles);
	  }
      }
  },

  '/profiles/clear': {
      get: {
	  handler: function(req, res) {
	      Profiler.deleteProfiles();
	      return res.end();
	  }
      }
  }
};