var async = require('async'),
    express = require('express'),
    bozuko = require('../../../../bozuko');

// Initialize Bozuko
process.env.NODE_ENV='test';
bozuko.app = express.createServer();
bozuko.init();


