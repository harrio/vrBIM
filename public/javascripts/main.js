var container, stats;

var camera, scene, renderer, manager, controls, object, dolly, bbox;
var particleLight, pointLight;

var gltf = null;
var beaconGroup;
var effect, raycaster;
var INTERSECTED;
var crosshair;

var clock = new THREE.Clock();
var renderCallback;

function init() {

  container = document.getElementById( 'viewport' );

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 10000);
  scene.add(camera);
  camera.position.set(0, 5, 10);
  crosshair = new THREE.Mesh(
					new THREE.RingGeometry( 0.02, 0.04, 32 )
				);
  setCrosshairColor(0xffffff);
	crosshair.position.z = - 2;
	camera.add(crosshair);

  raycaster = new THREE.Raycaster();

  // Lights

  scene.add( new THREE.AmbientLight( 0xcccccc ) );

  //pointLight = new THREE.PointLight( 0xff4400, 5, 30 );
  //pointLight.position.set(0, 10, 0);
  //scene.add( pointLight );

  // Renderer

  renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio( window.devicePixelRatio );
  //renderer.setSize( window.innerWidth, window.innerHeight );
  //renderer.sortObjects = false;
  container.appendChild( renderer.domElement );

  controls = new THREE.VRControls(camera);
  controls.standing = true;

  effect = new THREE.VREffect(renderer);
  effect.setSize(window.innerWidth, window.innerHeight);

  var params = {
    hideButton: false, // Default: false.
    isUndistorted: false // Default: false.
  };
  manager = new WebVRManager(renderer, effect, params);

  dolly = new THREE.Group();
  //dolly.position.set(10, 10, 40);
  scene.add( dolly );
  dolly.add( camera );

  //if (WEBVR.isAvailable() === true) {
	//   document.body.appendChild(WEBVR.getButton(effect));
	//}

  //scene.add( new THREE.GridHelper( 100, 2.5 ) );

  addBeacons();
  addSkybox();
  addGround();

  window.addEventListener('resize', onWindowResize, true);
  window.addEventListener('vrdisplaypresentchange', onWindowResize, true);
  requestAnimationFrame(animate);
}

function setCrosshairColor(hex) {
  crosshair.material = 
    new THREE.MeshBasicMaterial( {
            color: hex,
            opacity: 0.8,
            transparent: true
          } );
  crosshair.material.depthTest = false;
}

function addBeacons() {
  beaconGroup = new THREE.Group();

  for (var i = -5; i < 5; i++) {
    for (var j = -5; j < 5; j++) {
      for (var k = 0 ; k < 3; k++) {
          beaconGroup.add(sphere(i*3, k*3+1, j*3));
      }
    }
  }

  scene.add(beaconGroup);

}

function sphere(x,y,z) {
    var geometry = new THREE.SphereGeometry( 0.1, 8, 8);
    var material = new THREE.MeshBasicMaterial( {
            color: 0xff0000,
            opacity: 0.1,
            transparent: true
          } );
    var sphere = new THREE.Mesh( geometry, material );
    sphere.position.x = x; 
    sphere.position.z = z; 
    sphere.position.y = y; 
    material.depthTest = false;
    return sphere;
}


function addSkybox() {
  var vertexShader = document.getElementById( 'vertexShader' ).textContent;
	var fragmentShader = document.getElementById( 'fragmentShader' ).textContent;
	var uniforms = {
    topColor: 	 { type: "c", value: new THREE.Color( 0x0077ff ) },
		bottomColor: { type: "c", value: new THREE.Color( 0xffffff ) },
		offset:		 { type: "f", value: 33 },
		exponent:	 { type: "f", value: 0.6 }
	};
	//uniforms.topColor.value.copy( hemiLight.color );
	//scene.fog.color.copy( uniforms.bottomColor.value );

  var skyGeo = new THREE.SphereGeometry( 4000, 32, 15 );
  var skyMat = new THREE.ShaderMaterial( { vertexShader: vertexShader, fragmentShader: fragmentShader, uniforms: uniforms, side: THREE.BackSide } );
  var sky = new THREE.Mesh( skyGeo, skyMat );
  scene.add( sky );

  // var skyGeo = new THREE.SphereGeometry(100, 25, 25);
  // var material = new THREE.MeshPhongMaterial( {color: 0x00dfff} );
  // var sky = new THREE.Mesh(skyGeo, material);
  // sky.material.side = THREE.BackSide;
  // scene.add(sky);
}

function addGround() {
  var geometry = new THREE.PlaneGeometry(100, 100);
  var material = new THREE.MeshBasicMaterial( {color: 0x7cc000, side: THREE.DoubleSide} );
  var plane = new THREE.Mesh( geometry, material );
  plane.rotation.x = Math.PI / 180 * 90;
  scene.add(plane);
}

function loadModel(name) {
  scene.remove(object);
  var loader = new THREE.glTFLoader();
  var url = name;
  // load a resource
  loader.load(
    url,
    function(obj) {
      gltf = obj;
      object = obj.scene;

      object.matrixAutoUpdate = false;
      object.rotationAutoUpdate = false;

      scene.add(object);
      onWindowResize();

      if (bbox) {
        scene.remove(bbox);
      }
      bbox = new THREE.BoundingBoxHelper(object, 0xff0000);
      bbox.update();
      console.log("Y " + object.position.y + " ---> " + bbox.box.min.y);
      object.position.y =- bbox.box.min.y;
      //scene.add(bbox);

      object.parent.matrixAutoUpdate = false;
      object.parent.rotationAutoUpdate = false;

      renderCallback = function (scene, camera) { 
        THREE.glTFShaders.update(scene, camera);
      }

    }
  );
}

function onWindowResize( event ) {

  // renderer.setSize( window.innerWidth, window.innerHeight );
  //
  // camera.aspect = window.innerWidth / window.innerHeight;
  // camera.updateProjectionMatrix();

  camera.aspect = window.innerWidth / window.innerHeight;
  effect.setSize(window.innerWidth, window.innerHeight);
  camera.updateProjectionMatrix();
}

var lastRender = 0;
function animate(timestamp) {
  requestAnimationFrame(animate);
  var delta = Math.min(timestamp - lastRender, 500);
  lastRender = timestamp;
  controls.update();
  //camera.updateMatrixWorld();
  //THREE.glTFAnimator.update();
  
  render();
  if (bbox) {
    bbox.update();
  }
  manager.render(scene, camera, timestamp, renderCallback);
  
}

function getIntersectedBeacon() {
  raycaster.setFromCamera( { x: 0, y: 0 }, camera );
  var intersects = raycaster.intersectObjects(beaconGroup.children);
  if (intersects.length > 0) {
    return intersects[0].object;
  }
}

function highlightBeacon(obj, boolean) {
  obj.material.color.setHex(boolean ? 0x00ff00 : 0xff0000);
}

function render() {
  var obj = getIntersectedBeacon();
	
  if (!obj) { // clear previous highlight if any and reset timer if 
    if (INTERSECTED) {
      highlightBeacon(INTERSECTED, false);
      INTERSECTED.timestamp = undefined;
    }
    INTERSECTED = undefined;
    setCrosshairColor(0xffffff);
  } else {
       if (INTERSECTED && INTERSECTED != obj) { // clear previous highlight
          INTERSECTED.timestamp = undefined;
          highlightBeacon(INTERSECTED, false);
       }
       // highlight crosshair and beacon and start stare timer
       setCrosshairColor(0x00ffff);
			 INTERSECTED = obj; 
       highlightBeacon(INTERSECTED, true);
       if (!INTERSECTED.timestamp) INTERSECTED.timestamp = Date.now();

       if (Date.now() - INTERSECTED.timestamp > 2000) { // 2 second stare duration
         setCrosshairColor(0xffffff);
         dolly.position.set(INTERSECTED.position.x, INTERSECTED.position.y-1, INTERSECTED.position.z);
         console.log("D " + dolly.position.x + ", " + dolly.position.y + ", " + dolly.position.z);
         console.log("C " + camera.position.x + ", " + camera.position.y + ", " + camera.position.z);
         highlightBeacon(INTERSECTED, false);
         INTERSECTED.timestamp = undefined;
       }
  }

  var delta = 0.75 * clock.getDelta();
}

function selectModel() {
  var name = document.getElementById("modelselect").value;
  loadModel(name);
}

window.onload = function() {
   init();
}
