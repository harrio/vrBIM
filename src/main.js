/* global THREE */
/* global GamepadState */


import request from 'superagent';

import * as BimManager from './BimManager';
import * as Navigator from './Navigator';
import * as Teleporter from './Teleporter';
import * as Menu from './Menu';
import * as WorldManager from './WorldManager';
import * as Cleaner from './Cleaner';
import * as Keyboard from './Keyboard';

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 10000);
const controls = new THREE.VRControls(camera);
const dolly = new THREE.Group();
const raycaster  = new THREE.Raycaster();
const scene = new THREE.Scene();

const cwd = new THREE.Vector3(0,0,0);

const gamepadState = new GamepadState();

let mode = 'teleport';

let keyboardOn = true;
let renderer, canvas, effect;

let crosshair, VRManager, teleporter, ground;

const init = () => {
  camera.position.set(0, 5, 10);

  crosshair = Navigator.initCrosshair();
  camera.add(crosshair);

  canvas = document.getElementById('viewportCanvas');
  renderer = new THREE.WebGLRenderer({canvas: canvas, antialias:true});
  renderer.setPixelRatio(window.devicePixelRatio);
  effect = new THREE.VREffect(renderer);

  controls.standing = true;

  dolly.add(camera);

  const vertexShader = document.getElementById( 'vertexShader' ).textContent;
  const fragmentShader = document.getElementById( 'fragmentShader' ).textContent;
  const skybox = WorldManager.createSkybox(fragmentShader, vertexShader);
  ground = WorldManager.createGround();
  const lights = WorldManager.createLights();

  scene.add(dolly, skybox, ground, lights.hemiLight, lights.directionalLight);


  effect.setSize(window.innerWidth, window.innerHeight);
  VRManager = new WebVRManager(renderer, effect);

  Menu.createPaletteToggle(dolly);
  Menu.createGuiToggle();
  Menu.createMoveToggle();
  Menu.createGui(camera, renderer, scene, dolly);

  initResize();
  setClickListeners();
  requestAnimationFrame(animate);

  document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    return false;
  }, false);

  gamepadState.ongearvrinput = function (gearVRAction) {
    if (gearVRAction == 'tap') {
      const menu = Menu.getIntersectedMenu(camera, raycaster);
      if (isMoveOn()) {
        toggleMode();
      } else if (menu) {
        handleMenu(menu);
      } else if (isTeleportOn() && teleporter && VRManager.mode == 3) {
        moveDollyTo(dolly, {x: teleporter.position.x, y: teleporter.position.y, z: teleporter.position.z}, 500);
      }
    }

    switch (gearVRAction) {
      case 'tapdown':
        Menu.gazeDown();
        break;
      case 'tapup':
        Menu.gazeUp();
        break;
      case 'up':
        moveDollyTo(dolly, {x: dolly.position.x, y: dolly.position.y + 0.5, z: dolly.position.z});
        break;
      case 'down':
        moveDollyTo(dolly, {x: dolly.position.x, y: dolly.position.y - 0.5, z: dolly.position.z});
        break;
      case 'left':
        if (isMoveOn()) {
          const object = BimManager.getObject();
          object.rotation.z += Math.PI / 180 * 30;
          object.updateMatrix();
        } else {
          camera.getWorldDirection(cwd);
          dolly.position.x += cwd.x * -0.5;
          dolly.position.z += cwd.z * -0.5;
        }
        break;
      case 'right':
        if (isMoveOn()) {
          const object = BimManager.getObject();
          object.rotation.z -= Math.PI / 180 * 30;
          object.updateMatrix();
        } else {
          camera.getWorldDirection(cwd);
          dolly.position.x += cwd.x * 0.5;
          dolly.position.z += cwd.z * 0.5;
        }
        break;
    }
  };
};

const initResize = () => {
  onWindowResize();
  setResizeListeners();
};

const setResizeListeners = () => {
  window.addEventListener('resize', onWindowResize, true);
  window.addEventListener('vrdisplaypresentchange', onVRWindowResize, true);
};

const onWindowResize = () => {
  const width = document.getElementById('viewport').offsetWidth;
  const height = window.innerHeight;
  resizeWindow(width, height);
};

const onVRWindowResize = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  resizeWindow(width, height);
};

const resizeWindow = (width, height) => {
  camera.aspect = width / height;
  effect.setSize(width, height);
  camera.updateProjectionMatrix();
};

const setClickListeners = () => {
  const viewport = document.getElementById('viewport');
  viewport.addEventListener('mousedown', clickHandler, false);
}

const clickHandler = (event) => {
  const menu = Menu.getIntersectedMenu(camera, raycaster);
  if (isMoveOn()) {
    toggleMode();
  } else if (menu) {
    handleMenu(menu);
  } else if (isTeleportOn() && teleporter && (VRManager.mode == 3 || (event && event.button == 2))) {
    moveDollyTo(dolly, {x: teleporter.position.x, y: teleporter.position.y, z: teleporter.position.z});
    if (event) event.stopPropagation();
  }
}

const handleMenu = (menu) => {
  switch (menu.name) {
    case 'PaletteToggle':
      Menu.togglePalette(dolly, camera, renderer);
      break;
    case 'GuiToggle':
      Menu.toggleGui(dolly);
      break;
    case 'Palette':
      BimManager.toggleMaterial(menu);
      break;
    case 'MoveToggle':
      toggleMode();
      break;
  }
}

const animate = (timestamp) => {

  requestAnimationFrame(animate);
  controls.update();
  render();

  VRManager.render(scene, camera, timestamp, function() {});
};

const getIntersectedObj = (justGround) => {
  raycaster.setFromCamera( { x: 0, y: 0 }, camera );
  const intersects = raycaster.intersectObjects(justGround ? [ground] : [ground, BimManager.getObject(), BimManager.getEnvironment()]);
  if (intersects.length < 1) {
    return null;
  }
  return intersects[0];
};

const moveDollyTo = (dolly, pos) => {
  dolly.position.set(pos.x, pos.y, pos.z);
}

const render = () => {
  Menu.updateMenuPosition(camera);
  gamepadState.update();

  if (isTeleportOn()) {
    checkTeleport();
  }

  checkMove();

  if (keyboardOn) {
    Keyboard.checkKeyboard(dolly, camera, renderer);
  }
};

const toggleMode = () => {
  if (isTeleportOn()) {
    Cleaner.disposeHierarchy(teleporter);
    scene.remove(teleporter);
    teleporter = null;
    mode = 'move';
    Menu.toggleMove(true);
  } else {
    mode = 'teleport';
    Menu.toggleMove(false);
  }
}

const checkTeleport = () => {
  if (!teleporter) {
    teleporter = Teleporter.createTeleporter();
    scene.add(teleporter);
  }

  const obj = getIntersectedObj(false);
  if (obj && obj.point) {
    teleporter.position.set(obj.point.x, obj.point.y, obj.point.z);
  }
}

const checkMove = () => {
  const object = BimManager.getObject();
  if (isMoveOn() && object) {
    const obj = getIntersectedObj(true);
    if (obj && obj.point) {
      object.position.set(obj.point.x, obj.point.y + 0.1, obj.point.z);
      object.updateMatrix();
    }
  }
}

const isTeleportOn = () => {
  return mode == 'teleport';
}

const isMoveOn = () => {
  return mode == 'move';
}

const loadModel = (name) => {
  BimManager.loadModelToScene(name, scene, () => {
  });
};

window.onload = function() {
   init();
};

window.loadModel = loadModel;
