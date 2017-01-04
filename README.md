# vrBIM

## So what's it about?

vrBIM aims to make Building Information Models (BIM) viewable in virtual reality. This is done by converting
IFC files (Industry Foundation Classes) to ThreeJS models and presenting them in WebVR.

The app consists of a Node.js server that converts and serves the models and a WebVR front-end for viewing them.

## Demo

**Online demo coming soon**

[Short demo video](https://www.youtube.com/watch?v=8FQWpi2sOlY)

The demo contains a couple of buildings that can be loaded into the scene before entering VR.
The user can move around in the scene by aiming the reticle at a surface and teleporting there. The target is
marked by an orange cone. If a keyboard is available, WASD controls can also be used to move around. (R/F to move up/down).

If a Gear VR is used (with Samsung Internet for Gear VR) the teleporting is done by tapping the touchpad.

On a PC the teleport is done by right-clicking.

The loaded model contains information about the materials used in the building. Tapping the red marker at the user's feet will bring up a palette of all the materials. Tapping on a material will toggle transparency for that material, so building surfaces can be seen through to reveal the structure within.

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
