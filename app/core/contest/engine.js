var Engine = module.exports = function(entries, playsPerEntry){
    
}

//
//These variables should be arguments to this script
var entries=1000; //there will be 1000 entries (check-ins) in to the contest
var playsPerEntry=3 //each entry gets 3 plays (entries)
var numUniqueWheelIcons=12; //cherries, lemons, bars, 2-bars, etc.
var numEachPrize=[1,25,100,250]; //# of prize 1, # of prize 2, etc.
var iconMatchEachPrize=[3,7,9,11]; //the X-X-X winning combo for a winner (cherry-cherry-cherry)


//Internal variables
var totalPlays=0;
var totalPrizes=0;
var playArray=[];
var numPrizeTypes=numEachPrize.length;
var prizeType=0;
var numLosers=0;
var loserWheelIcon_1=0;
var loserWheelIcon_2=0;
var loserWheelIcon_3=0;
var i=0;
var j=0;


//how many total plays (spins) are we dealing with here
totalPlays=entries*playsPerEntry;

//how many result in prizes?
for (i=0;i<4;i++)
{
totalPrizes=numEachPrize[i] + totalPrizes;
}

//some summary messages about what we can expect
console.log("\nOut of ", totalPlays, "total Plays; ", totalPrizes, "are prizes");
console.log("There are "+ numPrizeTypes+" winning outcome types:");



//Get all the winners in PLAY array with the right icon patterns
for (prizeType=0;prizeType<numPrizeTypes;prizeType++)
{
console.log("Combo: "+iconMatchEachPrize[prizeType]+"-"+iconMatchEachPrize[prizeType]+"-"+iconMatchEachPrize[prizeType]+"   Prize Type: "+prizeType+"  Occurrences: "+numEachPrize[prizeType]);

  for (j=0;j<numEachPrize[prizeType];j++)
  {
   playArray.push(iconMatchEachPrize[prizeType]+"-"+iconMatchEachPrize[prizeType]+"-"+iconMatchEachPrize[prizeType]+", W, "+prizeType+"\n");
  }
}

console.log("");

//Fill in the rest of the PLAY array with loser combinations

numLosers=totalPlays-totalPrizes;
for (i=0;i<numLosers;i++)
{

 //get a loser match where nothing matches
 loserWheelIcon_1=Math.floor(Math.random()*numUniqueWheelIcons);
 loserWheelIcon_2=Math.floor(Math.random()*numUniqueWheelIcons);
 while(loserWheelIcon_1 == loserWheelIcon_2) { loserWheelIcon_2=Math.floor(Math.random()*numUniqueWheelIcons); }
 loserWheelIcon_3=Math.floor(Math.random()*numUniqueWheelIcons); 
 while(loserWheelIcon_2 == loserWheelIcon_3) { loserWheelIcon_3=Math.floor(Math.random()*numUniqueWheelIcons); }

 playArray.push(loserWheelIcon_1+"-"+loserWheelIcon_2+"-"+loserWheelIcon_3+", L, "+"NULL\n");

} 


//Fisher-Yates Shuffle of the array

var playTemp1;
var playTemp2;

i = playArray.length;
while ( --i ) 
 {
     var j = Math.floor( Math.random() * ( i + 1 ) );
     var playTemp1 = playArray[i];
     var playTemp2 = playArray[j];
     playArray[i] = playTemp2;
     playArray[j] = playTemp1;
 }


//Write out to a file
console.log("\noutput format is: Play-Result[X-Y-Z], [W]inner/[L]oser, Prize-Type");
console.log("output to output.txt");

var fs = require('fs');
fs.open('./output.txt', 'w', 666, function( e, id ) {
  for (i=0;i<playArray.length;i++)
  { 
  fs.writeSync( id, playArray[i], null, 'utf8', function(){
  fs.close(id, function(){ });
 });
 }
});
