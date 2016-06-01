var container, stats;

var camera, scene, renderer, manager, controls, object, dolly, bbox;
var particleLight, pointLight;

var gltf = null;
var beaconGroup;
var effect, raycaster;
var INTERSECTED;
var crosshair;

var clock = new THREE.Clock();

function init() {

  container = document.getElementById( 'viewport' );

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 10000);
  scene.add(camera);
  camera.position.set(0, 5, 10);
  crosshair = new THREE.Mesh(
					new THREE.RingGeometry( 0.02, 0.04, 32 ),
					new THREE.MeshBasicMaterial( {
						color: 0xffffff,
						opacity: 0.5,
						transparent: true
					} )
				);
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

function addBeacons() {
  beaconGroup = new THREE.Group();
  for (var i = 0; i < 20; i++) {
    var geometry = new THREE.SphereGeometry( 0.1, 32, 32 );
    var material = new THREE.MeshLambertMaterial( {color: 0xff0000} );
    var sphere = new THREE.Mesh( geometry, material );
    sphere.position.x = 20*Math.cos(i);
    sphere.position.z = 20*Math.sin(i);
    sphere.position.y = 1;
    beaconGroup.add(sphere);
  }

  scene.add(beaconGroup);

  fooGroup = new THREE.Group();

  fooGroup.add(cube(10,3,10));
  fooGroup.add(cube(18,3,18));
  fooGroup.add(cube(10,10,10));  
  fooGroup.add(cube(0,3,26));

  //scene.add(fooGroup);



}

function cube(x,y,z,size) {
  var geometry = new THREE.BoxGeometry(5,5,5);
//  var material = new THREE.MeshLambertMaterial( {color: 0xff7700} );
  var material = new THREE.MeshNormalMaterial();
  var foo = new THREE.Mesh(geometry, material);

  foo.position.x = x;
  foo.position.y = y;
  foo.position.z = z;

  return foo;
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

      console.log("Alussa: " + object.matrixAutoUpdate + " " + object.rotationAutoUpdate);

      object.matrixAutoUpdate = false;
      object.rotationAutoUpdate = false;


      console.log("Lopussa: " + object.matrixAutoUpdate + " " + object.rotationAutoUpdate);

      console.log(obj);

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
  
  var hook;
  if (object) {
    hook = function (scene, camera) {
      THREE.glTFShaders.update(scene, camera);
    }
  }
  render();
  if (bbox) {
    bbox.update();
  }
  manager.render(scene, camera, timestamp, hook);
  
}

function render() {
  raycaster.setFromCamera( { x: 0, y: 0 }, camera );
  var intersects = raycaster.intersectObjects(beaconGroup.children);
	if (intersects.length > 0) {
	   if (INTERSECTED != intersects[0].object) {
       if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
			 INTERSECTED = intersects[0].object;
			 INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
			 INTERSECTED.material.emissive.setHex( 0x00ff00 );

       dolly.position.set(INTERSECTED.position.x, dolly.position.y, INTERSECTED.position.z);
       console.log("D " + dolly.position.x + ", " + dolly.position.y + ", " + dolly.position.z);
       console.log("C " + camera.position.x + ", " + camera.position.y + ", " + camera.position.z);
     }
	} else {
		if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
		INTERSECTED = undefined;
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
