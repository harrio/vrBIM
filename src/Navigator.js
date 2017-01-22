/* global THREE */

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
  initCrosshair
}
