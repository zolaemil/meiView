/***
* meiview-ui.js
* Author: Zoltan Komives
* Contributor: Raffaele Viglianti
* 
* Copyright © 2013 Zoltan Komives, Raffaele Viglianti
* University of Maryland
* 
* Licensed under the Apache License, Version 2.0 (the "License"); you
* may not use this file except in compliance with the License.  You may
* obtain a copy of the License at
* 
*    http://www.apache.org/licenses/LICENSE-2.0
* 
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
* implied.  See the License for the specific language governing
* permissions and limitations under the License.
***/

meiView.UI = {};
meiView.UI.dots = {};

meiView.UI.toCSSId = function(identifierString) {
  return identifierString.replace(/#/g, '').replace(/\./g, '_');
}

meiView.UI.liID = function(sourceID, appID) {
  return meiView.UI.toCSSId(sourceID) + '-' + meiView.UI.toCSSId(appID);
}

meiView.UI.fillSideBar = function(sidebardiv, sources, sidebar_class) {
  for(src in sources){
    var source = sources[src];
    sidebardiv.append('<h3 class="' + sidebar_class + '">'+src+'</h3><div class="' + sidebar_class + '"><ul id="' + src + '"></ul></div>');
    var listElem = sidebardiv.find('ul[id="'+src+'"]');
    for (var i=0; i<source.length; i++) {
      var appID = source[i].appID;
      
      listElem.append('<li id="' + meiView.UI.liID(src, appID) + '" class="' +  meiView.UI.toCSSId(appID) + '">' + appID + '</li>')
    }
  }
}

meiView.UI.renderMei2Canvas = function(score, options) {
  options = options || {};
  var paddingX = options.paddingX || 0;
  var paddingY = options.paddingY || 0;

  var tempCanvas = new fabric.StaticCanvas();
  tempCanvas.setDimensions({width:options.vexWidth, height:options.vexHeight});

  var score_width = options.vexWidth;
  var score_height = options.vexHeight;
  Vex.LogInfo('Rendering MEI... ');
  console.log(score);
  MEI2VF.render_notation(score, tempCanvas, score_width, score_height);
  Vex.LogInfo('Done rendering MEI');
  return tempCanvas;  
}

meiView.UI.DisplayMainMEI = function(score, canvas, options) {
  var score_width = $(canvas).attr('width') - 20
  var score_height = $(canvas).attr('height') - 20;
  Vex.LogInfo('Rendering main MEI... ');
  MEI2VF.render_notation(score, canvas, score_width, score_height);
  Vex.LogInfo('Done rendering main MEI');
  return canvas;  
}

meiView.UI.displayDots = function() {
  for (appID in meiView.UI.dots) {
    if (meiView.UI.dots[appID])
    { 
      meiView.UI.fabrCanvas.remove(meiView.UI.dots[appID].circle);
      delete meiView.UI.dots[appID];
    }
  }
  for (appID in meiView.MEI.APPs) {
    meiView.UI.dots[appID] = meiView.UI.displayDotForAPP(appID);
  }
}

meiView.UI.displayDotForAPP = function(appID) {

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

  // ...then display the dot at the coordinates specified by the
  // properties of MEI2VF.rendered_measures[measure_n][staff_n];
  var vexStaffs = MEI2VF.rendered_measures[measure_n];
  if (vexStaffs) {
    var vexStaff = vexStaffs[staff_n];
    var dotInfo = {
      appXmlID: appID, 
      measure_n: Number(measure_n),
      measure_top: vexStaff.y,
      measure_left: vexStaff.x,
      measure_width: vexStaff.width,
      staff_n: Number(staff_n),
    }
    return { circle:meiView.UI.displayDotForMeasure(vexStaff), info:dotInfo };
  }
}


meiView.UI.displayDotForMeasure = function(vexStaff) { 
  if (vexStaff) {
    var left = (vexStaff.x + vexStaff.width - 12) * meiView.UI.scale;
    var top = (vexStaff.y + 30) * meiView.UI.scale;
    // var left = vexStaff.x;
    // var top = 0; 

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
    meiView.UI.fabrCanvas.add(circle);
    return circle;
  }
}

meiView.UI.renderMei2Img = function(meixml, options) {
  var tempCanvas = meiView.UI.renderMei2Canvas(meixml, options);
  var img = new Image;
  img.src = tempCanvas.toDataURL();
  return img;
}

meiView.UI.renderPage = function(pageXML, options) { 
  options = options || {};
  options.paddingX = 20;
  options.paddingY = 20;
  options.vexWidth = options.vexWidth || $(meiView.UI.fabrCanvas.getElement()).attr('width');
  options.vexHeight = options.vexHeight || $(meiView.UI.fabrCanvas.getElement()).attr('height');
  var img = meiView.UI.renderMei2Img(pageXML, options);
  if (meiView.UI.scoreImg) {
     meiView.UI.fabrCanvas.remove(meiView.UI.scoreImg);    
  }
  meiView.UI.scale = meiView.UI.fabrCanvas.width/options.vexWidth;
  var W = meiView.UI.fabrCanvas.width;
  var H = options.vexHeight * meiView.UI.scale;
  meiView.UI.scoreImg = new fabric.Image(img, {
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
  meiView.UI.fabrCanvas.add(meiView.UI.scoreImg);
}

meiView.UI.initCanvas = function(canvasid) {

  var canvas = new fabric.Canvas(canvasid);
  canvas.hoverCursor = 'pointer';

  canvas.findTarget = (function(originalFn) {
    return function() {
      var target = originalFn.apply(this, arguments);
      if (target) {
        if (this._hoveredTarget !== target) {
          canvas.fire('object:over', { target: target });
          if (this._hoveredTarget) {
            canvas.fire('object:out', { target: this._hoveredTarget });
          }
          this._hoveredTarget = target;
        }
      }
      else if (this._hoveredTarget) {
        canvas.fire('object:out', { target: this._hoveredTarget });
        this._hoveredTarget = null;
      }
      return target;
    };
  })(canvas.findTarget);
  
  canvas.on('object:over', function(e) {
    if (e.target && e.target.meiViewID) {
      e.target.setFill('red');
      canvas.renderAll();
    }
  });

  canvas.on('object:out', function(e) {
    if (e.target && e.target.meiViewID) {
      e.target.setFill('green');
      canvas.renderAll();
    }
  });

  canvas.on('mouse:down', function(e) {
    if (e.target) {
      var dotInfo = 
        e.target.meiViewID && 
        meiView.UI.dots[e.target.meiViewID] && 
        meiView.UI.dots[e.target.meiViewID].info;
      if (dotInfo) {
        meiView.UI.ShowSelectorPanel(dotInfo);
      } else if (e.target.selectItem>=0) {
        meiView.UI.dlg && meiView.UI.dlg.select(e.target.selectItem);
      } else {
        meiView.UI.HideSelectorPanel();
      }
      console.log(e.target);
      console.log(e.target.meiViewID  + ': x:' + e.target.left + ', y:' + e.target.top);
    }
  });
  
  return canvas;
  
}

meiView.UI.onSelectorDraw = function(args) {
  meiView.selectingState.enter(args.appID, meiView.currentScore.variantPath[args.appID].xmlID);
  meiView.UI.updateSidebar();
}

meiView.UI.onSelectorSelect = function(args) {

  if (meiView.selectingState.ON) {

    var oldVarID = meiView.selectingState.selectedVarXmlID;
    meiView.selectVariant(args.varXmlID);

    /* re-draw current page [TODO: only re-draw if the change happened on the current page] */

    meiView.displayCurrentPage();
    if (meiView.UI.dlg) { 
      meiView.UI.dlg.bringToFront();
    }
    
    meiView.UI.updateSidebar(meiView.selectingState.appID, oldVarID);
  }
}

meiView.UI.onSelectorHide = function() {
  meiView.selectingState.exit();
  meiView.UI.updateSidebar();
}

meiView.UI.addHightlightClasses = function(appID) {
  var source = meiView.currentScore.variantPath[appID].source;
  var sources = source ? source.split(' ') : ['lem'];
  for (var i=0;i<sources.length; i++) {
    var liID = meiView.UI.liID(sources[i], appID);
    $('#' + liID)
      .addClass('meiview-variant-on')
      .closest('div.meiview-sidebar').prev().addClass('meiview-source-has-variant-on');
  }
}

meiView.UI.initSidebarHighlight = function() {
  if (!meiView.currentScore) return;
  for (appID in meiView.MEI.APPs) {
    meiView.UI.addHightlightClasses(appID);
  } 
}

meiView.UI.updateSidebarHighlight = function(appID, oldVarID) {
  meiView.UI.addHightlightClasses(appID);
  if (oldVarID) {
    source = meiView.MEI.APPs[appID].variants[oldVarID].source;
    var sources = source ? source.split(' ') : ['lem'];
    for (var i=0;i<sources.length; i++) {
      var liID = meiView.UI.liID(sources[i], appID);
      $('#' + liID)
        .removeClass('meiview-variant-on');
    }
    $('div.meiview-sidebar').not(':has(li.meiview-variant-on)').prev('.meiview-source-has-variant-on').removeClass('meiview-source-has-variant-on');
  }
}

meiView.UI.updateSidebar = function(appID, oldVarID) {
  if (appID) {
    meiView.UI.updateSidebarHighlight(appID, oldVarID);
  }
  if (meiView.selectingState.ON) {
    /* Disable sources without variants at the currently selected <app> */
    $('div.meiview-sidebar').not(':has(li.' + meiView.UI.toCSSId(meiView.selectingState.appID) + ')').prev().addClass('meiview-source-disabled');
    /* Close up variant list the source is disbaled */
    if ($('.meiview-source-disabled.ui-accordion-header-active').length>0) { 
      $( "#accordion" ).accordion( "option", "active", false);
    }
    /* Disable clicking on sources */
    $('#accordion').on('accordionbeforeactivate', function(event, ui) {
      event.preventDefault();
    });
  } else {
    /* Enable all sources */
    $('h3.meiview-source-disabled').removeClass('meiview-source-disabled');
    /* Enable clicking on sources */
    $('#accordion').off();
  }
}

meiView.UI.ShowSelectorPanel = function(dotInfo) {
  var variantSlice = meiView.MEI.getSlice({start_n:dotInfo.measure_n, end_n:dotInfo.measure_n, staves:[dotInfo.staff_n], noClef:true, noKey:true, noMeter:true, noConnectors:true});
  var panelItemParamList = [];
  var appID = dotInfo.appXmlID;
  var variants = meiView.MEI.APPs[appID].variants 

  if (meiView.UI.dlg) {
    meiView.UI.dlg.hide();
  }
  meiView.UI.dlg = new meiView.UI.SelectorPanel({
    left: dotInfo.measure_left*meiView.UI.scale, 
    top: dotInfo.measure_top*meiView.UI.scale, 
    measureWidth: dotInfo.measure_width*meiView.UI.scale, 
    canvas: meiView.UI.fabrCanvas,
    scale: 0.7,
    appID: appID
  });
  
  meiView.UI.dlg.onDraw = meiView.UI.onSelectorDraw;
  meiView.UI.dlg.onSelect = meiView.UI.onSelectorSelect;
  meiView.UI.dlg.onHide = meiView.UI.onSelectorHide;

  for (xmlID in variants) {
    var variant = variants[xmlID];
    var tagname = variant.tagname;
    var source = variant.source;
    var replacements = {};
    replacements[appID] = new MeiLib.AppReplacement(tagname, xmlID);
    var singleVarScore = new MeiLib.SingleVariantPathScore(variantSlice, replacements);    
    console.log('variant ' + xmlID + ': ');
    console.log(singleVarScore.score);
    var text = 'Lemma';
    if (source) {
      text = source.replace(/#/g, '').replace(/ /g, ', ');
    }
    var selected = (meiView.currentScore.variantPath[appID] === variant);
    meiView.UI.dlg.addItem(text+':', singleVarScore.score, selected, xmlID);
  }
  meiView.UI.dlg.draw();
}

meiView.UI.HideSelectorPanel = function() {
  if (meiView.UI.dlg) {
    meiView.UI.dlg.hide();
  }
}

meiView.UI.SelectorItem = function(options) {
  this.text = options.text;
  this.imgData = options.imgData;
  this.xmlID = xmlID;
}

meiView.UI.SelectorPanel = function (options) {
  this.measureWidth = options.measureWidth || 300;
  this.measureHeight = options.measureHeight || 125;
  this.scale = options.scale || 0.8;
  this.marginWE = options.marginWE || 5;
  this.marginNS = options.marginNS || this.marginWE;
  this.itemSpacing = options.itemSpacing || 5;
  this.width = this.measureWidth * this.scale;
  this.height = 0;
  this.selectedIndex = options.currentSelection || -1;

  this.left = options.left || this.width/2;
  this.top = options.top || this.height/2;

  this.canvas = options.canvas;
  
  this.contentWidth = this.width - 2*(this.marginWE);
  this.imgW = this.contentWidth;
  this.imgH = this.imgW * this.measureHeight/this.measureWidth;

  this.contentTop = this.top - this.height/2 + this.marginNS;

  this.contentScale = options.contentScale || 0.7;
  
  this.items = [];
  this.objects = [];
  if (!options.appID) throw "appID isn't defined for SelectorPanel.";
  this.appID = options.appID;

  this.onDraw = function(args) {};
  this.onSelect = function(args) {};
  this.onHide = function(args) {};
}

meiView.UI.SelectorPanel.prototype.setCanvas = function(fabricCanvas) {
  this.canvas = fabricCanvas;
}

meiView.UI.SelectorPanel.prototype.addItem = function(text, singleVarSliceXML, selected, xmlID) {
  var imgData = meiView.UI.renderMei2Img(singleVarSliceXML, { vexWidth:this.measureWidth, vexHeight:this.measureHeight });
  var newItem = new meiView.UI.SelectorItem({text:text, imgData:imgData, xmlID:xmlID});
  this.items.push(newItem);
  if (selected) {
    this.select(this.items.length-1);
  }
}

meiView.UI.SelectorPanel.prototype.addObjectsForItem = function(item, itemIndex) {
  var text = new fabric.Text(item.text, {
    fontSize: 17*this.scale,
    selectable: false,
    left: this.left,
  });
  
  if (text.width > this.contentWidth) {
    this.contentWidth = text.width;
    this.width = this.contentWidth + 2*(this.marginWE);
  }
  
  var img = new fabric.Image(item.imgData, {
    width:this.imgW, 
    height:this.imgH,
    left: this.left,
    lockMovementX: true,
    lockMovementY: true,
    lockScalingX: true,
    lockScalingY: true,
    lockRotation: true,
    hasControls: false,
    hasBorders: true,
    selectable: false,
  });

  var br = text.getBoundingRect();

//  text.left = this.contentLeft + br.width/2;
  text.top = this.contentTop + this.nextItemTop + br.height/2

  img.top = text.top + br.height/2 + img.height/2;
  // img.left = this.contentLeft + img.width/2;

  var vertIncr = text.height + img.height;
  item.height =  vertIncr;
  this.nextItemTop += vertIncr + this.itemSpacing;
  var heightIncr = itemIndex===0 ? vertIncr + this.marginNS : vertIncr + this.itemSpacing;
  this.height += heightIncr;
  this.top += heightIncr/2;
  
  var smW = this.contentWidth;
  var smH = this.imgH+text.height;
  item.selectorMask =  new fabric.Rect({
    fill: 'green',
    width:smW, 
    height:smH,
    left: this.left,
    lockMovementX: true,
    lockMovementY: true,
    lockScalingX: true,
    lockScalingY: true,
    lockRotation: true,
    hasControls: false,
    selectable: true,
  });
  
  item.selectorMask.top = item.selectorMask.height/2 + text.top - text.height/2;

  // some custom members for selectorMask:
  //  * remember the index to know which item it is attached to,
  //  * define how to highlight when selected
  item.selectorMask.selectItem = itemIndex;
  item.selectorMask.highlight = function(value) {
    this.opacity = value ? 0.35 : 0;
  };
  
  item.selectorMask.highlight(itemIndex === this.selectedIndex);

  this.objects.push(text);
  this.objects.push(img);
  this.objects.push(item.selectorMask);
 
}

/**
 * Calculate delta_x and delta_y to shift the panel so it fits inside the specified box;
 */
meiView.UI.SelectorPanel.prototype.shiftXY = function(box) {
  var pHeight = 0;
  var items = this.items;
  for (var i=0;i<items.length;i++) {
    pHeight += items[i].height + (i === 0 ? this.marginNS : this.itemSpacing);
  }
  if (items.length>0) pHeight += this.marginNS;
  var pWidth = this.width;
  var Wc = box.width;
  var Hc = box.height;
  var Xc = box.x;
  var Yc = box.y;
  
  var curr_x = this.panel.left;
  var curr_y = this.panel.top;
  
  var min_x = Xc - Wc/2 + pWidth/2;
  var max_x = Xc + Wc/2 - pWidth/2;
  var delta_x = 0;
  if (curr_x > max_x ) delta_x = max_x - curr_x;
  if (curr_x < min_x) delta_x = min_x - curr_x;
 
  var min_y = Yc  - Hc/2 + pHeight/2;
  var max_y = Yc  + Hc/2 - pHeight/2;
  var delta_y = 0;
  if (curr_y > max_y) delta_y = max_y - curr_y;
  if (curr_y < min_y) delta_y = min_y - curr_y;

  return {x:delta_x, y:delta_y};
}

meiView.UI.SelectorPanel.prototype.draw = function(box) {
  this.objects = [];
  this.nextItemTop = 0;

  if (!this.panel) {
      this.panel = new fabric.Rect({
        fill: 'grey',
        selectable: false
      });
  }
  this.objects.push(this.panel);

  var items = this.items;
  for (var i=0;i<items.length;i++) {
    this.addObjectsForItem(items[i], i);
  }

  this.panel.width = this.width;
  this.panel.height = this.height+this.marginNS;

  this.panel.left = this.left;
  this.panel.top = this.top+this.marginNS/2;
  
  var delta = this.shiftXY({
    x: this.canvas.width/2, 
    y: this.canvas.height/2, 
    width: this.canvas.width,
    height: this.canvas.height
  });

  var objects = this.objects;
  for (var i=0;i<objects.length;i++) {
    var obj = objects[i];
    obj.left += delta.x;
    obj.top += delta.y;
    this.canvas.add(obj);
  }
  this.onDraw({appID:this.appID});
}

meiView.UI.SelectorPanel.prototype.hide = function() {
  this.canvas.remove(this.panel);
  var objects = this.objects;
  for (var i=0;i<objects.length;i++) {
    this.canvas.remove(objects[i]);
  }
  this.onHide();
  delete this;
}

meiView.UI.SelectorPanel.prototype.select = function(i) {
  
  if (0<=i && i<this.items.length) {
    
    //switch off highlight on prviously selected item
    if (this.selectedIndex>=0 && this.items[this.selectedIndex].selectorMask) {
      this.items[this.selectedIndex].selectorMask.highlight(false);
    }
    
    //switch off highlight on new selection
    if (this.items[i].selectorMask) {
      this.items[i].selectorMask.highlight(true);
    }
    
    this.selectedIndex = i;

    this.onSelect({ varXmlID: this.items[i].xmlID});
    
  }
  
}

meiView.UI.SelectorPanel.prototype.bringToFront = function() {
  var objects = this.objects;
  for (var i=0;i<objects.length;i++) {
    objects[i].bringToFront();
  }
}

