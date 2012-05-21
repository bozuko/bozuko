process.env.NODE_ENV='test';
var bozuko = require('../bozuko');
bozuko.getApp();
var codePdf = require('../codePdf');

var contest = {
  name: 'Some Shitty Contest',
  start: new Date(),
  end: new Date(Date.now+1000000)
};

var codes = [
  '12345',
  '23456',
  '34567',
  '45678',
  '56789',
  '67890',
  '78901',
  '89012'
];

exports['createPdf works'] = function(test) {
  codePdf.createPdf(contest, codes, function(err, pdf) {
    test.ok(!err);
    pdf.write('codes.pdf');
    test.done();
  });
};
