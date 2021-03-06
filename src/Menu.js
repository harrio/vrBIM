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

let paletteParent, textParent, toggleParent, gui, gazeInput;
let guiToggle, paletteToggle, moveToggle;
let guiBack, paletteBack, moveBack;

const toggleGeom = new THREE.PlaneGeometry(0.075, 0.075);
const loader = new THREE.TextureLoader();

const createPaletteToggle = (dolly) => {
  toggleParent = new THREE.Object3D();
  loader.load('palette.png', (texture) => {
    const material = new THREE.MeshBasicMaterial({map: texture, transparent: true});

    paletteToggle = new THREE.Mesh(toggleGeom, material);
    paletteToggle.rotation.x = mpi * -45;
    paletteToggle.position.z = -1;
    paletteToggle.position.y = 1;

    paletteToggle.name = 'PaletteToggle';

    toggleParent.add(paletteToggle);
    dolly.add(toggleParent);

    paletteBack = new THREE.Mesh(toggleGeom, new THREE.MeshBasicMaterial({color: 0xFFFFFF, transparent: true, opacity: 0.0}));
    paletteToggle.add(paletteBack);
    paletteBack.position.z = -0.005;
  });
}

const createGuiToggle = () => {
  loader.load('settings.png', (texture) => {
    const material = new THREE.MeshBasicMaterial({map: texture, transparent: true,});

    guiToggle = new THREE.Mesh(toggleGeom, material);
    guiToggle.rotation.x = mpi * -45;
    guiToggle.position.z = -1.05;
    guiToggle.position.y = 1.06;

    guiToggle.name = 'GuiToggle';

    toggleParent.add(guiToggle);

    guiBack = new THREE.Mesh(toggleGeom, new THREE.MeshBasicMaterial({color: 0xFFFFFF, transparent: true, opacity: 0.5}));
    guiToggle.add(guiBack);
    guiBack.position.z = -0.005;
  });
}

const toggleBack = (back, on) => {
  back.material.opacity = on ? 0.5 : 0;
}

const createMoveToggle = () => {
  loader.load('move.png', (texture) => {
    const material = new THREE.MeshBasicMaterial({map: texture, transparent: true});

    moveToggle = new THREE.Mesh(toggleGeom, material);
    moveToggle.rotation.x = mpi * -45;
    moveToggle.position.z = -1.1;
    moveToggle.position.y = 1.12;

    moveToggle.name = 'MoveToggle';

    toggleParent.add(moveToggle);

    moveBack = new THREE.Mesh(toggleGeom, new THREE.MeshBasicMaterial({color: 0xFFFFFF, transparent: true, opacity: 0.0}));
    moveToggle.add(moveBack);
    moveBack.position.z = -0.005;
  });
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
    toggleBack(paletteBack, false);
  } else {
    paletteParent = createPalette(dolly, camera, renderer, BimManager.getMaterials());
    toggleBack(paletteBack, true);
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
    this.altitude = 'Ground';
  };
  const settings = new Settings();
  dat.GUIVR.enableMouse(camera, renderer);
  gui = dat.GUIVR.create('Settings');
  gui.name = 'dat.gui';

  request.get('/list-models')
    .then((res, err) => {
      if (err) {
        return;
      }
      const models = ['None'].concat(res.body.models);

      gui.add(settings, 'model', models.reduce((map, obj) => {
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

  gui.add(settings, 'environment', { None: 'None', London: 'london.js', Amsterdam: 'amsterdam.js', Helsinki: 'senaatintori.js', Tampere: 'sorsapuisto.js'})
    .onChange(val => BimManager.loadEnvironment(val, scene));

  gui.add(settings, 'altitude', ['Ground', '5m', '10m', '25m', '50m'])
    .onChange(val => {
      switch (val) {
      case 'Ground':
        dolly.position.y = 0;
        break;
      case '5m':
        dolly.position.y = 5;
        break;
      case '10m':
        dolly.position.y = 10;
        break;
      case '25m':
        dolly.position.y = 25;
        break;
      case '50m':
        dolly.position.y = 50;
        break;
    }
  });

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
    toggleBack(guiBack, false);
  } else {
    gui.position.set(0, 2, -1);
    dolly.add(gui);
    gui.visible = true;
    toggleBack(guiBack, true);
  }
}

const gazeDown = () => {
  gazeInput.pressed(true);
}

const gazeUp = () => {
  gazeInput.pressed(false);
}

const toggleMove = (on) => {
  toggleBack(moveBack, on);
}

export {
  createPaletteToggle,
  createGuiToggle,
  createMoveToggle,
  createPalette,
  hidePalette,
  togglePalette,
  updateMenuPosition,
  getIntersectedMenu,
  createGui,
  toggleGui,
  gazeDown,
  gazeUp,
  toggleMove
}
