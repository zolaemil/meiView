test( "filterMei", function() {
  
  // Test preparation
  
  var meiXml = loadXMLDoc('DC1209E.xml');

  //Function under test
  
  var filteredXml = meiView.filterMei(meiXml);
  
  //Assertions
  
  var music = filteredXml.getElementsByTagNameNS("http://www.music-encoding.org/ns/mei", 'music')[0];  
  var pbs = $(music).find('pb');
  ok(pbs.length === 0, "No page breaks.");
  
  var assertStaffDef = function(meinode, sd_id, attrname, value) {
    var sd = $(meinode).find('staffDef[xml\\:id="' + sd_id + '"]'); 
    ok(sd.length == 1, "staffDef found: " +  sd_id); 
    ok($(sd[0]).attr(attrname) == value, 'attribute value: '+ attrname + ' == ' + value.toString());
  }

  assertStaffDef(music, "sd1", 'meter.count', '2');
  assertStaffDef(music, "sd2", 'meter.count', '2');
  assertStaffDef(music, "sd3", 'meter.count', '2');
  assertStaffDef(music, "sd4", 'meter.count', '2');
  assertStaffDef(music, "sd5", 'meter.count', '2');
  assertStaffDef(music, "sd6", 'meter.count', '2');
  assertStaffDef(music, "sd7", 'meter.count', '2');
  assertStaffDef(music, "sd8", 'meter.count', '2');
  assertStaffDef(music, "sd9", 'meter.count', '2');
  assertStaffDef(music, "sd10", 'meter.count', '2');

  assertStaffDef(music, "sd1", 'meter.unit', '2');
  assertStaffDef(music, "sd2", 'meter.unit', '2');
  assertStaffDef(music, "sd3", 'meter.unit', '2');
  assertStaffDef(music, "sd4", 'meter.unit', '2');
  assertStaffDef(music, "sd5", 'meter.unit', '2');
  assertStaffDef(music, "sd6", 'meter.unit', '2');
  assertStaffDef(music, "sd7", 'meter.unit', '2');
  assertStaffDef(music, "sd8", 'meter.unit', '2');
  assertStaffDef(music, "sd9", 'meter.unit', '2');
  assertStaffDef(music, "sd10", 'meter.unit', '2');
  
});