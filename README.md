meiView
=======
Application displaying music encoded in MEI format. 

Demo
----

An out of date demo is available at [http://zolaemil.github.io/meiView](http://zolaemil.github.io/meiView).

Within the score there're green dots above each measure that contains an <app>
element. Click on the dot, to see which source contains what musical text. 
You can select the variant you'd like to see in the score by clicking on it.

On the right-hand side, you can see the list of sources. When you click 
on a source, it expands into a list to show a list of places where the 
selected source has any difference from the base text.

Build and Test
--------------

To build meiView, you'll need Node.js and npm. In the main directory run (skip the first step if you have bower and grunt already installed globally):

```
$ npm install -g bower grunt-cli
$ npm install
$ bower install
```

You can build the distribution files and start a local web server at port 8000 simply by running:

`$ grunt`

To see the test cases open http://0.0.0.0:8000/test/tests.html.

If you only one to build the distribution files run `$ grunt build` instead.
Similarly, if you only want to run the web server using the existing distribution,
run `$ grunt run`. This will build the distribution files in the dist/ directory.

Usage and Dependencies
----------------------

There are a number of libraries and plug-ins needed for the application to work. When running meiView, the browser must have the following libraries loaded:

* JQuery
* JQuery-UI (only the .js file mandatory, .css optional)
* VexFlow
* MEItoVexFlow
* Fabric.js

The specific fabric.js and MEItoVexFlow distributtions are currently supplied in the deps/ directory.

Deploy meiView
--------------

To deploy meiView in a web page follow these steps:

*1.Include the dependencies*:
```
<script type="text/JavaScript" src="../bower_components/jquery/dist/jquery.min.js"></script>
<script type="text/JavaScript" src="../bower_components/jquery-ui/ui/minified/jquery-ui.min.js"></script>
<script type="text/JavaScript" src="../bower_components/vexflow/build/vexflow/vexflow-min.js"></script>
<script type="text/JavaScript" src="../deps/Fabric-all.js"></script>
<script type="text/JavaScript" src="../deps/meitovexflow.min.js"></script>
```


*2.Include the distribution files*:
```
<script type="text/JavaScript" src="../dist/meiview.js"></script>
<link  rel="stylesheet" href="../dist/meiview.css"/>
```

*3.Make sure you've got an element in the body for the viewer*:
```
    <div class="viewer"></div>
```

*4.Create the viewer*
Now you can create a viewer by calling `new meiView.Viewer(options)`.
In the options you must pass on the DOM element and an MeiDoc object. You can 
create an MeiDoc object using MeiLib (shipped with MEIToVexFlow):
```
var filteredXml = meiView.filterMei(loadedXML, { noSysBreak:true });
var meiDoc = new MeiLib.MeiDoc(filteredXml);
```

If you need to load the XML document from a file you can use a utility function:
```
    var loadedXML = meiView.Util.loadXMLDoc('TC.CanonicalMEI.01.xml');
```

When initialising the Viewer obejct, you can optionally specify a 
pagination object to tell the viewer at what measures the pages 
start and end. If no pagination object is supplied the MEI `<pb>` 
elements will be used to determine where to break the pages. 
For example if you want the pages to start at measure 1, 6 and 11:
```
  var pagination = new meiView.Pages();
  pagination.AddPage(1, 5);
  pagination.AddPage(6, 10);
  pagination.AddPage(11, 15);
```

When your MeiDoc and pagination objects are ready, initialise the viewer:
```
    var viewer = new meiView.CompactViewer({
      maindiv: $('.viewer'),
      MEI: meiDoc,
      pages: pagination,
      title: "title",
      displayFirstPage: true,
    });
```

Note that the options `displayFirstPage: true` is needed if you 
want the viewer to start up by dipsplaying any pages. 
If you don't add this option, you can call `viewer.nextPage()` manually.

