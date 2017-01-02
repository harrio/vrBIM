/* global THREE */

import createGeometry from 'three-bmfont-text';
import loadFont from 'load-bmfont';
import assign from 'object-assign'

let font, texture;

loadFont('fonts/DejaVu-sdf.fnt', function(err, f) {
  font = f;
});

const loader = new THREE.TextureLoader();
loader.load('fonts/DejaVu-sdf.png', (tx) => {
  console.log("Texture loaded");
  texture = tx;});

const makeText = (message, renderer) => {

  texture.needsUpdate = true
  texture.minFilter = THREE.LinearMipMapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = true
  texture.anisotropy = renderer.getMaxAnisotropy();

  // create a geometry of packed bitmap glyphs,
  // word wrapped to 300px and right-aligned
  var geometry = createGeometry({
    width: 230,
    align: 'center',
    text: message,
    font: font
  });

  // change text and other options as desired
  // the options sepcified in constructor will
  // be used as defaults
  //geometry.update(message);

  // we can use a simple ThreeJS material
  // var material = new THREE.MeshBasicMaterial({
  //   map: texture,
  //   transparent: true,
  //   side: THREE.DoubleSide,
  //   color: 0xffffff
  // });

  var material = new THREE.RawShaderMaterial(createSDFShader({
    map: texture,
    side: THREE.DoubleSide,
    //transparent: true,
    color: 'rgb(230, 230, 230)'
  }))


  // now do something with our mesh!
  var mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(-geometry.layout.width / 2, geometry.layout.height, 0.01);

  var textAnchor = new THREE.Object3D();
  textAnchor.position.y = -0.05;
  textAnchor.add(mesh);
  textAnchor.rotation.y = Math.PI;

  return textAnchor;
};


const makeTextSprite = (message, fontsize) => {
  let ctx, texture, sprite, spriteMaterial,
  canvas = document.createElement('canvas');
  ctx = canvas.getContext('2d');
  ctx.font = fontsize + 'px Helvetica';

  // setting canvas width/height before ctx draw, else canvas is empty
  //canvas.width = ctx.measureText(message).width;
  //canvas.height = fontsize * 2; // fontsize * 1.5

  // after setting the canvas width/height we have to re-set font to apply!?! looks like ctx reset
  ctx.font = fontsize + 'px Helvetica';
  ctx.fillStyle = 'rgba(255, 255, 255, 1)';
  ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
  ctx.fillText(message, 0, fontsize);

  texture = new THREE.Texture(canvas);
  texture.minFilter = THREE.LinearFilter; // NearestFilter;
  texture.needsUpdate = true;

  spriteMaterial = new THREE.SpriteMaterial({map : texture});
  sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(0.15, 0.15, 0.15);
  return sprite;
}

const createSDFShader = (opt) => {
  opt = opt || {}
  var opacity = typeof opt.opacity === 'number' ? opt.opacity : 1
  var alphaTest = typeof opt.alphaTest === 'number' ? opt.alphaTest : 0.0001
  var precision = opt.precision || 'highp'
  var color = opt.color
  var map = opt.map

  // remove to satisfy r73
  delete opt.map
  delete opt.color
  delete opt.precision
  delete opt.opacity

  return assign({
    uniforms: {
      opacity: { type: 'f', value: opacity },
      map: { type: 't', value: map || new THREE.Texture() },
      color: { type: 'c', value: new THREE.Color(color) }
    },
    vertexShader: [
      'attribute vec2 uv;',
      'attribute vec4 position;',
      'uniform mat4 projectionMatrix;',
      'uniform mat4 modelViewMatrix;',
      'varying vec2 vUv;',
      'void main() {',
      'vUv = uv;',
      'gl_Position = projectionMatrix * modelViewMatrix * position;',
      '}'
    ].join('\n'),
    fragmentShader: [
      '#ifdef GL_OES_standard_derivatives',
      '#extension GL_OES_standard_derivatives : enable',
      '#endif',
      'precision ' + precision + ' float;',
      'uniform float opacity;',
      'uniform vec3 color;',
      'uniform sampler2D map;',
      'varying vec2 vUv;',

      'float aastep(float value) {',
      '  #ifdef GL_OES_standard_derivatives',
      '    float afwidth = length(vec2(dFdx(value), dFdy(value))) * 0.70710678118654757;',
      '  #else',
      '    float afwidth = (1.0 / 32.0) * (1.4142135623730951 / (2.0 * gl_FragCoord.w));',
      '  #endif',
      '  return smoothstep(0.5 - afwidth, 0.5 + afwidth, value);',
      '}',

      'void main() {',
      '  vec4 texColor = texture2D(map, vUv);',
      '  float alpha = aastep(texColor.a);',
      '  gl_FragColor = vec4(color, opacity * alpha);',
      alphaTest === 0
        ? ''
        : '  if (gl_FragColor.a < ' + alphaTest + ') discard;',
      '}'
    ].join('\n')
  }, opt)
}


export {
  makeTextSprite,
  makeText
}
