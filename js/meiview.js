var meiView = {};

meiView.Apps = [];
meiView.Sources = {};

meiView.createSourceList = function() {
  for(var i=0; i<meiView.Apps.length; i++) {
    var app = meiView.Apps[i];
    for (var j=0; j<app.variants.length; j++) {
      var variantItem = app.variants[j];
      if (variantItem.tagname === 'rdg') {
        if (!variantItem.source) throw "meiView Error: no source specified for rdg: '" + variantItem.xmlID +"'";
        var srcIDs = variantItem.source.split(' ');
        for (var k=0; k<srcIDs.length; k++) {
          var srcID = srcIDs[k];
          if (!meiView.Sources[srcID]) {
            meiView.Sources[srcID] = [];
          }
          meiView.Sources[srcID].push( { appID:app.xmlID } );
        } 
      } else {
        if (!meiView.Sources['Lemma']) {
          meiView.Sources['Lemma'] = [];
        }
        meiView.Sources['Lemma'].push( { appID:app.xmlID } );
      }
    }
  }
}


meiView.Page = function(start, end) {
  this.startMeasure = start;
  this.endMeasure = end;
}

meiView.Pages = function() {
  this.pages = [];
  this.currentPageIndex = -1;
}

meiView.Pages.prototype.AddPage = function(start, end) {
  this.pages.push(new meiView.Page(start, end));
}

meiView.Pages.prototype.nextPage = function() {
  if (this.currentPageIndex<meiView.pages.length-1) {
    this.currentPageIndex++;
  }
}

meiView.Pages.prototype.prevPage = function() {
  if (this.currentPageIndex>0) {
    this.currentPageIndex--;
  }
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
meiView.scoreHeight = 450;

meiView.DisplayMainMEI = function(score, canvas) {
  var score_width = $(canvas).attr('width') - 20;
  var score_height = $(canvas).attr('height') - 20;
  Vex.LogInfo('Rendering main MEI... ');
  MEI2VF.render_notation(score, canvas, score_width, score_height);
  Vex.LogInfo('Done rendering main MEI');
  return canvas;  
}

meiView.displayCurrentPage = function() {

  // var pageXML = meiView.getPageXML(meiView.pages[meiView.current_page_index]);
  // var variant_page_xmlDoc = meiView.loadXMLString(pageXML);
  var variant_page_xmlDoc = loadXMLDoc('xml/RogamusPage01.xml');
  var single_path_score = MeiLib.createSingleVariantPathScore(meiView.appReplacements, variant_page_xmlDoc);  
  var tempCanvas = new fabric.StaticCanvas();
  tempCanvas.setDimensions({width:meiView.scoreWidth, height:meiView.scoreHeight});
  meiView.DisplayMainMEI(single_path_score, tempCanvas);
  var img = new Image;
  img.src = tempCanvas.toDataURL();
  if (meiView.scoreImg) {
    meiView.fabrCanvas.remove(meiView.scoreImg);    
  }
  var scale = meiView.fabrCanvas.width/meiView.scoreWidth;
  var W = meiView.fabrCanvas.width;
  var H = meiView.scoreHeight * scale;
  meiView.scoreImg = new fabric.Image(img, {width:W,height:H, left:W/2, top:H/2});
  meiView.scoreImg.hasControls = false;
  meiView.fabrCanvas.add(meiView.scoreImg);
}

/**
 * Call web service to get xml containing measures from
 * page.startMeasure to page.endMeasure
 * 
 * @param page {mewView.Page} to specify measure numbers.
 * @return xml string
 */
meiView.getPageXML = function(page) {
  //TODO
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