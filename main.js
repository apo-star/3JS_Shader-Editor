import * as THREE from 'three';
import { shaderData } from './assets/js/shader';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let camera, scene, renderer, controls;
let mesh, uniforms;

//declare shder
let vertexShaderContent = shaderData.vertexShader;
let fragementShaderContent = shaderData.rainbow.fragementShader;

init();
animate();

function init() {
    const container = document.getElementById( 'container' );

//camera
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / innerHeight, 0.1, 100);
    camera.position.z = 2;

//scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x051015 );

//mesh
    uniforms = {
        iTime: {value: 1.0},
        iResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        iMouse: { value: new THREE.Vector4() },
        colorB: {type: 'vec3', value: new THREE.Color(0xACB6E5)},
        colorA: {type: 'vec3', value: new THREE.Color(0x74ebd5)},
    }

    const geometry = new THREE.BoxGeometry( 0.5, 0.5, 0.5 );
    const material = new THREE.ShaderMaterial(
        {
            uniforms: uniforms,
            fragmentShader: fragementShaderContent,
            vertexShader: vertexShaderContent,
        }
    );

    mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'box';
    scene.add(mesh);

//renderer
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( container.clientWidth, container.clientHeight );
    container.appendChild( renderer.domElement );
    window.addEventListener( 'resize', onWindowResize );

//orbitcontrol
    controls = new OrbitControls( camera, renderer.domElement );
    controls.update();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( container.clientWidth, container.clientHeight );
}

function animate() {
    requestAnimationFrame( animate );

    controls.update();

    // mesh.rotation.x += 0.005;
    // mesh.rotation.y += 0.01;

    uniforms.iTime.value += 0.05;

    renderer.render( scene, camera );
}

//ACE Editor
var editor = ace.edit("editor");

editor.setValue(fragementShaderContent);
editor.setTheme("ace/theme/twilight");
editor.session.setMode("ace/mode/c_cpp");
editor.resize(300);

editor.getSession().on('change', function() {
  fragementShaderContent = editor.getValue();
});

//update shader
function updateShader(fragShader) {
  editor.setValue(fragShader);
  scene.traverse(function (mesh) {
    if (mesh.name === 'box') {
      mesh.material.fragmentShader = fragShader;
      mesh.material.needsUpdate = true;
    }
  });
}

document.getElementById('rainbow_shadow').onclick = function () {
  updateShader(shaderData.rainbow.fragementShader);
}

document.getElementById('colorring_shader').onclick = function () {
  updateShader(shaderData.colorRing.fragementShader);
}

document.getElementById('firewall_shader').onclick = function () {
  updateShader(shaderData.fire.fragementShader);
}

document.getElementById('pinkvoid_shader').onclick = function () {
  updateShader(shaderData.pinkVoid.fragementShader);
}

//compile shader
document.getElementById('compile').onclick = function () {
  scene.traverse(function (mesh) {
    if (mesh.name === 'box') {
      mesh.material.fragmentShader = fragementShaderContent;
      mesh.material.needsUpdate = true;
    }
  })
}