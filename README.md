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

Now you can build the distribution files running:

`$ grunt`

You can open the test pages if you run:

`$ grunt run`

This will build the distribution files and start a web server at your local 8000 port. Point your browser at one of the test files, for instance:

http://0.0.0.0:8000/test/DC-CanonicalMEI.02.html

Usage and Dependencies
----------------------

There are a number of libraries and plug-ins needed for the application to work. When running meiView, the browser must have the following libraries loaded:

* JQuery
* JQuery-UI (only the .js file mandatory, .css optional)
* VexFlow
* MEItoVexFlow
* Fabric.js

The specific fabric.js and MEItoVexFlow distributtions are currently supplied in the deps/ directory.


