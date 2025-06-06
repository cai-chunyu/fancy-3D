import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

class CastleScene {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xe3f2fd); // Icy blue sky
    this.scene.fog = new THREE.Fog(0xe3f2fd, 50, 300); // Extended fog for larger castle
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance"
    });
    this.particles = [];
    this.castleParts = [];
    this.hoveredParts = new Set();
    this.snowParticles = [];
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.clock = new THREE.Clock();
    this.textureLoader = new THREE.TextureLoader();
    
    this.init();
    this.loadTextures()
      .then(() => {
        this.createSnowGround();
        this.createGrandCastle();
        this.addLights();
        this.createSnowfall();
        this.setupEventListeners();
        this.animate();
      });
  }

  init() {
    // Set high DPI rendering
    this.renderer.setPixelRatio(window.devicePixelRatio * 1.5);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    document.getElementById('canvas-container').appendChild(this.renderer.domElement);

    this.camera.position.set(80, 60, 80);
    this.camera.lookAt(0, 20, 0);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.2;
    this.controls.minDistance = 50;
    this.controls.maxDistance = 200;
  }

  loadTextures() {
    return new Promise((resolve) => {
      // Create procedural textures since we can't load external files
      this.textures = this.createProceduralTextures();
      resolve();
    });
  }

  createProceduralTextures() {
    const textures = {};
    
    // Stone brick texture
    const stoneCanvas = document.createElement('canvas');
    stoneCanvas.width = 512;
    stoneCanvas.height = 512;
    const stoneCtx = stoneCanvas.getContext('2d');
    
    // Base stone color
    stoneCtx.fillStyle = '#c8c8c8';
    stoneCtx.fillRect(0, 0, 512, 512);
    
    // Draw brick pattern
    const brickWidth = 64;
    const brickHeight = 32;
    for (let y = 0; y < 512; y += brickHeight) {
      for (let x = 0; x < 512; x += brickWidth) {
        const offset = (Math.floor(y / brickHeight) % 2) * (brickWidth / 2);
        const brickX = (x + offset) % 512;
        
        // Brick outline
        stoneCtx.strokeStyle = '#a0a0a0';
        stoneCtx.lineWidth = 2;
        stoneCtx.strokeRect(brickX, y, brickWidth, brickHeight);
        
        // Add some variation
        const variation = Math.random() * 30 - 15;
        const gray = 200 + variation;
        stoneCtx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
        stoneCtx.fillRect(brickX + 1, y + 1, brickWidth - 2, brickHeight - 2);
        
        // Add mortar lines
        stoneCtx.strokeStyle = '#909090';
        stoneCtx.lineWidth = 3;
        stoneCtx.strokeRect(brickX, y, brickWidth, brickHeight);
      }
    }
    
    textures.stone = new THREE.CanvasTexture(stoneCanvas);
    textures.stone.wrapS = THREE.RepeatWrapping;
    textures.stone.wrapT = THREE.RepeatWrapping;
    textures.stone.repeat.set(4, 4);
    
    // Stone normal map
    const normalCanvas = document.createElement('canvas');
    normalCanvas.width = 512;
    normalCanvas.height = 512;
    const normalCtx = normalCanvas.getContext('2d');
    
    // Create a subtle normal map effect
    normalCtx.fillStyle = '#8080ff'; // neutral normal
    normalCtx.fillRect(0, 0, 512, 512);
    
    for (let y = 0; y < 512; y += brickHeight) {
      for (let x = 0; x < 512; x += brickWidth) {
        const offset = (Math.floor(y / brickHeight) % 2) * (brickWidth / 2);
        const brickX = (x + offset) % 512;
        
        // Mortar grooves (darker blue = inward normal)
        normalCtx.strokeStyle = '#6060d0';
        normalCtx.lineWidth = 3;
        normalCtx.strokeRect(brickX, y, brickWidth, brickHeight);
      }
    }
    
    textures.stoneNormal = new THREE.CanvasTexture(normalCanvas);
    textures.stoneNormal.wrapS = THREE.RepeatWrapping;
    textures.stoneNormal.wrapT = THREE.RepeatWrapping;
    textures.stoneNormal.repeat.set(4, 4);
    
    // Snow ground texture
    const snowCanvas = document.createElement('canvas');
    snowCanvas.width = 1024;
    snowCanvas.height = 1024;
    const snowCtx = snowCanvas.getContext('2d');
    
    // Base white
    snowCtx.fillStyle = '#ffffff';
    snowCtx.fillRect(0, 0, 1024, 1024);
    
    // Add subtle variations and footprints
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const size = Math.random() * 20 + 5;
      const alpha = Math.random() * 0.1 + 0.05;
      
      snowCtx.fillStyle = `rgba(240, 240, 250, ${alpha})`;
      snowCtx.beginPath();
      snowCtx.arc(x, y, size, 0, Math.PI * 2);
      snowCtx.fill();
    }
    
    // Add some tracks and imperfections
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const length = Math.random() * 100 + 50;
      const angle = Math.random() * Math.PI * 2;
      
      snowCtx.strokeStyle = 'rgba(230, 230, 240, 0.3)';
      snowCtx.lineWidth = Math.random() * 3 + 1;
      snowCtx.beginPath();
      snowCtx.moveTo(x, y);
      snowCtx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      snowCtx.stroke();
    }
    
    textures.snow = new THREE.CanvasTexture(snowCanvas);
    textures.snow.wrapS = THREE.RepeatWrapping;
    textures.snow.wrapT = THREE.RepeatWrapping;
    textures.snow.repeat.set(8, 8);
    
    return textures;
  }

  createSnowGround() {
    // Create realistic snowy terrain
    const groundGeometry = new THREE.PlaneGeometry(400, 400, 200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({
      map: this.textures.snow,
      roughness: 0.9,
      metalness: 0.05,
      normalScale: new THREE.Vector2(0.3, 0.3)
    });
    
    // Add realistic terrain variation
    const vertices = groundGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const y = vertices[i + 1];
      // Create rolling hills
      vertices[i + 2] = 
        Math.sin(x * 0.01) * Math.cos(y * 0.01) * 8 +
        Math.sin(x * 0.03) * Math.cos(y * 0.03) * 3 +
        Math.sin(x * 0.1) * Math.cos(y * 0.1) * 1 +
        Math.random() * 0.5;
    }
    groundGeometry.computeVertexNormals();
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    
    // Add larger snow formations
    for (let i = 0; i < 50; i++) {
      const moundGeometry = new THREE.SphereGeometry(
        Math.random() * 8 + 4,
        32,
        16
      );
      
      const moundVertices = moundGeometry.attributes.position.array;
      for (let j = 0; j < moundVertices.length; j += 3) {
        moundVertices[j] *= 1 + (Math.random() - 0.5) * 0.4;
        moundVertices[j + 1] *= 0.2 + Math.random() * 0.3;
        moundVertices[j + 2] *= 1 + (Math.random() - 0.5) * 0.4;
      }
      moundGeometry.computeVertexNormals();
      
      const mound = new THREE.Mesh(moundGeometry, groundMaterial);
      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 100;
      mound.position.set(
        Math.cos(angle) * distance,
        -1,
        Math.sin(angle) * distance
      );
      mound.receiveShadow = true;
      mound.castShadow = true;
      this.scene.add(mound);
    }
  }

  createGrandCastle() {
    // Materials with textures
    const stoneMaterial = new THREE.MeshStandardMaterial({
      map: this.textures.stone,
      normalMap: this.textures.stoneNormal,
      roughness: 0.8,
      metalness: 0.1
    });
    
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d3748,
      roughness: 0.6,
      metalness: 0.3
    });

    const snowMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.05
    });

    // Massive castle base - like Hogwarts foundation
    const baseRadius = 35;
    const baseHeight = 8;
    const baseGeometry = new THREE.CylinderGeometry(baseRadius, baseRadius * 1.3, baseHeight, 64);
    const base = new THREE.Mesh(baseGeometry, stoneMaterial);
    base.position.y = baseHeight / 2;
    base.castShadow = true;
    base.receiveShadow = true;
    this.scene.add(base);
    this.castleParts.push(base);

    // Main keep - enormous central tower
    const keepRadius = 12;
    const keepHeight = 60;
    const keepGeometry = new THREE.CylinderGeometry(keepRadius, keepRadius * 1.2, keepHeight, 48);
    const keep = new THREE.Mesh(keepGeometry, stoneMaterial);
    keep.position.y = baseHeight + keepHeight / 2;
    keep.castShadow = true;
    keep.receiveShadow = true;
    this.scene.add(keep);
    this.castleParts.push(keep);

    // Keep roof - grand conical structure
    const keepRoofGeometry = new THREE.ConeGeometry(keepRadius * 1.4, 20, 48);
    const keepRoof = new THREE.Mesh(keepRoofGeometry, roofMaterial);
    keepRoof.position.y = baseHeight + keepHeight + 10;
    keepRoof.castShadow = true;
    this.scene.add(keepRoof);
    this.castleParts.push(keepRoof);

    // Snow on main roof
    const snowCapGeometry = new THREE.ConeGeometry(keepRadius * 1.45, 20.5, 48);
    const snowCap = new THREE.Mesh(snowCapGeometry, snowMaterial);
    snowCap.position.y = baseHeight + keepHeight + 10.2;
    this.scene.add(snowCap);

    // Multiple tower rings - Hogwarts style
    const towerRings = [
      { count: 8, distance: 25, radius: 4, height: 45 },
      { count: 12, distance: 40, radius: 3, height: 35 },
      { count: 16, distance: 55, radius: 2.5, height: 25 }
    ];

    towerRings.forEach((ring, ringIndex) => {
      for (let i = 0; i < ring.count; i++) {
        const angle = (i / ring.count) * Math.PI * 2;
        const angleOffset = ringIndex * 0.2; // Offset each ring
        
        // Tower body with slight taper
        const towerGeometry = new THREE.CylinderGeometry(
          ring.radius, 
          ring.radius * 1.3, 
          ring.height, 
          24
        );
        const tower = new THREE.Mesh(towerGeometry, stoneMaterial);
        tower.position.set(
          Math.cos(angle + angleOffset) * ring.distance,
          baseHeight + ring.height / 2,
          Math.sin(angle + angleOffset) * ring.distance
        );
        tower.castShadow = true;
        tower.receiveShadow = true;
        this.scene.add(tower);
        this.castleParts.push(tower);
        
        // Varied tower roofs
        const roofHeight = 8 + Math.random() * 6;
        const towerRoofGeometry = new THREE.ConeGeometry(ring.radius * 1.5, roofHeight, 24);
        const towerRoof = new THREE.Mesh(towerRoofGeometry, roofMaterial);
        towerRoof.position.set(
          Math.cos(angle + angleOffset) * ring.distance,
          baseHeight + ring.height + roofHeight / 2,
          Math.sin(angle + angleOffset) * ring.distance
        );
        towerRoof.castShadow = true;
        this.scene.add(towerRoof);
        this.castleParts.push(towerRoof);

        // Snow on tower roofs
        const towerSnowGeometry = new THREE.ConeGeometry(ring.radius * 1.55, roofHeight + 0.5, 24);
        const towerSnow = new THREE.Mesh(towerSnowGeometry, snowMaterial);
        towerSnow.position.set(
          Math.cos(angle + angleOffset) * ring.distance,
          baseHeight + ring.height + roofHeight / 2 + 0.2,
          Math.sin(angle + angleOffset) * ring.distance
        );
        this.scene.add(towerSnow);

        // Add windows
        if (Math.random() > 0.3) {
          const windowGeometry = new THREE.PlaneGeometry(1.5, 2);
          const windowMaterial = new THREE.MeshStandardMaterial({
            color: 0xffdd44,
            emissive: 0x332200,
            transparent: true,
            opacity: 0.8
          });
          const window = new THREE.Mesh(windowGeometry, windowMaterial);
          window.position.set(
            Math.cos(angle + angleOffset) * (ring.distance + ring.radius + 0.1),
            baseHeight + ring.height * 0.7,
            Math.sin(angle + angleOffset) * (ring.distance + ring.radius + 0.1)
          );
          window.lookAt(0, window.position.y, 0);
          this.scene.add(window);
        }
      }
    });

    // Massive connecting walls
    const wallSegments = 16;
    const wallRadius = 30;
    const wallHeight = 20;
    
    for (let i = 0; i < wallSegments; i++) {
      const angle1 = (i / wallSegments) * Math.PI * 2;
      const angle2 = ((i + 1) / wallSegments) * Math.PI * 2;
      
      const wallLength = 2 * wallRadius * Math.sin(Math.PI / wallSegments);
      const wallGeometry = new THREE.BoxGeometry(wallLength, wallHeight, 3);
      const wall = new THREE.Mesh(wallGeometry, stoneMaterial);
      
      const midAngle = (angle1 + angle2) / 2;
      wall.position.set(
        Math.cos(midAngle) * wallRadius,
        baseHeight + wallHeight / 2,
        Math.sin(midAngle) * wallRadius
      );
      wall.rotation.y = midAngle + Math.PI / 2;
      wall.castShadow = true;
      wall.receiveShadow = true;
      this.scene.add(wall);
      this.castleParts.push(wall);
    }

    // Battlements
    for (let i = 0; i < wallSegments * 6; i++) {
      const angle = (i / (wallSegments * 6)) * Math.PI * 2;
      
      if (i % 3 === 0) { // Not every position to create gaps
        const battlementGeometry = new THREE.BoxGeometry(2, 4, 2);
        const battlement = new THREE.Mesh(battlementGeometry, stoneMaterial);
        battlement.position.set(
          Math.cos(angle) * wallRadius,
          baseHeight + wallHeight + 2,
          Math.sin(angle) * wallRadius
        );
        battlement.castShadow = true;
        this.scene.add(battlement);
        this.castleParts.push(battlement);
      }
    }

    // Grand entrance with multiple arches
    const entranceWidth = 8;
    const entranceHeight = 15;
    const entranceDepth = 6;
    
    // Main arch
    const archShape = new THREE.Shape();
    archShape.moveTo(-entranceWidth/2, 0);
    archShape.lineTo(-entranceWidth/2, entranceHeight * 0.6);
    archShape.quadraticCurveTo(0, entranceHeight, entranceWidth/2, entranceHeight * 0.6);
    archShape.lineTo(entranceWidth/2, 0);
    
    const archGeometry = new THREE.ExtrudeGeometry(archShape, {
      depth: entranceDepth,
      bevelEnabled: true,
      bevelThickness: 0.2,
      bevelSize: 0.2
    });
    
    const entrance = new THREE.Mesh(archGeometry, stoneMaterial);
    entrance.position.set(0, baseHeight, -wallRadius);
    entrance.castShadow = true;
    this.scene.add(entrance);
    this.castleParts.push(entrance);

    // Bridge leading to entrance
    const bridgeGeometry = new THREE.BoxGeometry(12, 1, 20);
    const bridge = new THREE.Mesh(bridgeGeometry, stoneMaterial);
    bridge.position.set(0, baseHeight - 1, -wallRadius - 15);
    bridge.castShadow = true;
    bridge.receiveShadow = true;
    this.scene.add(bridge);
    this.castleParts.push(bridge);

    // Add magical elements - floating towers
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const distance = 70;
      const height = 40 + Math.random() * 20;
      
      const floatingTowerGeometry = new THREE.CylinderGeometry(3, 4, height, 16);
      const floatingTower = new THREE.Mesh(floatingTowerGeometry, stoneMaterial);
      floatingTower.position.set(
        Math.cos(angle) * distance,
        baseHeight + 30 + height / 2,
        Math.sin(angle) * distance
      );
      floatingTower.castShadow = true;
      this.scene.add(floatingTower);
      this.castleParts.push(floatingTower);
      
      // Floating tower roof
      const floatingRoofGeometry = new THREE.ConeGeometry(4.5, 10, 16);
      const floatingRoof = new THREE.Mesh(floatingRoofGeometry, roofMaterial);
      floatingRoof.position.set(
        Math.cos(angle) * distance,
        baseHeight + 30 + height + 5,
        Math.sin(angle) * distance
      );
      floatingRoof.castShadow = true;
      this.scene.add(floatingRoof);
      this.castleParts.push(floatingRoof);
    }

    // Add flags throughout the castle
    towerRings[0].count = 8;
    for (let i = 0; i < towerRings[0].count; i += 2) {
      const angle = (i / towerRings[0].count) * Math.PI * 2;
      const distance = 25;
      
      // Flag pole
      const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 8, 8);
      const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
      const pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.set(
        Math.cos(angle) * distance,
        baseHeight + 50,
        Math.sin(angle) * distance
      );
      this.scene.add(pole);
      
      // Flag
      const flagGeometry = new THREE.PlaneGeometry(4, 3);
      const flagMaterial = new THREE.MeshStandardMaterial({
        color: 0xcc2222,
        side: THREE.DoubleSide,
        metalness: 0.1,
        roughness: 0.8
      });
      const flag = new THREE.Mesh(flagGeometry, flagMaterial);
      flag.position.set(
        Math.cos(angle) * distance + 2,
        baseHeight + 52,
        Math.sin(angle) * distance
      );
      flag.rotation.y = angle;
      this.scene.add(flag);
    }
  }

  addLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xe3f2fd, 0.4);
    this.scene.add(ambientLight);

    // Main directional light (winter sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(60, 80, 60);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.mapSize.width = 8192;
    directionalLight.shadow.mapSize.height = 8192;
    directionalLight.shadow.bias = -0.0001;
    this.scene.add(directionalLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(0x6bb6ff, 0.3);
    fillLight.position.set(-40, 60, -40);
    this.scene.add(fillLight);

    // Hemisphere light
    const hemisphereLight = new THREE.HemisphereLight(0xc5e3ff, 0xffffff, 0.5);
    this.scene.add(hemisphereLight);

    // Add some warm lights from windows
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 20 + Math.random() * 40;
      const height = 10 + Math.random() * 30;
      
      const windowLight = new THREE.PointLight(0xffaa44, 0.5, 15);
      windowLight.position.set(
        Math.cos(angle) * distance,
        height,
        Math.sin(angle) * distance
      );
      this.scene.add(windowLight);
    }
  }

  createSnowfall() {
    const snowCount = 5000;
    const snowGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(snowCount * 3);
    const sizes = new Float32Array(snowCount);
    
    for (let i = 0; i < snowCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = Math.random() * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
      sizes[i] = Math.random() * 0.8 + 0.2;
    }
    
    snowGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    snowGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const snowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0xffffff) },
        opacity: { value: 0.8 }
      },
      vertexShader: `
        attribute float size;
        varying float vSize;
        void main() {
          vSize = size;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float opacity;
        varying float vSize;
        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;
          float alpha = 1.0 - smoothstep(0.4, 0.5, dist);
          gl_FragColor = vec4(color, alpha * opacity);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    this.snow = new THREE.Points(snowGeometry, snowMaterial);
    this.snowVelocities = new Float32Array(snowCount * 3);
    for (let i = 0; i < snowCount * 3; i += 3) {
      this.snowVelocities[i] = (Math.random() - 0.5) * 0.03;
      this.snowVelocities[i + 1] = -0.1 - Math.random() * 0.08;
      this.snowVelocities[i + 2] = (Math.random() - 0.5) * 0.03;
    }
    
    this.scene.add(this.snow);
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.onWindowResize());
    window.addEventListener('mousemove', (event) => this.onMouseMove(event));
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onMouseMove(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  explodePart(part) {
    if (part.userData.isExploded) return;
    
    part.userData.isExploded = true;
    part.userData.particles = [];
    const particleCount = 40;
    
    const box = new THREE.Box3().setFromObject(part);
    const size = new THREE.Vector3();
    box.getSize(size);
    
    for (let i = 0; i < particleCount; i++) {
      const particleSize = Math.random() * 0.5 + 0.2;
      let particleGeometry;
      
      if (Math.random() > 0.4) {
        particleGeometry = new THREE.SphereGeometry(particleSize, 8, 6);
      } else {
        particleGeometry = new THREE.TetrahedronGeometry(particleSize, 0);
      }
      
      const particle = new THREE.Mesh(
        particleGeometry,
        new THREE.MeshStandardMaterial({ 
          map: part.material.map,
          normalMap: part.material.normalMap,
          color: part.material.color.clone().multiplyScalar(0.9 + Math.random() * 0.2),
          roughness: part.material.roughness,
          metalness: part.material.metalness,
          transparent: true,
          opacity: 1
        })
      );
      
      particle.position.set(
        part.position.x + (Math.random() - 0.5) * size.x,
        part.position.y + (Math.random() - 0.5) * size.y,
        part.position.z + (Math.random() - 0.5) * size.z
      );
      
      const angle = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const radius = 3 + Math.random() * 3;
      
      particle.userData.targetOffset = new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(angle),
        radius * Math.abs(Math.cos(phi)),
        radius * Math.sin(phi) * Math.sin(angle)
      );
      
      particle.userData.floatSpeed = 0.3 + Math.random() * 0.4;
      particle.userData.rotationSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 0.03,
        (Math.random() - 0.5) * 0.03,
        (Math.random() - 0.5) * 0.03
      );
      particle.userData.time = 0;
      particle.userData.originalPart = part;
      particle.userData.basePosition = part.position.clone();
      
      particle.castShadow = true;
      this.scene.add(particle);
      part.userData.particles.push(particle);
    }
    
    part.visible = false;
    this.hoveredParts.add(part);
  }

  reassemblePart(part) {
    if (!part.userData.isExploded) return;
    
    part.userData.isExploded = false;
    
    part.userData.particles.forEach(particle => {
      particle.userData.reassembling = true;
      particle.userData.reassembleSpeed = 1.5 + Math.random();
    });
    
    this.hoveredParts.delete(part);
  }

  updateParticles(deltaTime) {
    const currentIntersects = this.raycaster.intersectObjects(this.castleParts);
    const currentHoveredParts = new Set(currentIntersects.map(i => i.object));
    
    this.hoveredParts.forEach(part => {
      if (!currentHoveredParts.has(part)) {
        this.reassemblePart(part);
      }
    });
    
    this.castleParts.forEach(part => {
      if (!part.userData.particles) return;
      
      for (let j = part.userData.particles.length - 1; j >= 0; j--) {
        const particle = part.userData.particles[j];
        
        if (particle.userData.reassembling) {
          const direction = part.position.clone().sub(particle.position);
          const distance = direction.length();
          
          if (distance < 0.2) {
            this.scene.remove(particle);
            part.userData.particles.splice(j, 1);
            
            if (part.userData.particles.length === 0) {
              part.visible = true;
            }
          } else {
            direction.normalize().multiplyScalar(deltaTime * particle.userData.reassembleSpeed * 4);
            particle.position.add(direction);
            particle.material.opacity = Math.max(0, distance / 3);
            particle.scale.setScalar(Math.max(0.5, distance / 3));
          }
        } else {
          particle.userData.time += deltaTime;
          
          const targetPos = particle.userData.basePosition.clone().add(particle.userData.targetOffset);
          particle.position.lerp(targetPos, deltaTime * particle.userData.floatSpeed);
          
          const oscillation = Math.sin(particle.userData.time * 1.5) * 0.2;
          particle.position.y += oscillation * deltaTime;
          
          particle.rotation.x += particle.userData.rotationSpeed.x;
          particle.rotation.y += particle.userData.rotationSpeed.y;
          particle.rotation.z += particle.userData.rotationSpeed.z;
        }
      }
    });
  }

  updateSnow(deltaTime) {
    if (this.snow) {
      const positions = this.snow.geometry.attributes.position.array;
      
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += this.snowVelocities[i] * deltaTime * 60;
        positions[i + 1] += this.snowVelocities[i + 1] * deltaTime * 60;
        positions[i + 2] += this.snowVelocities[i + 2] * deltaTime * 60;
        
        positions[i] += Math.sin(positions[i + 1] * 0.05) * 0.03;
        
        if (positions[i + 1] < -2) {
          positions[i] = (Math.random() - 0.5) * 200;
          positions[i + 1] = 100;
          positions[i + 2] = (Math.random() - 0.5) * 200;
        }
      }
      
      this.snow.geometry.attributes.position.needsUpdate = true;
      this.snow.rotation.y += 0.00005;
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    const deltaTime = this.clock.getDelta();
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.castleParts.filter(p => p.visible));
    
    if (intersects.length > 0) {
      const intersectedPart = intersects[0].object;
      this.explodePart(intersectedPart);
    }
    
    this.updateParticles(deltaTime);
    this.updateSnow(deltaTime);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize the scene
new CastleScene();