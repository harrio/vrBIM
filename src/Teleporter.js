/* global THREE */

const _createCone = (x,y,z) => {
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 4, 8, 8);
    const material = new THREE.MeshBasicMaterial( {
            color: 0xffff00,
            opacity: 0.4,
            transparent: true
          } );
    const cone = new THREE.Mesh(geometry, material);
    cone.position.x = x;
    cone.position.z = z;
    cone.position.y = y;
    return cone;
};

const createTeleporter = () => {
  return _createCone(0, 0, 0);
}

export {
  createTeleporter
}
