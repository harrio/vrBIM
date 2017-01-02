/* global THREE */

const createSkybox = (fragmentShader, vertexShader) => {
  const uniforms = {
    topColor:    { type: 'c', value: new THREE.Color( 0x0077ff ) },
    bottomColor: { type: 'c', value: new THREE.Color( 0xffffff ) },
    offset:    { type: 'f', value: 33 },
    exponent:  { type: 'f', value: 0.6 }
  };

  const skyGeo = new THREE.SphereGeometry( 4000, 32, 15 );
  const skyMat = new THREE.ShaderMaterial( { vertexShader: vertexShader, fragmentShader: fragmentShader, uniforms: uniforms, side: THREE.BackSide } );
  return new THREE.Mesh( skyGeo, skyMat );
}

const createGround = () => {
  const geometry = new THREE.PlaneGeometry(1000, 1000);
  const material = new THREE.MeshLambertMaterial( {color: 0x2c6000, side: THREE.DoubleSide} );
  const plane = new THREE.Mesh( geometry, material );
  plane.rotation.x = Math.PI / 180 * 90;
  return plane;
}

const createLights = () => {
  const hemiLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1.5);
  hemiLight.name = 'hemiLight';

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(50, 50, 50);
  directionalLight.name = 'dirLight';

  return {
    hemiLight: hemiLight,
    directionalLight: directionalLight
  };
}

export {
  createGround,
  createLights,
  createSkybox
}
