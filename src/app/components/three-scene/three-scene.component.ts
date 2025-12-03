import { Component, OnInit, OnDestroy, ElementRef, ViewChild, Input, AfterViewInit, NgZone, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AnimationMixer } from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { GsapScrollService } from '../../services/gsap-scroll.service';
import { GsapAnimationService } from '../../services/gsap-animation.service';
import { PageLoaderService } from '../../services/page-loader.service';
import { PageLoaderInlineService } from '../../services/page-loader-inline.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

// Enregistrer le plugin ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-three-scene',
  standalone: true,
  imports: [],
  templateUrl: './three-scene.component.html',
  styleUrl: './three-scene.component.css'
})
export class ThreeSceneComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvasContainer', { static: false }) canvasContainer!: ElementRef<HTMLDivElement>;
  @Input() modelPath?: string;
  @Input() autoRotate: boolean = false;
  @Input() enableControls: boolean = true;
  @Input() backgroundColor: string = '#000000';
  @Input() cameraPosition: { x: number; y: number; z: number } = { x: 0, y: 0, z: 5 };

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls?: OrbitControls;
  private animationId?: number;
  private loader!: GLTFLoader;
  private dracoLoader!: DRACOLoader;
  private model?: THREE.Group;
  private mixer?: AnimationMixer;
  private clock = new THREE.Clock();
  private isDestroyed = false;
  private animationTriggered = false;
  private destroy$ = new Subject<void>();
  private mouseX = 0;
  private mouseY = 0;
  private targetRotationX = 0;
  private targetRotationY = 0;
  private currentRotationX = 0;
  private currentRotationY = 0;
  private autoRotationSpeedX = 0;
  private autoRotationSpeedY = 0;
  private autoRotationTargetX = 0;
  private autoRotationTargetY = 0;
  private scrollTriggerInstance?: ScrollTrigger;
  private initialZPosition = 0;
  private initialYPosition = 0;
  private scrollRotationY = { value: 0 };
  private scrollRotationX = { value: 0 };

  private isDarkMode = false;
  private ambientLight?: THREE.AmbientLight;
  private directionalLight1?: THREE.DirectionalLight;
  private directionalLight2?: THREE.DirectionalLight;
  private hemisphereLight?: THREE.HemisphereLight;
  private rimLight?: THREE.PointLight;
  private glowLight?: THREE.PointLight;
  private lightAccent?: THREE.PointLight;
  private lightRim?: THREE.PointLight;
  private lightGlow?: THREE.PointLight;
  private topLight?: THREE.DirectionalLight; // Lumière fixe du haut vers le bas
  private sideLightLeft?: THREE.DirectionalLight; // Lumière latérale gauche
  private sideLightRight?: THREE.DirectionalLight; // Lumière latérale droite
  private frontLight?: THREE.DirectionalLight; // Lumière frontale
  private backLight?: THREE.DirectionalLight; // Lumière arrière
  private diagonalLight1?: THREE.DirectionalLight; // Lumière diagonale 1
  private diagonalLight2?: THREE.DirectionalLight; // Lumière diagonale 2

  constructor(
    private ngZone: NgZone,
    private gsapScrollService: GsapScrollService,
    private gsapAnimationService: GsapAnimationService,
    private pageLoaderService: PageLoaderService,
    private pageLoaderInline: PageLoaderInlineService,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.checkDarkMode();
    this.setupThemeListener();
  }

  ngOnInit(): void {
    // Initialisation des loaders
    this.initializeLoaders();
  }

  ngAfterViewInit(): void {
    // Attendre que le DOM soit complètement rendu avant d'initialiser
    setTimeout(() => {
      this.initThreeScene();
    }, 0);
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.destroy$.next();
    this.destroy$.complete();
    this.cleanup();
  }

  private initializeLoaders(): void {
    // Configuration du DRACO Loader pour la compression
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    this.dracoLoader.setDecoderConfig({ type: 'js' });
    this.dracoLoader.preload();

    // Configuration du GLTF Loader avec DRACO
    this.loader = new GLTFLoader();
    this.loader.setDRACOLoader(this.dracoLoader);
  }

  private initThreeScene(): void {
    if (!this.canvasContainer) {
      console.error('Canvas container not found');
      return;
    }

        const container = this.canvasContainer.nativeElement;

        // Initialiser le conteneur en invisible avec blur dès le début
        gsap.set(container, {
          opacity: 0,
          filter: 'blur(25px)',
          scale: 0.9
        });

        // S'assurer que le conteneur a une hauteur minimale
        if (container.clientHeight === 0) {
          // Attendre que le layout soit calculé
          requestAnimationFrame(() => {
            this.initThreeScene();
          });
          return;
        }

    // Forcer la hauteur à 100% si nécessaire
    const parent = container.parentElement;
    if (parent) {
      const parentHeight = parent.clientHeight || window.innerHeight;
      if (container.clientHeight < parentHeight) {
        container.style.height = '100%';
        container.style.minHeight = `${parentHeight}px`;
      }
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Création de la scène
    this.scene = new THREE.Scene();
    if (this.backgroundColor !== 'transparent') {
      this.scene.background = new THREE.Color(this.backgroundColor);
    } else {
      this.scene.background = null;
    }

    // Ajout de lumières pour éclairer les modèles blancs
    this.setupLighting();

    // Configuration de la caméra
    this.camera = new THREE.PerspectiveCamera(
      75, // FOV
      width / height, // Aspect ratio
      0.1, // Near plane
      1000 // Far plane
    );
    this.camera.position.set(
      this.cameraPosition.x,
      this.cameraPosition.y,
      this.cameraPosition.z
    );

    // Configuration du renderer avec optimisations
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limiter le pixel ratio pour les écrans haute résolution
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0; // Exposition normale pour préserver les couleurs originales

    // Configuration CRITIQUE pour la transparence
    this.renderer.sortObjects = true; // Trier les objets pour un rendu correct de la transparence
    this.renderer.setClearColor(0x000000, 0); // Fond transparent avec alpha 0

    container.appendChild(this.renderer.domElement);

    // Contrôles OrbitControls
    if (this.enableControls) {
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.autoRotate = this.autoRotate;
      this.controls.autoRotateSpeed = 1.0;
      this.controls.minDistance = 1;
      this.controls.maxDistance = 10;
      // Désactiver pan et zoom pour éviter les mouvements indésirables avec la souris
      this.controls.enablePan = false;
      this.controls.enableZoom = false;
      // Désactiver aussi la rotation manuelle pour laisser notre système de suivi de souris gérer
      this.controls.enableRotate = false;
    }

    // Gestion du redimensionnement
    this.setupResizeHandler();

    // Gestion du mouvement de la souris
    this.setupMouseMoveHandler();

    // Chargement du modèle si fourni
    if (this.modelPath) {
      this.loadModel(this.modelPath);
    }

    // Démarrage de l'animation
    this.animate();
  }

  private checkDarkMode(): void {
    if (this.document?.documentElement) {
      this.isDarkMode = this.document.documentElement.classList.contains('dark');
    }
  }

  private setupThemeListener(): void {
    // Observer les changements de classe sur l'élément html
    const observer = new MutationObserver(() => {
      const wasDarkMode = this.isDarkMode;
      this.checkDarkMode();

      // Si le mode a changé, mettre à jour l'éclairage et les matériaux du modèle
      if (wasDarkMode !== this.isDarkMode) {
        if (this.scene) {
          this.setupLighting();
        }
        if (this.model) {
          this.applyDarkModeToModel(this.model);
        }
      }
    });

    if (this.document?.documentElement) {
      observer.observe(this.document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
      });
    }

    // Stocker l'observer pour le cleanup
    (this as any)._themeObserver = observer;
  }

  private applyDarkModeToModel(model: THREE.Group): void {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => {
          const store = this.getMaterialStore(material);
          const matAny = material as any;
          const matColor = matAny.color as THREE.Color | undefined;
          const matEmissive = matAny.emissive as THREE.Color | undefined;
          const hasEmissiveIntensity = matAny.emissiveIntensity !== undefined;

          if (this.isDarkMode) {
            // MONOCHROME NOIR - Forcer toutes les couleurs en noir pur
            if (matColor) {
              matColor.setHex(0x000000); // Noir pur
            }

            if (matEmissive) {
              matEmissive.setHex(0x000000); // Noir pur (pas de couleur bleue)
              if (hasEmissiveIntensity) {
                matAny.emissiveIntensity = 0.28;
              }
            }

            // Désactiver les textures de couleur pour forcer le monochrome
            if (material.map) {
              material.map = null;
            }
            if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhysicalMaterial) {
              if (material.map) material.map = null;
              if (material.normalMap) material.normalMap = null;
              if (material.roughnessMap) material.roughnessMap = null;
              if (material.metalnessMap) material.metalnessMap = null;
            }

            if (material instanceof THREE.MeshStandardMaterial ||
                material instanceof THREE.MeshPhysicalMaterial) {
              const baseEnv = store.envMapIntensity ?? 1;
              material.metalness = 0.25;
              material.roughness = 0.2;
              if (matAny.envMapIntensity !== undefined) {
                matAny.envMapIntensity = Math.max(0.65, baseEnv * 0.5);
              }
            }
          } else {
            // MONOCHROME BLANC - Forcer toutes les couleurs en blanc pur
            if (matColor) {
              matColor.setHex(0xffffff); // Blanc pur
            }

            if (matEmissive) {
              matEmissive.setHex(0xffffff); // Blanc pur (pas de couleur bleutée)
              if (hasEmissiveIntensity) {
                matAny.emissiveIntensity = 0.35; // Intensité emissive similaire au dark mode
              }
            }

            // Désactiver les textures de couleur pour forcer le monochrome
            if (material.map) {
              material.map = null;
              }
            if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhysicalMaterial) {
              if (material.map) material.map = null;
              if (material.normalMap) material.normalMap = null;
              if (material.roughnessMap) material.roughnessMap = null;
              if (material.metalnessMap) material.metalnessMap = null;
            }

            if (material instanceof THREE.MeshStandardMaterial ||
                material instanceof THREE.MeshPhysicalMaterial) {
                const baseEnv = store.envMapIntensity ?? 1;
              material.metalness = 0.3; // Métallique modéré pour le brillant
              material.roughness = 0.15; // Très lisse/brillant (même principe que dark mode)
              if (matAny.envMapIntensity !== undefined) {
                matAny.envMapIntensity = Math.max(0.7, baseEnv * 0.8); // Bonne réflexion d'environnement
              }
            }
          }

          material.needsUpdate = true;
        });
      }
    });
  }

  private getMaterialStore(material: THREE.Material) {
    const mat: any = material;
    mat.userData = mat.userData || {};
    if (!mat.userData.__unlockBase) {
      mat.userData.__unlockBase = {};
    }
    const store = mat.userData.__unlockBase;

    const matColor = mat.color as THREE.Color | undefined;
    if (matColor && !store.color) {
      store.color = matColor.clone();
    }

    const matEmissive = mat.emissive as THREE.Color | undefined;
    if (matEmissive && !store.emissive) {
      store.emissive = matEmissive.clone();
    }

    if (store.emissiveIntensity === undefined && mat.emissiveIntensity !== undefined) {
      store.emissiveIntensity = mat.emissiveIntensity ?? 1;
    }

    if (material instanceof THREE.MeshStandardMaterial ||
        material instanceof THREE.MeshPhysicalMaterial) {
      if (store.metalness === undefined) {
        store.metalness = material.metalness;
      }
      if (store.roughness === undefined) {
        store.roughness = material.roughness;
      }
      if (store.envMapIntensity === undefined && mat.envMapIntensity !== undefined) {
        store.envMapIntensity = mat.envMapIntensity ?? 1;
      }
    }

    return store;
  }

  private setupLighting(): void {
    // Supprimer les anciennes lumières si elles existent
    if (this.ambientLight) this.scene.remove(this.ambientLight);
    if (this.directionalLight1) this.scene.remove(this.directionalLight1);
    if (this.directionalLight2) this.scene.remove(this.directionalLight2);
    if (this.hemisphereLight) this.scene.remove(this.hemisphereLight);
    if (this.rimLight) {
      this.scene.remove(this.rimLight);
      this.rimLight = undefined;
    }
    if (this.glowLight) {
      this.scene.remove(this.glowLight);
      this.glowLight = undefined;
    }
    if (this.lightAccent) {
      this.scene.remove(this.lightAccent);
      this.lightAccent = undefined;
    }
    if (this.lightRim) {
      this.scene.remove(this.lightRim);
      this.lightRim = undefined;
    }
    if (this.lightGlow) {
      this.scene.remove(this.lightGlow);
      this.lightGlow = undefined;
    }
    if (this.topLight) {
      this.scene.remove(this.topLight.target);
      this.scene.remove(this.topLight);
      this.topLight = undefined;
    }
    if (this.sideLightLeft) {
      this.scene.remove(this.sideLightLeft.target);
      this.scene.remove(this.sideLightLeft);
      this.sideLightLeft = undefined;
    }
    if (this.sideLightRight) {
      this.scene.remove(this.sideLightRight.target);
      this.scene.remove(this.sideLightRight);
      this.sideLightRight = undefined;
    }
    if (this.frontLight) {
      this.scene.remove(this.frontLight.target);
      this.scene.remove(this.frontLight);
      this.frontLight = undefined;
    }
    if (this.backLight) {
      this.scene.remove(this.backLight.target);
      this.scene.remove(this.backLight);
      this.backLight = undefined;
    }
    if (this.diagonalLight1) {
      this.scene.remove(this.diagonalLight1.target);
      this.scene.remove(this.diagonalLight1);
      this.diagonalLight1 = undefined;
    }
    if (this.diagonalLight2) {
      this.scene.remove(this.diagonalLight2.target);
      this.scene.remove(this.diagonalLight2);
      this.diagonalLight2 = undefined;
    }

    if (this.isDarkMode) {
      // Mode sombre : éclairage avec lumière principale en diagonale haut à gauche
      this.ambientLight = new THREE.AmbientLight(0xffffff, 0.9); // Lumière ambiante pour base
      this.scene.add(this.ambientLight);

      // Lumière directionnelle principale - en diagonale haut à gauche
      this.directionalLight1 = new THREE.DirectionalLight(0x9ecbff, 2.2); // Intensité forte
      this.directionalLight1.position.set(-5, 8, 5); // Position en haut à gauche (x négatif, y élevé)
      this.directionalLight1.castShadow = true;
      this.scene.add(this.directionalLight1);

      // Lumière directionnelle secondaire pour remplir les ombres
      this.directionalLight2 = new THREE.DirectionalLight(0x89aaff, 1.4);
      this.directionalLight2.position.set(3, 4, -3); // Position complémentaire
      this.scene.add(this.directionalLight2);

      // Lumière hémisphérique pour un éclairage naturel
      this.hemisphereLight = new THREE.HemisphereLight(0x999999, 0x444444, 1.0);
      this.hemisphereLight.position.set(0, 10, 0);
      this.scene.add(this.hemisphereLight);

      // Effet rim light moderne
      this.rimLight = new THREE.PointLight(0x9fd5ff, 1.8, 25, 2);
      this.rimLight.position.set(-1.5, 2.2, 6);
      this.scene.add(this.rimLight);

      // Glow doux venant du bas pour souligner les volumes
      this.glowLight = new THREE.PointLight(0x4c7dff, 1.2, 18, 2);
      this.glowLight.position.set(1.4, -0.6, 4.5);
      this.scene.add(this.glowLight);

      // Lumière fixe du haut vers le bas
      this.topLight = new THREE.DirectionalLight(0x9ecbff, 1.5);
      this.topLight.position.set(0, 10, 0); // Position en haut
      this.topLight.target.position.set(0, 0, 0); // Pointe vers le centre (bas)
      this.scene.add(this.topLight);
      this.scene.add(this.topLight.target);

      // Lumière latérale gauche
      this.sideLightLeft = new THREE.DirectionalLight(0x7da5ff, 1.2);
      this.sideLightLeft.position.set(-8, 2, 0);
      this.sideLightLeft.target.position.set(0, 0, 0);
      this.scene.add(this.sideLightLeft);
      this.scene.add(this.sideLightLeft.target);

      // Lumière latérale droite
      this.sideLightRight = new THREE.DirectionalLight(0x7da5ff, 1.2);
      this.sideLightRight.position.set(8, 2, 0);
      this.sideLightRight.target.position.set(0, 0, 0);
      this.scene.add(this.sideLightRight);
      this.scene.add(this.sideLightRight.target);

      // Lumière frontale
      this.frontLight = new THREE.DirectionalLight(0x9ecbff, 1.0);
      this.frontLight.position.set(0, 3, 8);
      this.frontLight.target.position.set(0, 0, 0);
      this.scene.add(this.frontLight);
      this.scene.add(this.frontLight.target);

      // Lumière arrière
      this.backLight = new THREE.DirectionalLight(0x4c7dff, 0.9);
      this.backLight.position.set(0, 2, -8);
      this.backLight.target.position.set(0, 0, 0);
      this.scene.add(this.backLight);
      this.scene.add(this.backLight.target);

      // Lumière diagonale haut-gauche vers bas-droite
      this.diagonalLight1 = new THREE.DirectionalLight(0x89aaff, 1.1);
      this.diagonalLight1.position.set(-6, 6, 4);
      this.diagonalLight1.target.position.set(0, 0, 0);
      this.scene.add(this.diagonalLight1);
      this.scene.add(this.diagonalLight1.target);

      // Lumière diagonale haut-droite vers bas-gauche
      this.diagonalLight2 = new THREE.DirectionalLight(0x89aaff, 1.1);
      this.diagonalLight2.position.set(6, 6, -4);
      this.diagonalLight2.target.position.set(0, 0, 0);
      this.scene.add(this.diagonalLight2);
      this.scene.add(this.diagonalLight2.target);

      this.lightAccent = undefined;
      this.lightRim = undefined;
      this.lightGlow = undefined;
    } else {
      // Mode clair : éclairage INTENSE pour matériaux FULL BLANC BRILLANT (identique au dark mode)
      this.ambientLight = new THREE.AmbientLight(0xffffff, 1.2); // Lumière ambiante plus forte
      this.scene.add(this.ambientLight);

      // Lumière directionnelle principale - en diagonale haut à gauche (comme dark mode)
      this.directionalLight1 = new THREE.DirectionalLight(0xffffff, 2.5); // Intensité très forte
      this.directionalLight1.position.set(-5, 8, 5); // Même position que dark mode
      this.directionalLight1.castShadow = true;
      this.scene.add(this.directionalLight1);

      // Lumière directionnelle secondaire pour remplir les ombres
      this.directionalLight2 = new THREE.DirectionalLight(0xffffff, 1.6);
      this.directionalLight2.position.set(3, 4, -3); // Même position que dark mode
      this.scene.add(this.directionalLight2);

      // Lumière hémisphérique pour un éclairage naturel
      this.hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xcccccc, 1.2);
      this.hemisphereLight.position.set(0, 10, 0);
      this.scene.add(this.hemisphereLight);

      // Effet rim light moderne (comme dark mode mais en blanc)
      this.lightRim = new THREE.PointLight(0xffffff, 2.0, 25, 2);
      this.lightRim.position.set(-1.5, 2.2, 6);
      this.scene.add(this.lightRim);

      // Glow doux venant du bas pour souligner les volumes
      this.lightGlow = new THREE.PointLight(0xffffff, 1.5, 18, 2);
      this.lightGlow.position.set(1.4, -0.6, 4.5);
      this.scene.add(this.lightGlow);

      this.lightAccent = undefined;

      // Lumière fixe du haut vers le bas
      this.topLight = new THREE.DirectionalLight(0xffffff, 1.4);
      this.topLight.position.set(0, 10, 0); // Position en haut
      this.topLight.target.position.set(0, 0, 0); // Pointe vers le centre (bas)
      this.scene.add(this.topLight);
      this.scene.add(this.topLight.target);

      // Lumière latérale gauche
      this.sideLightLeft = new THREE.DirectionalLight(0xffffff, 1.1);
      this.sideLightLeft.position.set(-8, 2, 0);
      this.sideLightLeft.target.position.set(0, 0, 0);
      this.scene.add(this.sideLightLeft);
      this.scene.add(this.sideLightLeft.target);

      // Lumière latérale droite
      this.sideLightRight = new THREE.DirectionalLight(0xffffff, 1.1);
      this.sideLightRight.position.set(8, 2, 0);
      this.sideLightRight.target.position.set(0, 0, 0);
      this.scene.add(this.sideLightRight);
      this.scene.add(this.sideLightRight.target);

      // Lumière frontale
      this.frontLight = new THREE.DirectionalLight(0xffffff, 1.0);
      this.frontLight.position.set(0, 3, 8);
      this.frontLight.target.position.set(0, 0, 0);
      this.scene.add(this.frontLight);
      this.scene.add(this.frontLight.target);

      // Lumière arrière
      this.backLight = new THREE.DirectionalLight(0xf0f5ff, 0.85);
      this.backLight.position.set(0, 2, -8);
      this.backLight.target.position.set(0, 0, 0);
      this.scene.add(this.backLight);
      this.scene.add(this.backLight.target);

      // Lumière diagonale haut-gauche vers bas-droite
      this.diagonalLight1 = new THREE.DirectionalLight(0xffffff, 1.0);
      this.diagonalLight1.position.set(-6, 6, 4);
      this.diagonalLight1.target.position.set(0, 0, 0);
      this.scene.add(this.diagonalLight1);
      this.scene.add(this.diagonalLight1.target);

      // Lumière diagonale haut-droite vers bas-gauche
      this.diagonalLight2 = new THREE.DirectionalLight(0xffffff, 1.0);
      this.diagonalLight2.position.set(6, 6, -4);
      this.diagonalLight2.target.position.set(0, 0, 0);
      this.scene.add(this.diagonalLight2);
      this.scene.add(this.diagonalLight2.target);

      this.rimLight = undefined;
      this.glowLight = undefined;
    }
  }

  private setupResizeHandler(): void {
    const handleResize = () => {
      if (this.isDestroyed || !this.canvasContainer) return;

      const container = this.canvasContainer.nativeElement;
      const width = container.clientWidth;
      const height = container.clientHeight;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);
    // Stocker la référence pour le cleanup
    (this as any)._resizeHandler = handleResize;
  }

  private setupMouseMoveHandler(): void {
    const handleMouseMove = (event: MouseEvent) => {
      if (this.isDestroyed || !this.canvasContainer) return;

      const container = this.canvasContainer.nativeElement;
      const rect = container.getBoundingClientRect();

      // Calculer la position de la souris relative au conteneur (de -1 à 1)
      this.mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouseY = ((event.clientY - rect.top) / rect.height) * 2 - 1;

      // Calculer la rotation cible basée UNIQUEMENT sur le mouvement horizontal de la souris
      // Le mouvement vertical (Y) est complètement ignoré - AUCUN effet
      const maxRotationY = 0.5; // ~29 degrés en radians (rotation horizontale uniquement)

      // Appliquer une courbe d'easing pour des mouvements plus naturels
      const easeOut = (t: number) => {
        const absT = Math.abs(t);
        const sign = t >= 0 ? 1 : -1;
        return (1 - Math.pow(1 - absT, 3)) * sign; // ease-out-cubic
      };

      // Rotation horizontale basée UNIQUEMENT sur mouseX (mouvement gauche/droite)
      this.targetRotationY = easeOut(this.mouseX) * maxRotationY;

      // AUCUNE rotation verticale - le mouvement Y est complètement ignoré
      this.targetRotationX = 0;
    };

    window.addEventListener('mousemove', handleMouseMove);
    // Stocker la référence pour le cleanup
    (this as any)._mouseMoveHandler = handleMouseMove;
  }

  private loadModel(path: string): void {
    const onLoad = (gltf: any) => {
        if (this.isDestroyed) {
          // Nettoyer le modèle si le composant est détruit pendant le chargement
          gltf.scene.traverse((child: any) => {
            if (child instanceof THREE.Mesh) {
              child.geometry.dispose();
              if (Array.isArray(child.material)) {
                child.material.forEach((mat) => mat.dispose());
              } else {
                child.material.dispose();
              }
            }
          });
          return;
        }

        // Supprimer l'ancien modèle s'il existe
        if (this.model) {
          this.scene.remove(this.model);
          this.disposeModel(this.model);
        }

        this.model = gltf.scene;

        if (!this.model) {
          return;
        }

        // Charger et activer les animations du modèle si elles existent
        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new AnimationMixer(this.model);
          gltf.animations.forEach((clip: THREE.AnimationClip) => {
            const action = this.mixer?.clipAction(clip);
            action?.play();
          });
        }

        // Optimisations du modèle (inclut la gestion de la transparence)
        this.optimizeModel(this.model);

        // Appliquer le dark mode si nécessaire
        this.applyDarkModeToModel(this.model);

        // Ajouter à la scène
        this.scene.add(this.model);

        // Rotation initiale vers la gauche
        this.model.rotation.set(0, Math.PI * -15 / 180, 0); // ~-15 degrés vers la gauche

        // Descendre le modèle un peu (augmenter y pour descendre)
        this.model.position.y += 0.3;

        // Initialiser la rotation automatique (désactivée - rotation à 0)
        this.initAutoRotation();

        // Centrer et ajuster la caméra
        this.fitCameraToModel(this.model);

        // Stocker les positions initiales pour l'effet de parallaxe
        this.initialZPosition = this.model.position.z;
        this.initialYPosition = this.model.position.y;

        // Initialiser l'effet de parallaxe au scroll
        this.setupScrollParallax();

        // Animation de défloutage fluide sur le conteneur du canvas (une seule fois)
        // Attendre que le loader soit complètement caché avant de démarrer l'animation
        if (this.canvasContainer?.nativeElement && !this.animationTriggered) {
          this.animationTriggered = true;

          const triggerAnimation = () => {
            // Petit délai pour s'assurer que le modèle est complètement rendu et que le loader est caché
            setTimeout(() => {
              this.gsapAnimationService.defloutage(this.canvasContainer.nativeElement, {
                duration: 1.4,
                delay: 0.1,
                blur: 25,
                opacity: 0,
                scale: 0.9,
                ease: 'power3.out'
              });
            }, 150);
          };

          // Vérifier si le loader est déjà caché
          const loader = this.document.getElementById('page-loader');
          const isLoaderHidden = this.document.body.classList.contains('loader-hidden');

          if (!loader || isLoaderHidden) {
            // Le loader est déjà caché, déclencher l'animation immédiatement
            triggerAnimation();
          } else {
            // Attendre que le loader soit complètement caché
            this.pageLoaderInline.loaderHidden$.pipe(
              takeUntil(this.destroy$)
            ).subscribe((isHidden) => {
              if (isHidden) {
                triggerAnimation();
              }
            });
          }
        }
      };

    const onError = (error: unknown) => {
        console.error('Error loading model:', error);
    };

    const preloaded = this.pageLoaderService.getPreloadedModel(path);
    if (preloaded) {
      this.loader.parse(preloaded, '', onLoad, onError);
    } else {
      this.loader.load(path, onLoad, undefined, onError);
    }
  }

  private optimizeModel(model: THREE.Group): void {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Optimiser la géométrie
        if (child.geometry) {
          child.geometry.computeBoundingBox();
          child.geometry.computeBoundingSphere();
        }

        // Préserver les matériaux originaux avec leurs couleurs et textures
        if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((material) => {
            // Préserver les propriétés originales du matériau
            material.needsUpdate = true;

            // Détecter et configurer correctement les matériaux transparents
            const isTransparent = material.transparent ||
                                 (material.opacity !== undefined && material.opacity < 1.0) ||
                                 (material instanceof THREE.MeshBasicMaterial && material.opacity < 1.0);

            if (isTransparent) {
              material.transparent = true;
              material.depthWrite = false; // CRITIQUE pour la transparence - évite les artefacts
              material.depthTest = true;
              material.side = THREE.DoubleSide; // Rendre les deux faces pour la transparence

              // Pour les matériaux transparents, s'assurer que l'alpha blending fonctionne
              material.blending = THREE.NormalBlending;
              material.alphaTest = 0;

              // S'assurer que l'opacité est bien définie
              if (material.opacity === undefined || material.opacity === 1.0) {
                // Si l'opacité n'est pas définie mais que le matériau est transparent, utiliser 0.9 par défaut
                material.opacity = 0.9;
              }
            }

            // Configuration spécifique selon le type de matériau
            if (material instanceof THREE.MeshStandardMaterial ||
                material instanceof THREE.MeshPhysicalMaterial) {
              // Pour les matériaux PBR transparents, optimiser les propriétés
              if (isTransparent) {
                material.roughness = material.roughness !== undefined ? material.roughness : 0.5;
                material.metalness = material.metalness !== undefined ? material.metalness : 0.0;
                // Pour les matériaux blancs transparents, réduire la métallicité
                if (material.color && material.color.getHex() === 0xffffff) {
                  material.metalness = 0.0;
                  material.roughness = 0.3; // Plus lisse pour un effet plus brillant
                }
              }
            }

            if (material instanceof THREE.MeshBasicMaterial) {
              // MeshBasicMaterial est souvent utilisé pour les objets transparents
              if (isTransparent) {
                material.side = THREE.DoubleSide;
              }
            }

            // Assigner un renderOrder pour le tri correct des objets transparents
            if (isTransparent) {
              child.renderOrder = 0; // Objets transparents rendus après les opaques
            } else {
              child.renderOrder = 1; // Objets opaques rendus en premier
            }

            // S'assurer que les textures sont bien appliquées selon le type de matériau
            if (material.map) {
              material.map.needsUpdate = true;
            }

            // Propriétés spécifiques aux MeshStandardMaterial et MeshPhysicalMaterial
            if (material instanceof THREE.MeshStandardMaterial ||
                material instanceof THREE.MeshPhysicalMaterial) {
              if (material.normalMap) {
                material.normalMap.needsUpdate = true;
              }
              if (material.roughnessMap) {
                material.roughnessMap.needsUpdate = true;
              }
              if (material.metalnessMap) {
                material.metalnessMap.needsUpdate = true;
              }
              if (material.emissiveMap) {
                material.emissiveMap.needsUpdate = true;
              }
            }

            // Propriétés pour MeshLambertMaterial
            if (material instanceof THREE.MeshLambertMaterial) {
              if (material.emissiveMap) {
                material.emissiveMap.needsUpdate = true;
              }
            }
          });
        }

        // Activer les ombres si nécessaire
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  private setupScrollParallax(): void {
    if (!this.model || !this.canvasContainer) return;

    this.ngZone.runOutsideAngular(() => {
      const container = this.canvasContainer.nativeElement;

      // Réinitialiser les valeurs de rotation du scroll
      this.scrollRotationY.value = 0;
      this.scrollRotationX.value = 0;

      // Animation GSAP optimisée - combiner plusieurs propriétés en une seule timeline
      if (this.model) {
        // Timeline unique pour synchroniser toutes les animations et réduire les calculs
        const scrollTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: container,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2, // Valeur optimisée pour fluidité
            invalidateOnRefresh: true,
          }
        });

        // Combiner position z et y dans une seule animation - réduit pour rester dans le hero
        scrollTimeline.to(this.model.position, {
          z: this.initialZPosition + 0.3, // Réduit de 1.2 à 0.3 pour éviter le débordement
          y: this.initialYPosition - 0.2, // Réduit de 0.8 à 0.2 pour éviter le débordement
          ease: 'none',
        }, 0);

        // Rotations synchronisées
        scrollTimeline.to(this.scrollRotationY, {
          value: Math.PI * 0.25,
          ease: 'power1.out',
        }, 0);

        scrollTimeline.to(this.scrollRotationX, {
          value: Math.PI * 0.08,
          ease: 'power1.out',
        }, 0);
      }
    });
  }

  private initAutoRotation(): void {
    // ROTATION INFINIE DÉSACTIVÉE - Le modèle reste fixe
    // Code commenté pour référence future si besoin de réactiver

    // Vitesses aléatoires mais constantes pour une rotation infinie ultra fluide
    // Pas de rotation verticale automatique, seulement horizontale
    // const baseSpeedY = 0.0008 + Math.random() * 0.0004;

    this.autoRotationSpeedX = 0; // Pas de rotation verticale automatique
    this.autoRotationSpeedY = 0; // DÉSACTIVÉ - Pas de rotation horizontale automatique
    // this.autoRotationSpeedY = (Math.random() > 0.5 ? 1 : -1) * baseSpeedY;

    // Angle initial : rotation vers la gauche pour orienter le modèle
    this.autoRotationTargetX = 0; // Pas d'inclinaison verticale
    this.autoRotationTargetY = Math.PI * -15 / 180; // ~-15 degrés en radians (rotation vers la gauche)
  }

  private updateAutoRotation(): void {
    // ROTATION INFINIE DÉSACTIVÉE - Le modèle reste à rotation fixe
    // Code commenté pour référence future si besoin de réactiver

    // Rotation perpétuelle horizontale uniquement : on incrémente sans jamais inverser la direction
    // Pas de rotation verticale automatique
    // this.autoRotationTargetY += this.autoRotationSpeedY;

    // Garder les valeurs fixes pour que le modèle reste à la même rotation
    // Les valeurs restent à leur état initial (autoRotationTargetY = 5 degrés)

    // Code commenté pour référence - garder les valeurs dans une plage raisonnable
    // const twoPI = Math.PI * 2;
    // if (this.autoRotationTargetX > twoPI || this.autoRotationTargetX < -twoPI) {
    //   this.autoRotationTargetX = this.autoRotationTargetX % twoPI;
    // }
    // if (this.autoRotationTargetY > twoPI || this.autoRotationTargetY < -twoPI) {
    //   this.autoRotationTargetY = this.autoRotationTargetY % twoPI;
    // }
  }

  private fitCameraToModel(model: THREE.Group): void {
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= 1.1; // Zoom plus fort - réduire le facteur pour agrandir le modèle (était 1.3)

    // Positionner la caméra parfaitement en face du modèle (centré)
    // La caméra est positionnée devant le modèle (même x et y que le centre, z augmenté)
    this.camera.position.set(center.x, center.y + 0.3, center.z + cameraZ);
    // Regarder parfaitement vers le centre du modèle
    this.camera.lookAt(center.x, center.y + 0.3, center.z);

    if (this.controls) {
      // Centrer la cible des contrôles sur le modèle
      this.controls.target.set(center.x, center.y + 0.3, center.z);
      this.controls.update();
    }
  }

  private disposeModel(model: THREE.Group): void {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }

  private animate(): void {
    if (this.isDestroyed) return;

    this.ngZone.runOutsideAngular(() => {
      const animateLoop = () => {
        if (this.isDestroyed) return;

        this.animationId = requestAnimationFrame(animateLoop);

        // Mettre à jour les animations du modèle (si elles existent)
        if (this.mixer) {
          const delta = this.clock.getDelta();
          this.mixer.update(delta);
        }

        // Animation fluide de la rotation basée sur la position de la souris
        // Combiner avec les rotations du scroll pour un effet parfait
        if (this.model) {
          // Mettre à jour la rotation automatique aléatoire
          this.updateAutoRotation();

          // Interpolation fluide UNIQUEMENT pour l'axe horizontal (Y)
          // L'axe vertical (X) reste toujours à 0 - aucun mouvement vertical
          const deltaY = this.targetRotationY - this.currentRotationY;

          // Facteur d'interpolation adaptatif pour l'axe horizontal uniquement
          const distanceY = Math.abs(deltaY);
          const lerpFactorY = distanceY > 0.05 ? 0.18 : 0.12;

          // Interpolation uniquement pour l'axe horizontal
          this.currentRotationY += deltaY * lerpFactorY;

          // Forcer la rotation verticale à toujours être 0
          this.currentRotationX = 0;

          // Retour progressif vers zéro si la souris est immobile horizontalement
          if (distanceY < 0.001) {
            this.currentRotationY *= 0.97;
          }

          // Appliquer la rotation combinée : rotation auto (0) + scroll + souris
          // Rotation auto désactivée donc autoRotationTargetX/Y = 0
          this.model.rotation.x = this.autoRotationTargetX + this.scrollRotationX.value + this.currentRotationX;
          this.model.rotation.y = this.autoRotationTargetY + this.scrollRotationY.value + this.currentRotationY;
          this.model.rotation.z = 0; // Pas de rotation Z pour garder le modèle droit
        }

        // Mettre à jour les contrôles
        if (this.controls) {
          this.controls.update();
        }

        // Rendu
        this.renderer.render(this.scene, this.camera);
      };

      animateLoop();
    });
  }

  private cleanup(): void {
    // Annuler l'animation
    if (this.animationId !== undefined) {
      cancelAnimationFrame(this.animationId);
    }

    // Nettoyer le ScrollTrigger
    if (this.scrollTriggerInstance) {
      this.scrollTriggerInstance.kill();
      this.scrollTriggerInstance = undefined;
    }

    // Supprimer le gestionnaire de redimensionnement
    const resizeHandler = (this as any)._resizeHandler;
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler);
    }

    // Supprimer le ResizeObserver
    const resizeObserver = (this as any)._resizeObserver;
    if (resizeObserver) {
      resizeObserver.disconnect();
    }

    // Supprimer l'observer de thème
    const themeObserver = (this as any)._themeObserver;
    if (themeObserver) {
      themeObserver.disconnect();
    }

    // Supprimer le gestionnaire de mouvement de la souris
    const mouseMoveHandler = (this as any)._mouseMoveHandler;
    if (mouseMoveHandler) {
      window.removeEventListener('mousemove', mouseMoveHandler);
    }

    // Nettoyer les contrôles
    if (this.controls) {
      this.controls.dispose();
    }

    // Nettoyer le mixer d'animation
    if (this.mixer) {
      this.mixer.stopAllAction();
      if (this.model) {
        this.mixer.uncacheRoot(this.model);
      }
      this.mixer = undefined;
    }

    // Nettoyer le modèle
    if (this.model) {
      this.disposeModel(this.model);
      this.scene.remove(this.model);
    }

    // Nettoyer le renderer
    if (this.renderer) {
      this.renderer.dispose();
      if (this.canvasContainer?.nativeElement) {
        this.canvasContainer.nativeElement.removeChild(this.renderer.domElement);
      }
    }

    // Nettoyer les loaders
    if (this.dracoLoader) {
      this.dracoLoader.dispose();
    }

    // Nettoyer la scène
    if (this.scene) {
      this.scene.clear();
    }
  }

  // Méthodes publiques pour contrôler la scène depuis l'extérieur
  public setAutoRotate(enabled: boolean): void {
    this.autoRotate = enabled;
    if (this.controls) {
      this.controls.autoRotate = enabled;
    }
  }

  public setBackgroundColor(color: string): void {
    this.backgroundColor = color;
    if (this.scene) {
      if (color !== 'transparent') {
        this.scene.background = new THREE.Color(color);
      } else {
        this.scene.background = null;
      }
    }
  }

  public loadNewModel(path: string): void {
    if (this.isDestroyed) return;
    this.loadModel(path);
  }
}

