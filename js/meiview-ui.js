meiView.UI = {};
meiView.UI.dots = {};

meiView.UI.fillSideBar = function(sidebardiv, sources, sidebar_class) {
  for(src in sources){
    var source = sources[src];
    sidebardiv.append('<h3 class="' + sidebar_class + '">'+src+'</h3><div class="' + sidebar_class + '"><ul id="' + src + '"></ul></div>');
    var listElem = sidebardiv.find('ul[id="'+src+'"]');
    for (var i=0; i<source.length; i++) {
      listElem.append('<li>' + source[i].appID + '</li>')
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
      } else {
        meiView.UI.HideSelectorPanel();
      }
      console.log(e.target.meiViewID  + ': x:' + e.target.left + ', y:' + e.target.top);
    }
  });
  
  return canvas;
  
}



meiView.UI.ShowSelectorPanel = function(dotInfo) {
  var variantSlice = meiView.MEI.getSlice({start_n:dotInfo.measure_n, end_n:dotInfo.measure_n, staves:[dotInfo.staff_n], noClef:true, noKey:true, noMeter:true});
  var panelItemParamList = [];
  var appID = dotInfo.appXmlID;
  var variants = meiView.MEI.APPs[appID].variants 

  if (meiView.UI.dlg) {
    meiView.UI.dlg.hide();
    delete meiView.UI.dlg; 
  }
  meiView.UI.dlg = new meiView.UI.SelectorPanel({left:dotInfo.measure_left*meiView.UI.scale, top:dotInfo.measure_top*meiView.UI.scale, measureWidth:dotInfo.measure_width, canvas:meiView.UI.fabrCanvas});

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
    meiView.UI.dlg.addItem(text+':', singleVarScore.score);
  }
  meiView.UI.dlg.draw();
}

meiView.UI.HideSelectorPanel = function() {
  if (meiView.UI.dlg) {
    meiView.UI.dlg.hide();
    delete meiView.UI.dlg;
  }
}

meiView.UI.SelectorItem = function(options) {
  this.text = options.text;
  this.imgData = options.imgData;
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
}

meiView.UI.SelectorPanel.prototype.setCanvas = function(fabricCanvas) {
  this.canvas = fabricCanvas;
}

meiView.UI.SelectorPanel.prototype.addItem = function(text, singleVarSliceXML) {
  var imgData = meiView.UI.renderMei2Img(singleVarSliceXML, { vexWidth:this.measureWidth, vexHeight:this.measureHeight });
  var newItem = new meiView.UI.SelectorItem({text:text, imgData:imgData});
  this.items.push(newItem);
}

meiView.UI.SelectorPanel.prototype.addObjectsForItem = function(item, itemIndex) {
  var text = new fabric.Text(item.text, {
    fontSize: 17,
    selectable: false,
    width: this.contentWidth,
    left: this.left,
  });
  
  if (text.width > this.contentWidth) {
    this.contentWidth = text.width;
    this.width = this.width / this.scale;
//    this.contentWidth = text.width;
  }
  
  var imgW = item.imgData.width * this.contentScale;
  var imgH = item.imgData.height * this.contentScale;
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
  this.nextItemTop += vertIncr + this.itemSpacing;
  var heightIncr = itemIndex===0 ? vertIncr + this.marginNS : vertIncr + this.itemSpacing;
  this.height += heightIncr;
  this.top += heightIncr/2;
  
  var smW = this.contentWidth;
  var smH = this.imgH+text.height;
  var selectorMask =  new fabric.Rect({
    fill: 'green',
    opacity: 0.2,
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
  
  // selectorMask.left = this.contentLeft + selectorMask.width/2;
  selectorMask.top = selectorMask.height/2 + text.top - text.height/2;

  this.objects.push(selectorMask);
  this.objects.push(text);
  this.objects.push(img);

}

meiView.UI.SelectorPanel.prototype.draw = function() {
  this.objects = [];
  this.nextItemTop = 0;
  var items = this.items;
  for (var i=0;i<items.length;i++) {
    this.addObjectsForItem(items[i], i);
  }

  if (!this.panel) {
      this.panel = new fabric.Rect({
        width:this.width,
        height:this.height+this.marginNS,
        top:this.top+this.marginNS/2,
        left:this.left, 
        fill: 'grey',
        selectable: false
      });
  }
  
  
  
  this.canvas.add(this.panel);
  var objects = this.objects;
  for (var i=0;i<objects.length;i++) {
    this.canvas.add(objects[i]);
  }
}

meiView.UI.SelectorPanel.prototype.hide = function() {
  this.canvas.remove(this.panel);
  var objects = this.objects;
  for (var i=0;i<objects.length;i++) {
    this.canvas.remove(objects[i]);
  }
}

