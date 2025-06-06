// Example of adding textures to the castle scene
import * as THREE from 'three';

// Initialize texture loader
const textureLoader = new THREE.TextureLoader();

// Function to create textured stone material
function createTexturedStoneMaterial() {
  // Load stone texture
  const stoneTexture = textureLoader.load('textures/stone-diffuse.jpg');
  stoneTexture.wrapS = THREE.RepeatWrapping;
  stoneTexture.wrapT = THREE.RepeatWrapping;
  stoneTexture.repeat.set(4, 4);
  
  // Load normal map for stone detail
  const stoneNormal = textureLoader.load('textures/stone-normal.jpg');
  stoneNormal.wrapS = THREE.RepeatWrapping;
  stoneNormal.wrapT = THREE.RepeatWrapping;
  stoneNormal.repeat.set(4, 4);
  
  // Load roughness map
  const stoneRoughness = textureLoader.load('textures/stone-roughness.jpg');
  stoneRoughness.wrapS = THREE.RepeatWrapping;
  stoneRoughness.wrapT = THREE.RepeatWrapping;
  stoneRoughness.repeat.set(4, 4);
  
  const stoneMaterial = new THREE.MeshStandardMaterial({
    map: stoneTexture,
    normalMap: stoneNormal,
    normalScale: new THREE.Vector2(1, 1),
    roughnessMap: stoneRoughness,
    roughness: 0.9,
    metalness: 0.1
  });
  
  return stoneMaterial;
}

// Function to create textured roof material
function createTexturedRoofMaterial() {
  // Load roof tiles texture
  const roofTexture = textureLoader.load('textures/roof-tiles.jpg');
  roofTexture.wrapS = THREE.RepeatWrapping;
  roofTexture.wrapT = THREE.RepeatWrapping;
  roofTexture.repeat.set(8, 8);
  
  const roofMaterial = new THREE.MeshStandardMaterial({
    map: roofTexture,
    roughness: 0.8,
    metalness: 0.2
  });
  
  return roofMaterial;
}

// Function to create snow material with texture
function createTexturedSnowMaterial() {
  // Load snow texture
  const snowTexture = textureLoader.load('textures/snow.jpg');
  snowTexture.wrapS = THREE.RepeatWrapping;
  snowTexture.wrapT = THREE.RepeatWrapping;
  snowTexture.repeat.set(2, 2);
  
  // Load snow normal map for surface detail
  const snowNormal = textureLoader.load('textures/snow-normal.jpg');
  snowNormal.wrapS = THREE.RepeatWrapping;
  snowNormal.wrapT = THREE.RepeatWrapping;
  snowNormal.repeat.set(2, 2);
  
  const snowMaterial = new THREE.MeshStandardMaterial({
    map: snowTexture,
    normalMap: snowNormal,
    normalScale: new THREE.Vector2(0.5, 0.5),
    roughness: 0.9,
    metalness: 0.05
  });
  
  return snowMaterial;
}

// Function to add environment map
function loadEnvironmentMap(scene) {
  const cubeTextureLoader = new THREE.CubeTextureLoader();
  
  const environmentMap = cubeTextureLoader.load([
    'textures/skybox/px.jpg',
    'textures/skybox/nx.jpg',
    'textures/skybox/py.jpg',
    'textures/skybox/ny.jpg',
    'textures/skybox/pz.jpg',
    'textures/skybox/nz.jpg'
  ]);
  
  scene.environment = environmentMap;
  scene.background = environmentMap;
}

// Function to load texture with loading feedback
function loadTextureWithProgress(url, onProgress) {
  return new Promise((resolve, reject) => {
    textureLoader.load(
      url,
      // onLoad
      (texture) => {
        resolve(texture);
      },
      // onProgress
      (xhr) => {
        const percentComplete = (xhr.loaded / xhr.total) * 100;
        if (onProgress) {
          onProgress(percentComplete);
        }
      },
      // onError
      (error) => {
        reject(error);
      }
    );
  });
}

// Example of loading multiple textures with a loading screen
async function loadAllTextures(onProgress) {
  const textures = {};
  const textureList = [
    { name: 'stoneDiffuse', url: 'textures/stone-diffuse.jpg' },
    { name: 'stoneNormal', url: 'textures/stone-normal.jpg' },
    { name: 'stoneRoughness', url: 'textures/stone-roughness.jpg' },
    { name: 'roofTiles', url: 'textures/roof-tiles.jpg' },
    { name: 'snow', url: 'textures/snow.jpg' },
    { name: 'snowNormal', url: 'textures/snow-normal.jpg' }
  ];
  
  let loadedCount = 0;
  
  for (const textureInfo of textureList) {
    try {
      const texture = await loadTextureWithProgress(
        textureInfo.url,
        (progress) => {
          const overallProgress = ((loadedCount + progress / 100) / textureList.length) * 100;
          if (onProgress) {
            onProgress(overallProgress);
          }
        }
      );
      textures[textureInfo.name] = texture;
      loadedCount++;
    } catch (error) {
      console.error(`Failed to load texture ${textureInfo.name}:`, error);
    }
  }
  
  return textures;
}

// Integration example with the castle scene
class TexturedCastleScene {
  constructor() {
    this.textureLoader = new THREE.TextureLoader();
    this.textures = {};
    this.materialsLoaded = false;
  }
  
  async loadTextures() {
    // Show loading screen
    this.showLoadingScreen();
    
    try {
      // Load all textures
      this.textures = await loadAllTextures((progress) => {
        this.updateLoadingProgress(progress);
      });
      
      // Create materials with loaded textures
      this.createMaterials();
      
      this.materialsLoaded = true;
      this.hideLoadingScreen();
      
    } catch (error) {
      console.error('Failed to load textures:', error);
      // Fall back to basic materials
      this.createBasicMaterials();
      this.hideLoadingScreen();
    }
  }
  
  createMaterials() {
    // Stone material with textures
    this.stoneMaterial = new THREE.MeshStandardMaterial({
      map: this.textures.stoneDiffuse,
      normalMap: this.textures.stoneNormal,
      normalScale: new THREE.Vector2(1, 1),
      roughnessMap: this.textures.stoneRoughness,
      roughness: 0.9,
      metalness: 0.1
    });
    
    // Configure texture tiling
    if (this.textures.stoneDiffuse) {
      this.textures.stoneDiffuse.wrapS = THREE.RepeatWrapping;
      this.textures.stoneDiffuse.wrapT = THREE.RepeatWrapping;
      this.textures.stoneDiffuse.repeat.set(4, 4);
    }
    
    // Roof material
    this.roofMaterial = new THREE.MeshStandardMaterial({
      map: this.textures.roofTiles,
      roughness: 0.8,
      metalness: 0.2
    });
    
    // Snow material
    this.snowMaterial = new THREE.MeshStandardMaterial({
      map: this.textures.snow,
      normalMap: this.textures.snowNormal,
      normalScale: new THREE.Vector2(0.5, 0.5),
      roughness: 0.9,
      metalness: 0.05
    });
  }
  
  createBasicMaterials() {
    // Fallback materials without textures
    this.stoneMaterial = new THREE.MeshStandardMaterial({
      color: 0xd8d8d8,
      roughness: 0.9,
      metalness: 0.1
    });
    
    this.roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a5568,
      roughness: 0.8,
      metalness: 0.2
    });
    
    this.snowMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.05
    });
  }
  
  showLoadingScreen() {
    // Implementation for showing loading screen
    console.log('Loading textures...');
  }
  
  updateLoadingProgress(progress) {
    // Implementation for updating loading progress
    console.log(`Loading: ${progress.toFixed(1)}%`);
  }
  
  hideLoadingScreen() {
    // Implementation for hiding loading screen
    console.log('Loading complete!');
  }
}

// Export functions and class
export {
  createTexturedStoneMaterial,
  createTexturedRoofMaterial,
  createTexturedSnowMaterial,
  loadEnvironmentMap,
  loadTextureWithProgress,
  loadAllTextures,
  TexturedCastleScene
};