import * as THREE from 'three';
// @ts-ignore
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class graphics {

    scene!: THREE.Scene;

    renderer!: THREE.Renderer;

    camera!: THREE.PerspectiveCamera;

    controls: any;

    constructor(

    ) {

        // Save the state before closing or reloading the page
        window.addEventListener('beforeunload', () => {
            const orbitControlsState = {
                cameraPosition: {
                    x: this.camera.position.x,
                    y: this.camera.position.y,
                    z: this.camera.position.z
                },
                target: {
                    x: this.controls.target.x,
                    y: this.controls.target.y,
                    z: this.controls.target.z
                }
            };
            localStorage.setItem('orbitControlsState', JSON.stringify(orbitControlsState));
        });

    }

    async main() {

        // setup scene and renderer
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        // setup camera
        this.camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 1000000000)
        this.camera.position.z = -0.4;
        this.camera.position.x = -1;
        this.camera.position.y = 0;
        this.camera.lookAt(0, 10, 0);

        // show axis
        const axesHelper = new THREE.AxesHelper(300);
        axesHelper.setColors('#fc0303', '#036ffc', '#03fc17')
        this.scene.add(axesHelper);

        // setup orbitControls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.25;
        this.controls.screenSpacePanning = false;
        this.controls.maxPolarAngle = Math.PI;
        this.controls.target = new THREE.Vector3(1, 1, 1)

        this.restoreLastCameraPosition()

        // setup light
        const hemiLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 10);
        this.scene.add(hemiLight);
        const light = new THREE.DirectionalLight(0xffffff, 10);
        light.position.set(0, 1, 1).normalize();
        this.scene.add(light);

    }

    restoreLastCameraPosition() {

        // Restore saved state
        const savedState = localStorage.getItem('orbitControlsState');
        if (savedState) {
            const { cameraPosition, target } = JSON.parse(savedState);
            this.camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
            this.controls.target.set(target.x, target.y, target.z);
            this.controls.update(); // Ensure the controls are updated with the restored values
        } else {
            // Default positions if no saved state exists
            this.camera.position.set(0, 0, 5);
            this.controls.target.set(0, 0, 0);
        }

    }

}