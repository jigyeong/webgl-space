import React, { Component } from "react";
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { createStars } from './stars';
import './SpaceScene.css';
import earthImg from '../../assets/images/earth.jpg';
import marsImg from '../../assets/images/mars.jpg';
import moonImg from '../../assets/images/moon.jpg';
import normalImg from '../../assets/images/normal.jpg';
import spaceImg from '../../assets/images/space.jpg';

class SpaceScene extends Component {
    componentDidMount() {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        this.mount.appendChild(renderer.domElement);
        const controls = new OrbitControls(camera, renderer.domElement);

        const textureLoader = new THREE.TextureLoader();

        const earthTexture = textureLoader.load(earthImg);
        const earth = new THREE.Mesh(
            new THREE.SphereGeometry(12, 32, 32),
            new THREE.MeshStandardMaterial({ map: earthTexture})
        )
        earth.position.x = 25;
        earth.position.y = 15;
        earth.position.z = -10;
        scene.add(earth);

        // 지구 중심에 공전 축을 두고, 축을 회전시켜 달이 지구 주위를 돌게 함
        // 궤도면은 실제 달처럼 5.14° 기울임 (기울기 축 안에서 공전 축이 회전)
        const moonOrbitTilt = new THREE.Object3D();
        moonOrbitTilt.position.copy(earth.position);
        moonOrbitTilt.rotation.z = THREE.MathUtils.degToRad(5.14);
        scene.add(moonOrbitTilt);

        const moonOrbit = new THREE.Object3D();
        // 지구 왼쪽(화면 중앙 쪽)에서 출발해 지구 앞을 지나가도록 시작 각도 설정
        moonOrbit.rotation.y = Math.PI;
        moonOrbitTilt.add(moonOrbit);

        const moonTexture = textureLoader.load(moonImg);
        const normalTexture = textureLoader.load(normalImg);
        const moon = new THREE.Mesh(
            new THREE.SphereGeometry(3, 32, 32),
            new THREE.MeshStandardMaterial({ map: moonTexture, normalMap: normalTexture })
        )
        moon.position.x = 22; // 공전 반지름 (지구 중심 기준)
        moonOrbit.add(moon);

        const marsTexture = textureLoader.load(marsImg);
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

        const stars = createStars({ pixelRatio: renderer.getPixelRatio() });
        scene.add(stars);

        const spaceTexture = textureLoader.load(spaceImg);
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

        // 공전 주기(초). 프레임 수가 아닌 경과 시간 기준이라 모니터 주사율과 무관
        const MOON_ORBIT_PERIOD = 40;
        const clock = new THREE.Clock();

        let frameId;
        const animate = function () {
            frameId = requestAnimationFrame(animate);
            const delta = clock.getDelta();
            stars.material.uniforms.uTime.value = clock.elapsedTime;

            // moon.rotation.x += 0.01;
            moon.rotation.y += 0.05;
            moon.rotation.z += 0.01;
            moonOrbit.rotation.y += (Math.PI * 2 / MOON_ORBIT_PERIOD) * delta;

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
            <div ref={ref => (this.mount = ref)} />
        )
    }
}
export default SpaceScene;
