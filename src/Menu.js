/* global THREE */

import * as Text from './Text';
import * as Cleaner from './Cleaner';

const yaxis = new THREE.Vector3(0, 1, 0);
const zaxis = new THREE.Vector3(0, 0, 1);

const radius = 1;
const mpi = Math.PI / 180;
const startAngle = 135 * mpi;

let menuParent, textParent, menuToggle, toggleParent;

const createMenuToggle = (dolly) => {
  toggleParent = new THREE.Object3D();
  const geometry = new THREE.CylinderGeometry(0, 0.05, 0.05, 8);
  const material = new THREE.MeshLambertMaterial({color: 0xff0000});
  menuToggle = new THREE.Mesh(geometry, material);
  menuToggle.rotation.x = Math.PI / 180 * -45;
  menuToggle.position.z = -0.5;
  menuToggle.position.y = 1;

  menuToggle.name = 'MenuToggle';

  toggleParent.add(menuToggle);
  dolly.add(toggleParent);
  return toggleParent;
}

const cleanMaterialName = (name) => {
  const pos = name.indexOf('_');
  if (pos != -1) {
    return name.substring(pos + 1);
  }
  return name;
}

const createMenu = (dolly, camera, renderer, materials) => {
  dolly.remove(menuParent);
  dolly.remove(textParent);
  menuParent = new THREE.Object3D();
  textParent = new THREE.Object3D();
  let x = 0;
  let y = 0;

  let angle = startAngle;

  for (let key in materials) {
    let material = materials[key];
    const geometry = new THREE.PlaneGeometry(0.1, 0.1);

    const menuHandle = new THREE.Mesh(geometry, material);
    menuHandle.name = key;
    //menuHandle.rotation.x = Math.PI / 180 * -20;

    menuHandle.position.x = Math.sin(angle) * radius; //0.35 * x - 0.5;
    menuHandle.position.y = 0.3 * y + 1;
    menuHandle.position.z = Math.cos(angle) * radius; //-1;

    menuHandle.lookAt(camera.position);
    menuParent.add(menuHandle);

    //textParent.scale.multiplyScalar(0.005);
    let spritey = Text.makeText(cleanMaterialName(material.name), renderer);
    //spritey.position.set(menuHandle.position.x, menuHandle.position.y + 0.07, menuHandle.position.z);
    //spritey.position.set(-5, 2, 0);
    spritey.scale.multiplyScalar(-0.0018);
    //dolly.parent.add(spritey);

    menuHandle.add(spritey);
    //spritey.rotation.y =
    //textParent.add(spritey);
    x = x < 4 ? x + 1 : 0;
    y = x == 0 ? y + 1 : y;

    angle = x < 4 ? angle + 20 * mpi : startAngle;
  }

  dolly.add(menuParent);
  dolly.add(textParent);
  updateMenuPosition(camera, menuParent);
  updateMenuPosition(camera, textParent);
  return menuParent;
}

const hideMenu = (dolly) => {
  Cleaner.disposeHierarchy(menuParent);
  Cleaner.disposeHierarchy(textParent);
  dolly.remove(menuParent);
  dolly.remove(textParent);
}

const updateMenuPosition = (camera, menu) => {
  if (menu) {
    var direction = zaxis.clone();
    // Apply the camera's quaternion onto the unit vector of one of the axes
    // of our desired rotation plane (the z axis of the xz plane, in this case).
    direction.applyQuaternion(camera.quaternion);
    // Project the direction vector onto the y axis to get the y component
    // of the direction.
    var ycomponent = yaxis.clone().multiplyScalar(direction.dot(yaxis));
    // Subtract the y component from the direction vector so that we are
    // left with the x and z components.
    direction.sub(ycomponent);
    // Normalize the direction into a unit vector again.
    direction.normalize();
    // Set the pivot's quaternion to the rotation required to get from the z axis
    // to the xz component of the camera's direction.
    menu.quaternion.setFromUnitVectors(zaxis, direction);
  }
};

export {
  createMenuToggle,
  createMenu,
  hideMenu,
  updateMenuPosition
}
