# vrBIM

## So what's it about?

vrBIM aims to make Building Information Models (BIM) viewable in virtual reality. This is done by converting
IFC files (Industrial Foundation Classes) to ThreeJS models and presenting them in WebVR.

The app consists of a Node.js server that converts and serves the models and a WebVR front-end for viewing them.

## Prerequisites

Conversion from IFC files to ThreeJS models is done using [IfcConvert](http://ifcopenshell.org/ifcconvert.html).
The correct binary for the running environment needs to be copied to the server's running directory.

## Usage
```bash
$ npm install
$ npm run dev
$ node app.js
```

The application runs on `localhost:3000`
