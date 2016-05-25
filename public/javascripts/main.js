var container, stats;

var camera, scene, renderer, controls, object;
var particleLight, pointLight;

var gltf = null;

function init() {

  container = document.getElementById( 'viewport' );

  camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 2000 );
  camera.position.set( 0, 5, 100 );

  scene = new THREE.Scene();
  // Lights

  scene.add( new THREE.AmbientLight( 0xcccccc ) );

  pointLight = new THREE.PointLight( 0xff4400, 5, 30 );
  pointLight.position.set( 5, 0, 0 );
  scene.add( pointLight );

  // Renderer

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  container.appendChild( renderer.domElement );

  controls = new THREE.TrackballControls(camera, renderer.domElement);
  controls.rotateSpeed = 1.0;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.8;
  controls.noZoom = false;
  controls.noPan = false;
  controls.staticMoving = true;
  controls.dynamicDampingFactor = 0.3;
  controls.keys = [ 65, 83, 68 ];
  controls.addEventListener( 'change', render );

  scene.add( new THREE.GridHelper( 100, 2.5 ) );

  window.addEventListener( 'resize', onWindowResize, false );

  render();
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

      scene.add( object );

      camera.lookAt(object.position);

      scene.add( new THREE.AmbientLight( 0xcccccc ) );

      pointLight = new THREE.PointLight( 0xff4400, 5, 30 );
      pointLight.position.set( 5, 0, 0 );
      scene.add( pointLight );

      THREE.glTFShaders.update(scene, camera);
      render();
    }
  );
}

function onWindowResize( event ) {

  renderer.setSize( window.innerWidth, window.innerHeight );

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

}

function animate() {
  requestAnimationFrame( animate );

  THREE.glTFShaders.update(scene, camera);
  controls.update();
}

function render() {
  renderer.render( scene, camera );
}

function selectModel() {
  var name = document.getElementById("modelselect").value;
  loadModel(name);
}

window.onload = function() {
   init();
   animate();
}
