/* global THREE */
/* global dat */

import request from 'superagent';

import * as Text from './Text';
import * as Cleaner from './Cleaner';
import * as BimManager from './BimManager';

const yaxis = new THREE.Vector3(0, 1, 0);
const zaxis = new THREE.Vector3(0, 0, 1);

const radius = 1;
const mpi = Math.PI / 180;
const startAngle = 135 * mpi;

let paletteParent, guiToggle, textParent, paletteToggle, toggleParent, gui, gazeInput;

const createPaletteToggle = (dolly) => {
  toggleParent = new THREE.Object3D();
  const geometry = new THREE.PlaneGeometry(0.05, 0.05);
  const material = new THREE.MeshLambertMaterial({color: 0xff0000});
  paletteToggle = new THREE.Mesh(geometry, material);
  paletteToggle.rotation.x = mpi * -45;
  paletteToggle.position.z = -0.3;
  paletteToggle.position.y = 1;

  paletteToggle.name = 'PaletteToggle';

  toggleParent.add(paletteToggle);
  dolly.add(toggleParent);
  return toggleParent;
}

const createGuiToggle = (dolly) => {
  const geometry = new THREE.PlaneGeometry(0.05, 0.05);
  const material = new THREE.MeshLambertMaterial({color: 0x00ff00});
  guiToggle = new THREE.Mesh(geometry, material);
  guiToggle.rotation.x = mpi * -45;
  guiToggle.position.z = -0.35;
  guiToggle.position.y = 1;

  guiToggle.name = 'GuiToggle';

  toggleParent.add(guiToggle);
  return toggleParent;
}

const cleanMaterialName = (name) => {
  const pos = name.indexOf('_');
  if (pos != -1) {
    return name.substring(pos + 1);
  }
  return name;
}

const createPalette = (dolly, camera, renderer, materials) => {
  dolly.remove(paletteParent);
  dolly.remove(textParent);
  paletteParent = new THREE.Object3D();
  textParent = new THREE.Object3D();
  let x = 0;
  let y = 0;

  let angle = startAngle;

  for (let key in materials) {
    let material = materials[key];
    const geometry = new THREE.PlaneGeometry(0.1, 0.1);

    const menuHandle = new THREE.Mesh(geometry, material);
    menuHandle.name = 'Palette';
    //menuHandle.rotation.x = Math.PI / 180 * -20;

    menuHandle.position.x = Math.sin(angle) * radius; //0.35 * x - 0.5;
    menuHandle.position.y = 0.3 * y + 1;
    menuHandle.position.z = Math.cos(angle) * radius; //-1;

    menuHandle.lookAt(camera.position);
    paletteParent.add(menuHandle);

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

  dolly.add(paletteParent);
  dolly.add(textParent);
  updateMenuPosition(camera, paletteParent);
  updateMenuPosition(camera, textParent);
  return paletteParent;
}

const hidePalette = (dolly) => {
  Cleaner.disposeHierarchy(paletteParent);
  Cleaner.disposeHierarchy(textParent);
  dolly.remove(paletteParent);
  dolly.remove(textParent);
}

const togglePalette = (dolly, camera, renderer) => {
  if (paletteParent) {
    hidePalette(dolly);
    paletteParent = null;
  } else {
    paletteParent = createPalette(dolly, camera, renderer, BimManager.getMaterials());
  }
}

const updateMenuPosition = (camera) => {
  const menu = toggleParent;
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

const getIntersectedMenu = (camera, raycaster) => {
  raycaster.setFromCamera( { x: 0, y: 0 }, camera );
  const intersects = paletteParent ? raycaster.intersectObjects(paletteParent.children.concat(toggleParent.children, gui.children), true) :
    raycaster.intersectObjects(toggleParent.children.concat(gui.children), true);
  if (intersects.length < 1) {
    return null;
  }
  return intersects[0].object;
};

const createGui = (camera, renderer, scene, dolly) => {
  const Settings = function() {
    this.model = 'None';
    this.environment = 'None';
  };
  const settings = new Settings();
  dat.GUIVR.enableMouse(camera, renderer);
  gui = dat.GUIVR.create('Settings');
  gui.name = 'dat.gui';

  request.get('/list-models')
    .then((res, err) => {
      gui.add(settings, 'model', res.body.models.reduce((map, obj) => {
        map[obj.substring(0, 20)] = obj;
        return map;
      }, {})).onChange(val => {
        BimManager.loadModelToScene(val, scene, () => {
        });
      });

      for (var i in gui.__controllers) {
        gui.__controllers[i].updateDisplay();
      }
    });

  gui.add(settings, 'environment', { Senaatintori: 'senaatintori.js', Sorsapuisto: 'sorsapuisto.js'})
    .onChange(val => BimManager.loadEnvironment(val, scene));

  gui.position.set(0, 2, -1);
  dolly.add(gui);
  gui.visible = true;

  gazeInput = dat.GUIVR.addInputObject(camera);
  scene.add(gazeInput.cursor);
};

const toggleGui = (dolly) => {
  if (gui.visible) {
    dolly.remove(gui);
    gui.visible = false;
  } else {
    gui.position.set(0, 2, -1);
    dolly.add(gui);
    gui.visible = true;
  }
}

const gazeDown = () => {
  gazeInput.pressed(true);
}

const gazeUp = () => {
  gazeInput.pressed(false);
}

export {
  createPaletteToggle,
  createGuiToggle,
  createPalette,
  hidePalette,
  togglePalette,
  updateMenuPosition,
  getIntersectedMenu,
  createGui,
  toggleGui,
  gazeDown,
  gazeUp
}
