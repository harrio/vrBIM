/* global THREE */
/* global THREEx */

import * as Menu from './Menu';

const keyboard = new THREEx.KeyboardState();

const lbounds = new THREE.Vector3(-1000, 0.5, -1000);
const ubounds = new THREE.Vector3(1000, 200, 1000);
const hspeed = 100;
const vspeed = 100;
const vstep = 0.3;
const hstep = 0.3;
const rot = 3.14/180 * 5;
const cwd = new THREE.Vector3(0,0,0);
const yaxis = new THREE.Vector3(0,1,0);

const checkKeyboard = (dolly, camera) => {

  if (keyboard.pressed('W') || keyboard.pressed('up')) {
    camera.getWorldDirection(cwd);

    dolly.position.x += cwd.x*hstep;
    dolly.position.z += cwd.z*hstep;
  }

  if (keyboard.pressed('S') || keyboard.pressed('down')) {
    camera.getWorldDirection(cwd);

    dolly.position.x += cwd.x* (-hstep);
    dolly.position.z += cwd.z* (-hstep);
  }

  if (keyboard.pressed('D')) {
    camera.getWorldDirection(cwd);
    cwd.applyAxisAngle(yaxis, Math.PI / 2);

    dolly.position.x += cwd.x* (-hstep);
    dolly.position.z += cwd.z* (-hstep);
  }

  if (keyboard.pressed('A')) {
    camera.getWorldDirection(cwd);
    cwd.applyAxisAngle(yaxis, Math.PI / 2);

    dolly.position.x += cwd.x* hstep;
    dolly.position.z += cwd.z* hstep;
  }

  if (keyboard.pressed('Q') || keyboard.pressed('left')) {
    dolly.rotateY(rot);
  }

  if (keyboard.pressed('E') || keyboard.pressed('right')) {
    dolly.rotateY(-rot);
  }

  if (keyboard.pressed('R') || keyboard.pressed('.')) {
    dolly.position.y += vstep;

  }
  if (keyboard.pressed('F') || keyboard.pressed(',')) {
    dolly.position.y -= vstep;
  }
  if (keyboard.pressed('space')) {
    Menu.togglePalette();
  }

  dolly.position.clamp(lbounds, ubounds);

}

export {
  checkKeyboard
}
