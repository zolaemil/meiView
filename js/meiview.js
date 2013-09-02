var meiView = {};

meiView.createSourceList = function(Apps) {
  var result = {}
  for(appID in Apps) {
    var app = Apps[appID];
    for(varXMLID in app.variants) {
      var variantItem = app.variants[varXMLID];
      if (variantItem.tagname === 'rdg') {
        if (!variantItem.source) throw "meiView Error: no source specified for rdg: '" + variantItem.xmlID +"'";
        var srcIDs = variantItem.source.split(' ');
        for (var k=0; k<srcIDs.length; k++) {
          var srcID = srcIDs[k];
          if (!result[srcID]) {
            result[srcID] = [];
          }
          result[srcID].push( { appID:app.xmlID } );
        } 
      } else {
        if (!result['lem']) {
          result['lem'] = [];
        }
        result['lem'].push( { appID:app.xmlID } );
      }
    }
  }
  return result;
}


meiView.Page = function(start, end) {
  this.startMeasureN = start;
  this.endMeasureN = end;
}

meiView.Pages = function() {
  this.pages = [];
  this.currentPageIndex = -1;
}

meiView.Pages.prototype.AddPage = function(start, end) {
  this.pages.push(new meiView.Page(start, end));
}

meiView.Pages.prototype.nextPage = function() {
  if (this.currentPageIndex<this.pages.length-1) {
    this.currentPageIndex++;
  }
}

meiView.Pages.prototype.prevPage = function() {
  if (this.currentPageIndex>0) {
    this.currentPageIndex--;
  }
}

meiView.Pages.prototype.currentPage = function() {
  return this.pages[this.currentPageIndex];
}

meiView.Pages.prototype.totalPages = function() {
  return this.pages.length;
}

meiView.nextPage = function(){
  this.pages.nextPage();
  this.displayCurrentPage();
}

meiView.prevPage = function(){
  this.pages.prevPage();
  this.displayCurrentPage();
}


meiView.pages = new meiView.Pages();
meiView.scoreWidth = 1000;
meiView.scoreHeight = 1000;
meiView.dots = {};

meiView.DisplayMainMEI = function(score, canvas) {
  var score_width = $(canvas).attr('width') - 20;
  var score_height = $(canvas).attr('height') - 20;
  Vex.LogInfo('Rendering main MEI... ');
  MEI2VF.render_notation(score, canvas, score_width, score_height);
  Vex.LogInfo('Done rendering main MEI');
  return canvas;  
}

meiView.displayCurrentPage = function() {

  // var variant_page_xmlDoc = loadXMLDoc('xml/Rogamus.xml');
  // var single_path_score = MeiLib.createSingleVariantPathScore(meiView.appReplacements, variant_page_xmlDoc);  

  var pageXML = meiView.getPageXML(meiView.pages.currentPage());
  /* pageXML is singleVariantScore, therefore can be displayed. */
  var tempCanvas = new fabric.StaticCanvas();
  tempCanvas.setDimensions({width:meiView.scoreWidth, height:meiView.scoreHeight});
  meiView.DisplayMainMEI(pageXML, tempCanvas);
  var img = new Image;
  img.src = tempCanvas.toDataURL();
  if (meiView.scoreImg) {
    meiView.fabrCanvas.remove(meiView.scoreImg);    
  }
  meiView.scale = meiView.fabrCanvas.width/meiView.scoreWidth;
  var W = meiView.fabrCanvas.width;
  var H = meiView.scoreHeight * meiView.scale;
  meiView.scoreImg = new fabric.Image(img, {
    width:W,height:H, left:W/2, top:H/2,
    lockMovementX: true,
    lockMovementY: true,
    lockScalingX: true,
    lockScalingY: true,
    lockRotation: true,
    hasControls: false,
    hasBorders: false,
    selectable: false,
  });
  meiView.fabrCanvas.add(meiView.scoreImg);
  meiView.displayDots();
  
  $('#pageNumber').html((meiView.pages.currentPageIndex+1).toString() + '/' + meiView.pages.totalPages());
}

/**
 * Call web service to get xml containing measures from
 * page.startMeasure to page.endMeasure
 * 
 * @param page {mewView.Page} to specify measure numbers.
 * @return xml string
 */
meiView.getPageXML = function(page) {
  var noMeter = (page.startMeasureN !== 1);
  return meiView.currentScore.getSlice({start_n:page.startMeasureN, end_n:page.endMeasureN, noMeter:noMeter});
}

meiView.loadXMLString = function(txt) {
  if (window.DOMParser)
  {
    parser=new DOMParser();
    xmlDoc=parser.parseFromString(txt,"text/xml");
  }
  else // Internet Explorer
  {
    xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
    xmlDoc.async=false;
    xmlDoc.loadXML(txt); 
  }
  return xmlDoc;
}

meiView.displayDots = function() {
  for (dot in meiView.dots) {
    meiView.fabrCanvas.remove(meiView.dots[dot]);
  }
  for (appID in meiView.MEI.APPs) {
    meiView.displayDotForAPP(appID);
  }
}

meiView.displayDotForAPP = function(appID) {

  // In order to know what coordiantes to display the dot at, we have to
  // get the coordinates of the VexFlow staff object. VexFlow staff objects are 
  // exposed by MEI2VF via the MEI2VF.rendered_measures:
  // MEI2VF.rendered_measures is indexed by the measure number and staff number.
  // so, in order to retreive the right measure we have to know the measure number and the 
  // staff number:

  // get the meausure number first, 
  var app = $(meiView.MEI.score).find('app[xml\\:id="' + appID + '"]')[0];
  var parent_measure = $(app).parents('measure');
  var measure_n = parent_measure.attr('n');

  // then the staff number...
  var parent_staff = $(app).parents('staff');
  var staff_n;
  if (parent_staff.length === 0) {
    var child = $(app).find('[staff]')
    staff_n = $(child).attr('staff');
  } else {
    staff_n = parent_staff.attr('n');
  }

  //...then get the coordinates from MEI2VF.rendered_measures
  var vexStaffs = MEI2VF.rendered_measures[measure_n];
  if (vexStaffs) {
    var vexStaff = vexStaffs[staff_n];
    if (vexStaff) {

      var left = (vexStaff.x + vexStaff.width-12) * meiView.scale;
      var top = (vexStaff.y+25) * meiView.scale;

      var circle = new fabric.Circle({
        radius: 5, 
        fill: 'green', 
        left:left, 
        top:top, 
        lockMovementX: true,
        lockMovementY: true,
        lockScalingX: true,
        lockScalingY: true,
        lockRotation: true,
        hasControls: false,
        hasBorders: false,
      });
      circle.meiViewID = appID;
      meiView.fabrCanvas.add(circle);
    }
  }

  meiView.dots[appID] = circle;

}

meiView.displayVariantInstances = function(appID) {
  
}

