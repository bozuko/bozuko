var Pdf = require('pdfkit'),
    async = require('async');

exports.create = function(contest_id, callback) {
  var contest = null,
      pdf = null,
      codes = null;
  async.series([
    function(cb) {
      getContest(contest_id, function(err, _contest) {
        contest = _contest;
        cb(err);
      });
    },
    function(cb) {
      getCodes(contest, function(err, _codes) {
        codes = _codes;
        cb(err);
      });
    },
    function(cb) {
      createPdf(contest, codes, function(err, _pdf) {
        pdf = _pdf;
        cb(err);
      });
    }
  ], function(err) {
      console.log('err = '+err);
    if (err) return callback(err);
    callback(null, pdf);
  });
}

// exported for testing only
exports.createPdf = createPdf; 

function getContest(contest_id, callback) {
  Bozuko.models.Contest.findById(
      contest_id, 
      {name: 1, start: 1, end: 1, results: 1, engine_type: 1},
      callback);
}

function getCodes(contest, callback) {
  var codes = [];
  if (contest.engine_type === 'order') {
    Object.keys(contest.results).forEach(function(key) {
      var code = contest.results[key].code;
      if (code) codes.push(code);
    });
    return callback(null, codes);
  } 
  Bozuko.models.Result.find({contest_id: contest._id}, {code:1}, callback);
}

function createPdf(contest, codes, callback) {
  var doc = new Pdf({size: 'letter', margins: {top: 20, left: 20, right: 20, bottom: 20}});
  doc.info.Title = contest.name;
  doc.registerFont('Bozuko',Bozuko.dir+'/resources/fonts/arvo/Arvo-Regular.ttf','ArvoRegular');

  var header = contest.name + ': '+contest.start+' - '+contest.end;
  doc.fill('#D3D3D3').font('Bozuko').fontSize(24).fill('black').text(header);
  doc.moveDown();

  codes.forEach(function(code) {
    doc.fill('#D3D3D3').font('Bozuko').fontSize(20).fill('black').text(code);
    doc.moveDown();
  });

  callback(null, doc);
}
