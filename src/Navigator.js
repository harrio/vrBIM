/* global THREE */

const group = new THREE.Group();

const createBeacons = () => {

  for (let i = -15; i < 25; i++) {
    for (let j = -15; j < 25; j++) {
      for (let k = 0 ; k < 4; k++) {
          if ((i % 3 == 0) && (j % 3 == 0))
            group.add(_createSphere(i, k*3+1, j));
      }
    }
  }
  return group;
};

const _createSphere = (x,y,z) => {
    const geometry = new THREE.SphereGeometry( 0.1, 8, 8);
    const material = new THREE.MeshBasicMaterial( {
            color: 0xff0000,
            opacity: 0.1,
            transparent: true
          } );
    const sphere = new THREE.Mesh( geometry, material );
    sphere.position.x = x;
    sphere.position.z = z;
    sphere.position.y = y;
    material.depthTest = false;
    return sphere;
};

const _createArrow = () => {
var geometry = new THREE.Geometry();

geometry.vertices.push(
  new THREE.Vector3( -10,  10, 0 ),
  new THREE.Vector3( -10, -10, 0 ),
  new THREE.Vector3(  10, -10, 0 )
);

geometry.faces.push( new THREE.Face3( 0, 1, 2 ) );

geometry.computeBoundingSphere();
};

const initCrosshair = () => {
  const crosshair = new THREE.Mesh(
          new THREE.RingGeometry( 0.02, 0.04, 32 )
        );
  crosshair.material = createCrosshairMaterial(0xffffff);
  crosshair.position.z = - 1;
  return crosshair;
};

const createCrosshairMaterial = (hex) => {
  const material = new THREE.MeshBasicMaterial(
    {
      color: hex,
      opacity: 0.8,
      transparent: true
    });
  material.depthTest = false;
  return material;
};

export {
  createBeacons,
  initCrosshair,
  createCrosshairMaterial
}
