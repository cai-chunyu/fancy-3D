// Three.js TextureLoader Example
import * as THREE from 'three';

// TextureLoader is available as part of the THREE namespace
// You can create an instance like this:
const textureLoader = new THREE.TextureLoader();

// Example 1: Basic texture loading
function loadBasicTexture() {
  const texture = textureLoader.load(
    'path/to/your/texture.jpg',
    // onLoad callback (optional)
    (texture) => {
      console.log('Texture loaded successfully');
    },
    // onProgress callback (optional)
    (xhr) => {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    // onError callback (optional)
    (error) => {
      console.error('An error occurred loading the texture', error);
    }
  );
  
  // Apply texture to a material
  const material = new THREE.MeshStandardMaterial({
    map: texture
  });
  
  return material;
}

// Example 2: Loading multiple textures for PBR materials
function loadPBRTextures() {
  const material = new THREE.MeshStandardMaterial();
  
  // Diffuse/Albedo map
  textureLoader.load('textures/diffuse.jpg', (texture) => {
    material.map = texture;
    material.needsUpdate = true;
  });
  
  // Normal map
  textureLoader.load('textures/normal.jpg', (texture) => {
    material.normalMap = texture;
    material.needsUpdate = true;
  });
  
  // Roughness map
  textureLoader.load('textures/roughness.jpg', (texture) => {
    material.roughnessMap = texture;
    material.needsUpdate = true;
  });
  
  // Metalness map
  textureLoader.load('textures/metalness.jpg', (texture) => {
    material.metalnessMap = texture;
    material.needsUpdate = true;
  });
  
  // Ambient Occlusion map
  textureLoader.load('textures/ao.jpg', (texture) => {
    material.aoMap = texture;
    material.needsUpdate = true;
  });
  
  return material;
}

// Example 3: Using async/await with TextureLoader
async function loadTextureAsync(url) {
  return new Promise((resolve, reject) => {
    textureLoader.load(
      url,
      resolve,
      undefined,
      reject
    );
  });
}

// Example usage with async/await
async function createTexturedMesh() {
  try {
    const texture = await loadTextureAsync('path/to/texture.jpg');
    
    // Configure texture properties
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    texture.anisotropy = 16;
    
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ map: texture });
    const mesh = new THREE.Mesh(geometry, material);
    
    return mesh;
  } catch (error) {
    console.error('Failed to load texture:', error);
  }
}

// Example 4: Loading cube textures for environment maps
function loadCubeTexture() {
  const cubeTextureLoader = new THREE.CubeTextureLoader();
  
  const textureCube = cubeTextureLoader.load([
    'textures/px.jpg', // positive x
    'textures/nx.jpg', // negative x
    'textures/py.jpg', // positive y
    'textures/ny.jpg', // negative y
    'textures/pz.jpg', // positive z
    'textures/nz.jpg'  // negative z
  ]);
  
  return textureCube;
}

// Example 5: Texture configuration options
function configureTexture() {
  const texture = textureLoader.load('path/to/texture.jpg');
  
  // Wrapping modes
  texture.wrapS = THREE.RepeatWrapping; // or ClampToEdgeWrapping, MirroredRepeatWrapping
  texture.wrapT = THREE.RepeatWrapping;
  
  // Repeat texture
  texture.repeat.set(4, 4);
  
  // Offset texture
  texture.offset.set(0.5, 0.5);
  
  // Rotation (in radians)
  texture.rotation = Math.PI / 4;
  
  // Center point for rotation
  texture.center.set(0.5, 0.5);
  
  // Filtering
  texture.minFilter = THREE.LinearMipmapLinearFilter; // or NearestFilter, LinearFilter, etc.
  texture.magFilter = THREE.LinearFilter;
  
  // Anisotropic filtering (requires extension support)
  texture.anisotropy = 16; // renderer.capabilities.getMaxAnisotropy() for max value
  
  // Encoding (for HDR textures)
  texture.encoding = THREE.sRGBEncoding; // or LinearEncoding, RGBEEncoding, etc.
  
  return texture;
}

// Example 6: Loading textures with loading manager
function loadTexturesWithManager() {
  const loadingManager = new THREE.LoadingManager();
  
  loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
    console.log(`Started loading: ${url}`);
  };
  
  loadingManager.onLoad = () => {
    console.log('All textures loaded!');
  };
  
  loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
    console.log(`Loading progress: ${itemsLoaded}/${itemsTotal}`);
  };
  
  loadingManager.onError = (url) => {
    console.error(`Error loading: ${url}`);
  };
  
  // Create texture loader with loading manager
  const managedTextureLoader = new THREE.TextureLoader(loadingManager);
  
  // Load multiple textures
  const textures = {};
  
  textures.diffuse = managedTextureLoader.load('textures/diffuse.jpg');
  textures.normal = managedTextureLoader.load('textures/normal.jpg');
  textures.roughness = managedTextureLoader.load('textures/roughness.jpg');
  
  return textures;
}

// Export examples
export {
  loadBasicTexture,
  loadPBRTextures,
  loadTextureAsync,
  createTexturedMesh,
  loadCubeTexture,
  configureTexture,
  loadTexturesWithManager
};