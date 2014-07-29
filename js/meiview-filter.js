/***
* meiview.js
* Author: Zoltan Komives
* 
* Copyright © 2013 Zoltan Komives
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


/**
 * MeiFilter is responsible to transform an 'arbitrary' MEI file into an 
 * MEI file that can be presented with meiView
 *
 */
meiView = (typeof meiView == "undefined")? {} : meiView;

meiView.substituteLonga = function(music) {
  var longs = $(music).find('note[dur="long"]');
  $(longs).each(function(){
    //TODO: for now we simply replace longas with breve
    // much better would be to introduce long in VexFlow
    $(this).attr('dur', 'breve');
  })
}

meiView.filterMei = function(meiXml, options) {
  var options = options || {};
  /**
   * Propagate relevant attribute values from scoreDef into staffDef elements
   */
  var propagateScoreDefAttrs = function(scoreDef) {
    
    var propagateAttrValue = function(attrname, descendant, ancestor) {
      var desc_attr_val = $(descendant).attr(attrname);
      var anc_attr_val = $(ancestor).attr(attrname);
      if (!desc_attr_val && anc_attr_val) {
        $(descendant).attr(attrname, anc_attr_val);
      }
    }
    
    var staffDefs = $(scoreDef).find('staffDef');
    $(staffDefs).each(function() {
      propagateAttrValue('meter.count', this, scoreDef);
      propagateAttrValue('meter.unit', this, scoreDef);
      propagateAttrValue('meter.rend', this, scoreDef);
      propagateAttrValue('key.pname', this, scoreDef);
      propagateAttrValue('key.accid', this, scoreDef);
      propagateAttrValue('key.mode', this, scoreDef);
      propagateAttrValue('key.sig.show', this, scoreDef);
    });
  }
  
  var music = meiXml.getElementsByTagNameNS("http://www.music-encoding.org/ns/mei", 'music')[0];

  //1. Remove page break elements (<pb>)
  $(music).find('pb').remove();

  //2. Propagate meter and key signatures from score def to staff def
  var scoreDefs = $(music).find('scoreDef');
  $(scoreDefs).each(function() {
    propagateScoreDefAttrs(this);
  });

  //3. Remove system breaks if not needed.
  if (options.noSysBreak) {
    $(music).find('sb').remove();
    $(music).find('annot').remove();
  }

  //4. Substitue longas with breves
  meiView.substituteLonga(music);

  return meiXml;
}

