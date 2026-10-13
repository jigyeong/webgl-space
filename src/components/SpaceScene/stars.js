import * as THREE from 'three'

// 실제 별의 색온도 분포를 흉내낸 팔레트 (푸른 흰색 ~ 따뜻한 노란색)
const STAR_COLORS = [
    { color: 0xffffff, weight: 4 },
    { color: 0xcad7ff, weight: 3 },
    { color: 0xa9c1ff, weight: 2 },
    { color: 0xfff4e8, weight: 2 },
    { color: 0xffd2a1, weight: 1 },
];

function pickStarColor() {
    const total = STAR_COLORS.reduce((sum, c) => sum + c.weight, 0);
    let r = Math.random() * total;
    for (const c of STAR_COLORS) {
        r -= c.weight;
        if (r <= 0) return new THREE.Color(c.color);
    }
    return new THREE.Color(STAR_COLORS[0].color);
}

const vertexShader = `
    attribute float aSize;
    attribute float aPhase;
    attribute float aSpeed;
    attribute float aSpike;
    attribute vec3 aColor;

    uniform float uTime;
    uniform float uPixelRatio;

    varying vec3 vColor;
    varying float vTwinkle;
    varying float vSpike;

    void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        // 별마다 다른 속도/위상으로 밝기와 크기가 출렁이게 함
        vTwinkle = 0.55 + 0.45 * sin(uTime * aSpeed + aPhase);
        gl_PointSize = aSize * uPixelRatio * (200.0 / -mvPosition.z) * (0.85 + 0.15 * vTwinkle);

        vColor = aColor;
        vSpike = aSpike;
    }
`;

const fragmentShader = `
    varying vec3 vColor;
    varying float vTwinkle;
    varying float vSpike;

    void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);

        // 중심의 밝은 코어 + 바깥으로 부드럽게 퍼지는 빛
        float core = smoothstep(0.06, 0.0, d);
        float glow = clamp(0.05 / d - 0.1, 0.0, 1.0);

        // 밝은 별에만 십자 모양 광채
        float spikeX = max(0.0, 1.0 - abs(uv.y) * 40.0) * max(0.0, 1.0 - abs(uv.x) * 2.0);
        float spikeY = max(0.0, 1.0 - abs(uv.x) * 40.0) * max(0.0, 1.0 - abs(uv.y) * 2.0);
        float spike = (spikeX + spikeY) * vSpike * 0.8;

        float alpha = (core + glow + spike) * vTwinkle;
        alpha *= smoothstep(0.5, 0.4, d);
        if (alpha < 0.01) discard;

        // 코어는 흰색에 가깝게, 바깥은 별 고유색
        vec3 color = mix(vColor, vec3(1.0), core);
        gl_FragColor = vec4(color, alpha);
    }
`;

// 빛 번짐, 반짝임, 색 다양화, 십자 광채가 들어간 별무리를 만든다
export function createStars({ count = 1500, spread = 300, pixelRatio = 1 } = {}) {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const speeds = new Float32Array(count);
    const spikes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
        positions[i * 3] = THREE.MathUtils.randFloatSpread(spread);
        positions[i * 3 + 1] = THREE.MathUtils.randFloatSpread(spread);
        positions[i * 3 + 2] = THREE.MathUtils.randFloatSpread(spread);

        const color = pickStarColor();
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;

        // 대부분은 작고, 소수만 크고 밝게 (거듭제곱 분포)
        const size = 2.5 + Math.pow(Math.random(), 5) * 14;
        sizes[i] = size;
        spikes[i] = size > 7 ? 1 : 0;

        phases[i] = Math.random() * Math.PI * 2;
        speeds[i] = 0.5 + Math.random() * 2.5;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geometry.setAttribute('aSpike', new THREE.BufferAttribute(spikes, 1));

    const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            uTime: { value: 0 },
            uPixelRatio: { value: pixelRatio },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });

    return new THREE.Points(geometry, material);
}
