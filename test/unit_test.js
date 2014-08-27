test( "filterMei", function() {
  
  // Test preparation
  
  var meiXml = meiView.Util.loadXMLDoc('DC1209E.xml');

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

  assertStaffDef(music, "sd1", 'meter.count', '4');
  assertStaffDef(music, "sd2", 'meter.count', '4');
  assertStaffDef(music, "sd3", 'meter.count', '4');
  assertStaffDef(music, "sd4", 'meter.count', '4');
  assertStaffDef(music, "sd5", 'meter.count', '4');
  assertStaffDef(music, "sd6", 'meter.count', '4');
  assertStaffDef(music, "sd7", 'meter.count', '4');
  assertStaffDef(music, "sd8", 'meter.count', '4');
  assertStaffDef(music, "sd9", 'meter.count', '4');
  assertStaffDef(music, "sd10", 'meter.count', '4');

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

  // assert converted accidentals

  var dir = $(music).find('measure[n="3"]').find('dir');
  ok(dir.length > 0, 'direction in measure 3');
  ok($(dir).html() == '#', 'content of direction in measure 3');
  ok($(dir).attr('startid') == 'p1cgd4n1536v1b4s1', 'startid of dir in measure 3');
  ok($(music).find('note[xml\\:id="p1cbd4n1280v1b11s3"]').attr('accid') == 'f', 'accid attribute of note#p1cbd4n1280v1b11s3');
  
});


test( "meiView.Pages - auto", function() {
  console.log(meiView);
  var pgs1 = new meiView.Pages({
    length: 10,
    mpp: 3,
  });

  var pgs2 = new meiView.Pages({
    length: 36,
    mpp: 5,
  });

  ok(pgs1.totalPages() == 4, 'number of pages: ' + pgs1.totalPages()  + ' (excepted 4)');
  ok(pgs2.totalPages() == 8, 'number of pages: ' + pgs2.totalPages()  + ' (excepted 8)');

  pgs1.nextPage();

  ok(pgs1.currentPage().startMeasureN == 1);
  ok(pgs1.currentPage().endMeasureN == 3);

  pgs1.nextPage();

  ok(pgs1.currentPage().startMeasureN == 4);
  ok(pgs1.currentPage().endMeasureN == 6);

  pgs1.nextPage();

  ok(pgs1.currentPage().startMeasureN == 7);
  ok(pgs1.currentPage().endMeasureN == 9);

  pgs1.nextPage();

  ok(pgs1.currentPage().startMeasureN == 10);
  ok(pgs1.currentPage().endMeasureN == 10);

  ok(pgs2.whichPage(12) == 2);

  pgs2.jumpToMeasure(36);
  ok(pgs2.currentPage().startMeasureN == 36);
  ok(pgs2.currentPage().endMeasureN == 36);
});
