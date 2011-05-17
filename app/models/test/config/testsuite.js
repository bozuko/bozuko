
process.env.NODE_ENV='test';


var express = require('express'),
    bozuko = require('../../../../app/bozuko');

// Initialize Bozuko
bozuko.getApp();
