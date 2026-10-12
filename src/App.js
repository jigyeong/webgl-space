import React, { Component } from "react";
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Portfolio from './Portfolio';

// 포트폴리오 오버레이 표시 여부 (false 면 마우스로 우주 공간 조작 가능)
const SHOW_PORTFOLIO = false;

class App extends Component {
    componentDidMount() {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        this.mount.appendChild(renderer.domElement);
        const controls = new OrbitControls(camera, renderer.domElement);

        const textureLoader = new THREE.TextureLoader();

        const earthTexture = textureLoader.load('./img/earth.jpg');
        const earth = new THREE.Mesh(
            new THREE.SphereGeometry(12, 32, 32),
            new THREE.MeshStandardMaterial({ map: earthTexture})
        )
        earth.position.x = 25;
        earth.position.y = 15;
        earth.position.z = -10;
        scene.add(earth);

        // 지구 중심에 공전 축을 두고, 축을 회전시켜 달이 지구 주위를 돌게 함
        const moonOrbit = new THREE.Object3D();
        moonOrbit.position.copy(earth.position);
        scene.add(moonOrbit);

        const moonTexture = textureLoader.load('./img/moon.jpg');
        const normalTexture = textureLoader.load('./img/normal.jpg');
        const moon = new THREE.Mesh(
            new THREE.SphereGeometry(3, 32, 32),
            new THREE.MeshStandardMaterial({ map: moonTexture, normalMap: normalTexture })
        )
        moon.position.x = 22; // 공전 반지름 (지구 중심 기준)
        moonOrbit.add(moon);

        const marsTexture = textureLoader.load('./img/mars.jpg');
        const mars = new THREE.Mesh(
            new THREE.SphereGeometry(13, 60, 60),
            new THREE.MeshStandardMaterial({ map: marsTexture})
        )
        mars.position.x = 75;
        mars.position.y = -45;
        mars.position.z = 110;
        scene.add(mars);


        const light = new THREE.HemisphereLight(0xffffbb);
        scene.add(light);
        camera.position.z = 50;

        // 별 300개를 InstancedMesh 하나로 그려 draw call 을 1회로 줄임
        const starCount = 300;
        const stars = new THREE.InstancedMesh(
            new THREE.SphereGeometry(0.2, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0xFFFFFF }),
            starCount
        );
        const matrix = new THREE.Matrix4();
        for (let i = 0; i < starCount; i++) {
            const [x, y, z] = new Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(200));
            matrix.makeTranslation(x, y, z);
            stars.setMatrixAt(i, matrix);
        }
        scene.add(stars);

        const spaceTexture = textureLoader.load('./img/space.jpg');
        scene.background = spaceTexture;

        function moveCamera() {
            const t = document.body.getBoundingClientRect().top;

            camera.position.z = 50 + t * -0.05;
            camera.position.x = t * -0.0002;
            camera.rotation.y = t * -0.0002;
        }

        function onResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        window.addEventListener('scroll', moveCamera);
        window.addEventListener('resize', onResize);
        moveCamera();

        let frameId;
        const animate = function () {
            frameId = requestAnimationFrame(animate);
            // moon.rotation.x += 0.01;
            moon.rotation.y += 0.05;
            moon.rotation.z += 0.01;
            moonOrbit.rotation.y += 0.01;

            earth.rotation.y += 0.005;
            mars.rotation.y += 0.005;

            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        this.cleanup = () => {
            cancelAnimationFrame(frameId);
            window.removeEventListener('scroll', moveCamera);
            window.removeEventListener('resize', onResize);
            controls.dispose();
            scene.traverse(obj => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) obj.material.dispose();
            });
            [moonTexture, normalTexture, earthTexture, marsTexture, spaceTexture].forEach(texture => texture.dispose());
            renderer.dispose();
            renderer.domElement.remove();
        };
    }
    componentWillUnmount() {
        this.cleanup();
    }
    render() {
        return (
            <>
                {SHOW_PORTFOLIO && <Portfolio/>}
                <div ref={ref => (this.mount = ref)} />
            </>
        )
    }
}
export default App;
