/* global THREE */

import * as Cleaner from './Cleaner';
import OBJLoader from 'three-obj-loader';
OBJLoader(THREE);

const manager = new THREE.LoadingManager();
const loader = new THREE.JSONLoader(manager);
const envLoader = new THREE.OBJLoader(manager);

let object;
let objMaterials = {};
let oldOpacities = {}
let environment;

const addObject = (scene, callback) => {
  return (geometry, materials) => {
    geometry.mergeVertices();
    object = new THREE.Mesh(new THREE.BufferGeometry().fromGeometry(geometry), new THREE.MultiMaterial(materials));
    object.rotation.x = -Math.PI/2;
    object.position.y += 0.1;
    scene.add(object);
    object.material.materials.forEach((m) => {
      objMaterials[m.name] = m;
    });
    callback();
  }
}

const loadModelToScene = (name, scene, callback) => {
  objMaterials = {};
  oldOpacities = {}
  Cleaner.disposeHierarchy(object);
  scene.remove(object);
  // load a resource
  loader.load(
      name,
      addObject(scene, callback)
  );
}

const loadEnvironment = (name, scene) => {
  if (environment) {
    Cleaner.disposeHierarchy(environment);
    scene.remove(environment);
  }
  loader.load(
    name, (geometry, materials) => {
      geometry.mergeVertices();
      environment = new THREE.Mesh(new THREE.BufferGeometry().fromGeometry(geometry), new THREE.MultiMaterial( materials ) );
      environment.position.x = 0;
      environment.position.y += 0.1;
      environment.position.z = 0;

      scene.add(environment);
   });

}


const getEnvironment = () => {
  if (environment) {
    return environment;
  } else {
    return new THREE.Object3D();
  }
}

const getObject = () => {
  if (object) {
    return object;
  } else {
    return new THREE.Object3D();
  }
}

const getMaterials = () => {
  return objMaterials;
}

const toggleMaterial = (materialHolder) => {
  const material = materialHolder.material;
  if (material.name in oldOpacities) {
    material.transparent = false;
    material.opacity = oldOpacities[material.name];
    delete oldOpacities[material.name];
  } else {
    oldOpacities[material.name] = material.opacity;
    material.transparent = true;
    material.opacity = 0.3;
  }
}

export {
  loadModelToScene,
  loadEnvironment,
  getEnvironment,
  getObject,
  getMaterials,
  toggleMaterial
}
