import * as THREE from 'three';
import { graphics } from './classes/graphics';

let Graphics: graphics;

var time = 0;

let clock: THREE.Clock = new THREE.Clock();

init()

animate()

function init() {

    Graphics = new graphics()

    Graphics.main()

}

function animate() {

    requestAnimationFrame(animate);

    render()

}

function render() {

    var deltaTime = clock.getDelta();

    Graphics.controls.update(deltaTime);

    Graphics.renderer.render(Graphics.scene, Graphics.camera);

    time += deltaTime;

}

