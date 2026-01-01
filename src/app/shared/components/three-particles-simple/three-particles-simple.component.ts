import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { Subject, takeUntil } from 'rxjs';
import { ScrollMorphKey, ScrollMorphService } from '../../services/scroll-morph/scroll-morph.service';
import { DynamicPaletteService } from '../../services/dynamic-palette/dynamic-palette.service';
import { EventsStoreService } from '../../../services/events/events-store.service';

type Vec3 = { x: number; y: number; z: number };

type MorphKey = ScrollMorphKey & {
  /**
   * World Z plane used for screen->world placement.
   * If omitted, we use a camera-facing plane through the origin (more robust).
   */
  targetPlaneZ?: number;
  /**
   * Optional additional rotations applied to the sampled target positions.
   * Useful to tilt a model "en biais" without changing the camera.
   */
  rotateX?: number;
  rotateZ?: number;
  /**
   * Optional Y offset for models without targetSelector.
   * Positive values move the model down.
   */
  offsetY?: number;
  /**
   * Optional placement offset (world units) applied to this model's anchor position.
   * SSOT for per-model placement tweaks.
   *
   * - For targetSelector keys: added to the computed screen->world target (scaled by morph progress).
   * - For non-target keys (quality/games): added to the hero rest offset.
   */
  placeOffset?: Vec3;
  /**
   * Optional placement offset per breakpoint (SSOT).
   * Use this when a model must stay consistent across mobile/desktop after tuning hero offsets.
   */
  placeOffsetMobile?: Vec3;
  placeOffsetDesktop?: Vec3;
  /**
   * Optional rotation for the *whole* point cloud when this key is active.
   * SSOT for per-model orientation (prevents hero tweaks from pivoting other models).
   *
   * This rotation is blended with `baseRotation` using morph progress (quaternion slerp).
   */
  pointsRotation?: Vec3;
};

@Component({
  selector: 'app-three-particles-simple',
  standalone: true,
  template: `<div #host class="tp-host"></div>`,
  styles: [
    `
      .tp-host {
        width: 100%;
        height: 100%;
        display: block;
        overflow: visible;
        will-change: transform;
        transform: translateZ(0);
        position: relative;
        z-index: 10;
      }
      .tp-host canvas {
        width: 100% !important;
        height: 100% !important;
        display: block;
        pointer-events: none;
        will-change: contents;
        transform: translateZ(0);
        position: relative;
        z-index: 10;
        overflow: visible;
      }
    `,
  ],
})
export class ThreeParticlesSimpleComponent implements AfterViewInit, OnDestroy {
  @ViewChild('host', { static: true }) host!: ElementRef<HTMLDivElement>;

  @Input() modelPath: string = '/assets/models/unlock-model.glb';
  @Input() backgroundColor: string = 'transparent';
  @Input() cameraPosition: Vec3 = { x: 0, y: 0, z: 5 };
  @Input() fov = 50;
  @Input() autoRotate: boolean = false;
  @Input() baseRotation: Vec3 = { x: 0, y: -Math.PI / 2, z: 0 };
  @Input() organic = true;
  @Input() organicStrength = 0.022;
  @Input() organicSpeed = 1.0;
  @Input() mouseInteractive = true;
  @Input() mouseStrength = 0.06;
  @Input() pointSize = 0.012;
  @Input() opacity = 0.75;
  @Input() maxPoints = 150000;
  @Input() pauseWhenHidden = true;
  @Input() additive = false;
  /**
   * Base tint for the particles. By default we pull from CSS variables so the Three.js
   * look always matches the global theme palette (no hardcoded colors).
   */
  @Input() useThemeColors = true;
  @Input() colorLight = 0xffffff;
  @Input() colorDark = 0xcfeeff; // Fallback visible (light blue)

  // Multi-color palette (adds modern "AI" vivacity; avoids monochrome look)
  // FALLBACKS VISIBLES par défaut (bleu/cyan pour visibilité immédiate)
  private colorSecondary = 0x3b82f6; // Blue visible
  private colorTeal = 0x8b5cf6; // Purple visible

  @Input() entryAnimation = true;
  @Input() entryDuration = 1.2;
  @Input() entryDelay = 0.0;

  constructor(
    private readonly scrollMorph: ScrollMorphService,
    private readonly dynamicPalette: DynamicPaletteService,
    private readonly eventsStore: EventsStoreService,
  ) {}

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private loader!: GLTFLoader;
  private draco!: DRACOLoader;
  private points?: THREE.Points;
  private raf: number | null = null;
  private readyDispatched = false;
  private didPrefetchMorphModels = false;

  // Cross-instance (page-level) HTTP warm cache for large binary assets.
  private static readonly arrayBufferCache = new Map<string, Promise<ArrayBuffer>>();
  // Initialize startTime earlier so uTime starts with a non-zero value
  // This ensures the resonance pulse wave is already in motion at initialization
  private startTime = ((typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000) - 2.5;
  private loadStartTime = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;

  // Global tuning: keep particles a bit finer across the whole app (premium / less "chunky").
  private readonly GLOBAL_POINT_SIZE_MULT = 0.55;

  // Global tuning: keep particles closer to the model surface so silhouettes read better (less dispersion).
  private readonly GLOBAL_SHAPE_TIGHTNESS = 0.62;
  private entryStartTime = 0;
  private isLoaded = false;
  private io?: IntersectionObserver;
  private ro?: ResizeObserver;
  private isInView = true;
  private isTabVisible = true;
  private destroy$ = new Subject<void>();
  // Initialize mouse position FAR from center (outside viewport) to avoid initial "focus" effect
  // NDC coordinates: valid range is -1 to 1, so 2.0 is safely outside
  private mouseTarget = new THREE.Vector2(2.0, 2.0);
  private mouseSmoothed = new THREE.Vector2(2.0, 2.0);
  private mouseSmoothedPrev = new THREE.Vector2(2.0, 2.0);
  private mouseVel = new THREE.Vector2(0, 0);
  private mouseSpeed = 0;
  private hasMouseMoved = false; // Track if mouse has actually moved (prevents initial focus)
  private lastMouseUpdate = 0;
  private mouseUpdateThrottle = 16;
  private resizeTimeout: number | null = null;
  private uniformsDirty = true;
  // Smooth scroll -> shader (keeps default render identical, improves scroll animation only)
  private scrollTarget = 0;
  private scrollSmoothed = 0;
  // Track last CSS color values to detect changes
  private lastCssAccent: string | null = null;
  private colorCheckCounter = 0;
  private readonly COLOR_CHECK_INTERVAL = 30; // Check every 30 frames (~0.5s at 60fps)
  // Morph (when approaching About section)
  @Input() morphOnScroll = true;
  /**
   * Extensible morph configuration.
   * Add new entries to morph into other GLBs on scroll later.
   */
  @Input() morphKeys: MorphKey[] = [
    // Use a selector list so it works even if you later swap the component/tag.
    {
      id: 'about',
      modelPath: '/assets/models/unlock-model-about.glb',
      anchorSelector: 'app-about-section,[data-ui-section="about"]',
      // Place the morphed model where the About left visual lives.
      targetSelector: '[data-ui-morph-target="about-photo"]',
      // About model orientation: face the camera (was -90°, now 0° to face forward)
      // If you add more models later, set rotateY per model.
      // Strong pivot to the LEFT (applied to the sampled morph target itself)
      rotateY: (-55 * Math.PI) / 180,
      // Preserve legacy global facing (was driven by hero baseRotation). Keeps other models unchanged.
      // Keep point-cloud facing coherent with the morph pivot (left).
      pointsRotation: { x: 0, y: -Math.PI / 2 - (20 * Math.PI) / 180, z: 0 },
      // Progressive morph: synchronized with placement
      // Morph will accompany the scroll until the target reaches its final position
      // These values are fallbacks; actual morph timing is driven by target position
      startAtVh: 1.85,
      endAtVh: 0.35, // Lower value = morph finishes later, synchronized with placement
    },
    {
      id: 'business',
      modelPath: '/assets/models/unlock-model-buisness-.glb',
      anchorSelector: 'app-business-solutions-section,[data-ui-section="business-solutions"]',
      // Place the morphed model where the Business visual lives.
      targetSelector: '[data-ui-morph-target="business-photo"]',
      // Business model orientation: face the camera
      // Slight yaw (rotation around vertical axis) for a more "en billet" feel
      rotateY: Math.PI,
      // Tilt "en biais"
      rotateX: 0.12,
      rotateZ: -0.10,
      // Preserve legacy global facing
      pointsRotation: { x: 0, y: -Math.PI / 2, z: 0 },
      // Progressive morph: synchronized with placement
      startAtVh: 1.85,
      endAtVh: 0.35,
    },
    {
      id: 'reviews',
      modelPath: '/assets/models/unlock-model-review-.glb',
      anchorSelector: 'app-reviews-section,[data-ui-section="reviews"]',
      targetSelector: '[data-ui-morph-target="reviews-photo"]',
      rotateY: 0,
      // Slight tilt for a premium feel (can be tuned)
      rotateX: 0.08,
      rotateZ: 0.0,
      // Preserve legacy global facing
      pointsRotation: { x: 0, y: -Math.PI / 2, z: 0 },
      startAtVh: 1.85,
      endAtVh: 0.35,
    },
    {
      id: 'quality',
      modelPath: '/assets/models/unlock-model-quality.glb',
      anchorSelector: 'app-quality-section,[data-ui-section="quality"]',
      rotateY: 0,
      rotateX: 0.06,
      rotateZ: 0.0,
      startAtVh: 1.85,
      endAtVh: 0.35,
      offsetY: -0.25, // Descend le modèle (valeur négative pour descendre)
      // Keep the same visual Y after raising hero rest offsets (desktop + mobile)
      placeOffsetDesktop: { x: 0, y: -0.04, z: 0 },
      placeOffsetMobile: { x: 0, y: -0.60, z: 0 }, // Descendu plus en mobile
      // Preserve legacy global facing
      pointsRotation: { x: 0, y: -Math.PI / 2, z: 0 },
    },
    {
      id: 'locky-games',
      modelPath: '/assets/models/unlock-model-games.glb',
      anchorSelector: 'app-locky-games-section,[data-ui-section="locky-games"]',
      rotateY: 0,
      rotateX: 0.06,
      rotateZ: 0.0,
      startAtVh: 1.85,
      endAtVh: 0.35,
      offsetY: -0.25, // Descend le modèle (valeur négative pour descendre)
      // Keep the same visual Y after raising hero rest offsets (desktop + mobile)
      placeOffsetDesktop: { x: 0, y: -0.04, z: 0 },
      placeOffsetMobile: { x: 0, y: -0.60, z: 0 }, // Descendu plus en mobile
      // Preserve legacy global facing
      pointsRotation: { x: 0, y: -Math.PI / 2, z: 0 },
    },
    {
      id: 'events',
      modelPath: '/assets/models/unlock-model-event.glb',
      anchorSelector: 'app-events-section,[data-ui-section="events"]',
      // Place the morphed model where the Events left visual lives.
      targetSelector: '[data-ui-morph-target="events-photo"]',
      rotateY: 0,
      rotateX: 0.06,
      rotateZ: 0.0,
      startAtVh: 1.85,
      endAtVh: 0.35,
      // Same placement logic as `quality` (SSOT): stable desktop + lowered in mobile
      offsetY: -0.25,
      placeOffsetDesktop: { x: 0, y: -0.04, z: 0 },
      placeOffsetMobile: { x: 0, y: -0.60, z: 0 },
      // Default (model): keep the same facing as other section models.
      // For the *date text mode*, we override rotation at runtime to face the camera.
      pointsRotation: { x: 0, y: -Math.PI / 2, z: 0 },
    },
  ];
  private morphTarget = 0;
  private morphTargetSmoothed = 0; // Smooth the target itself for ultra-fluid morph
  private morphSmoothed = 0;

  // Events morph can be dynamic (date text) when upcoming events exist.
  private eventsHasUpcoming = false;
  private eventsNextDateText: string | null = null;
  private activeMorphKeyId: string | null = null;
  // Rotation SSOT (quaternion) — stable per-model orientation
  private baseRotationQuat = new THREE.Quaternion();
  private keyRotationQuat = new THREE.Quaternion();
  private rotationTargetQuat = new THREE.Quaternion();
  private rotationSmoothedQuat = new THREE.Quaternion();
  private readonly tmpEuler = new THREE.Euler(0, 0, 0, 'YXZ');
  // Keep last best morph id for rotation blending (independent from activeMorphKeyId toggling)
  private lastBestId: string | null = null;
  private lastBestT: number = 0;
  private morphPositionsById = new Map<string, Float32Array>();
  private morphLoadingById = new Map<string, Promise<Float32Array>>();
  private morphAttrFrom: THREE.BufferAttribute | null = null;
  private morphAttrTo: THREE.BufferAttribute | null = null;
  private basePositions: Float32Array | null = null;
  private morphTargetMixTarget = 1.0;
  private morphTargetMixSmoothed = 1.0;
  private morphTargetKey: string = '__base__';
  private basePointCount = 0;
  private baseRadius = 1.0;
  // Deterministic sampling seed (keeps silhouettes stable across refreshes and morphs)
  private readonly SAMPLE_SEED = 1337;
  // Responsive tuning (used only for default camera + hero rest placement)
  private readonly MOBILE_BREAKPOINT = 640;
  // Mobile: make the hero model smaller + slightly higher
  private readonly MOBILE_CAMERA_Z_MULT = 3.4; // bigger => smaller model
  private readonly MOBILE_CAMERA_Y = -0.28; // negative => model appears higher on screen (we look at origin)
  // Mobile: make morphed models (non-hero) BIGGER by reducing camera distance
  private readonly MOBILE_MORPHED_CAMERA_Z_MULT = 1.8; // bigger => smaller model (éloigner la caméra pour réduire) - beaucoup réduit
  // Desktop: make the hero model bigger (rapprocher la caméra)
  private readonly DESKTOP_CAMERA_Z_MULT = 0.85; // smaller => bigger model (rapprocher la caméra)
  // Morph placement (screen -> world)
  private morphPlaceSmoothed = new THREE.Vector3(0, 0, 0);
  private morphPlaceTarget = new THREE.Vector3(0, 0, 0);
  // Slightly lift the hero resting model so it doesn't overlap hero text.
  // Only used when no morph target is active.
  private readonly heroRestOffsetDesktop = new THREE.Vector3(0, 0.30, 0);
  private readonly heroRestOffsetMobile = new THREE.Vector3(0, 1.40, 0);
  private morphTargetEl: HTMLElement | null = null;
  private morphTargetElKey: string | null = null;
  private lastTargetRectMs = 0;
  private cachedTargetRect: DOMRect | null = null;
  private cachedCanvasRect: DOMRect | null = null;
  private morphPlacePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  private morphRay = new THREE.Raycaster();
  private tmpNdc = new THREE.Vector3();
  private tmpWorld = new THREE.Vector3();
  private tmpCamDir = new THREE.Vector3();

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') return;
    this.init();
    this.load(this.modelPath);
    this.installVisibilityHandlers();
    this.start();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stop();
    this.dispose();
  }

  private init(): void {
    const el = this.host.nativeElement;
    const rect = el.getBoundingClientRect();
    const w = Math.max(1, rect.width || el.clientWidth || window.innerWidth);
    const h = Math.max(1, rect.height || el.clientHeight || window.innerHeight);

    this.scene = new THREE.Scene();
    this.scene.background = this.backgroundColor === 'transparent' ? null : new THREE.Color(this.backgroundColor);

    this.applyThemeColorsFromCss();

    // Keep Three.js colors perfectly synced with the palette tween (no lag).
    // This avoids relying on polling getComputedStyle every N frames.
    this.dynamicPalette.activePalette$
      .pipe(takeUntil(this.destroy$))
      .subscribe((p) => {
        if (!this.useThemeColors) return;
        const a = this.parseCssColorToHexInt(p.accent);
        const b = this.parseCssColorToHexInt(p.secondary);
        const c = this.parseCssColorToHexInt(p.teal);

        let changed = false;
        if (typeof a === 'number') {
          this.colorDark = a;
          changed = true;
        }
        if (typeof b === 'number') {
          this.colorSecondary = b;
          changed = true;
        }
        if (typeof c === 'number') {
          this.colorTeal = c;
          changed = true;
        }
        if (changed) this.uniformsDirty = true;
      });

    // Events (public) — provide dynamic date text for the `events` morph when available.
    this.eventsStore.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe((s) => {
        this.eventsHasUpcoming = !!s.hasUpcoming;
        this.eventsNextDateText = s.nextDateText || null;
      });

    this.camera = new THREE.PerspectiveCamera(this.fov, w / h, 0.05, 2000);
    this.camera.position.set(this.cameraPosition.x, this.cameraPosition.y, this.cameraPosition.z);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setSize(w, h);
    this.renderer.setClearColor(0x000000, 0);
    el.appendChild(this.renderer.domElement);

    requestAnimationFrame(() => this.onResize());
    if (typeof ResizeObserver !== 'undefined') {
      this.ro = new ResizeObserver(() => this.onResize());
      this.ro.observe(el);
    }

    this.draco = new DRACOLoader();
    // Serve Draco decoders from same-origin (faster, cacheable, no external dependency).
    this.draco.setDecoderPath('/assets/draco/');
    this.draco.setDecoderConfig({ type: 'wasm' });
    this.draco.setWorkerLimit(Math.min(4, (navigator as any).hardwareConcurrency || 4));
    this.draco.preload();

    this.loader = new GLTFLoader();
    this.loader.setDRACOLoader(this.draco);

    window.addEventListener('resize', this.onResize, { passive: true });
    window.addEventListener('pointermove', this.onWindowPointerMove, { passive: true });
    window.addEventListener('scroll', this.onWindowScroll);

    // Initialize scroll values to avoid any first-frame "jump"
    this.scrollTarget = Math.max(0, window.scrollY || 0);
    this.scrollSmoothed = this.scrollTarget;
    this.morphTarget = 0;
    this.morphTargetSmoothed = 0;
    this.morphSmoothed = 0;
  }

  private applyThemeColorsFromCss(): void {
    if (!this.useThemeColors || typeof window === 'undefined') {
      // Fallback visible si useThemeColors est désactivé
      this.colorDark = 0xcfeeff;
      this.colorSecondary = 0x3b82f6;
      this.colorTeal = 0x8b5cf6;
      this.uniformsDirty = true;
      return;
    }

    try {
      const css = getComputedStyle(document.documentElement);
      let accent = css.getPropertyValue('--ui-nebula-accent')?.trim();
      let secondary = css.getPropertyValue('--ui-nebula-secondary')?.trim();
      let tertiary = css.getPropertyValue('--ui-nebula-tertiary')?.trim();
      let teal = css.getPropertyValue('--ui-nebula-teal')?.trim();

      // Si les valeurs sont des var(), résoudre récursivement
      if (accent?.startsWith('var(')) {
        const varName = accent.match(/var\(--([^)]+)\)/)?.[1];
        if (varName) accent = css.getPropertyValue(`--${varName}`)?.trim() || accent;
      }
      if (secondary?.startsWith('var(')) {
        const varName = secondary.match(/var\(--([^)]+)\)/)?.[1];
        if (varName) secondary = css.getPropertyValue(`--${varName}`)?.trim() || secondary;
      }
      if (teal?.startsWith('var(')) {
        const varName = teal.match(/var\(--([^)]+)\)/)?.[1];
        if (varName) teal = css.getPropertyValue(`--${varName}`)?.trim() || teal;
      }

      // Prefer accent for base tint; fallback to tertiary/teal if missing
      const base = this.parseCssColorToHexInt(accent) ?? this.parseCssColorToHexInt(tertiary) ?? this.parseCssColorToHexInt(teal) ?? this.parseCssColorToHexInt(secondary) ?? 0xcfeeff;
      const alt = this.parseCssColorToHexInt(tertiary) ?? this.parseCssColorToHexInt(accent) ?? this.parseCssColorToHexInt(teal) ?? this.parseCssColorToHexInt(secondary) ?? 0xffffff;
      const sec = this.parseCssColorToHexInt(secondary) ?? this.parseCssColorToHexInt(accent) ?? this.parseCssColorToHexInt(teal) ?? 0x3b82f6;
      const tealHex = this.parseCssColorToHexInt(teal) ?? this.parseCssColorToHexInt(secondary) ?? this.parseCssColorToHexInt(accent) ?? 0x8b5cf6;

      // Toujours définir des valeurs visibles (fallbacks garantis)
        this.colorDark = base;
        this.colorLight = alt;
      this.colorSecondary = sec;
      this.colorTeal = tealHex;
      this.lastCssAccent = accent || null;
      this.uniformsDirty = true;
    } catch (e) {
      // Fallback visible en cas d'erreur
      console.warn('Failed to parse CSS colors, using fallbacks', e);
      this.colorDark = 0xcfeeff;
      this.colorSecondary = 0x3b82f6;
      this.colorTeal = 0x8b5cf6;
      this.uniformsDirty = true;
    }
  }

  private parseCssColorToHexInt(input?: string | null): number | null {
    if (!input) return null;
    const s = input.trim();
    if (!s) return null;

    // #rgb / #rrggbb
    const hex = s.startsWith('#') ? s.slice(1) : '';
    if (hex) {
      if (hex.length === 3) {
        const r = parseInt(hex[0] + hex[0], 16);
        const g = parseInt(hex[1] + hex[1], 16);
        const b = parseInt(hex[2] + hex[2], 16);
        if ([r, g, b].some((v) => Number.isNaN(v))) return null;
        return (r << 16) | (g << 8) | b;
      }
      if (hex.length === 6) {
        const n = parseInt(hex, 16);
        return Number.isNaN(n) ? null : n;
      }
      return null;
    }

    // rgb(...) / rgba(...)
    const m = s.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i);
    if (m) {
      const r = Math.max(0, Math.min(255, Math.round(parseFloat(m[1]))));
      const g = Math.max(0, Math.min(255, Math.round(parseFloat(m[2]))));
      const b = Math.max(0, Math.min(255, Math.round(parseFloat(m[3]))));
      if ([r, g, b].some((v) => Number.isNaN(v))) return null;
      return (r << 16) | (g << 8) | b;
    }

    return null;
  }

  private smoothstep(edge0: number, edge1: number, x: number): number {
    const t = Math.max(0, Math.min(1, (x - edge0) / Math.max(0.0001, edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  private isMobileLayout(width?: number): boolean {
    if (typeof window === 'undefined') return false;
    const w = width ?? window.innerWidth ?? 9999;
    return w < this.MOBILE_BREAKPOINT;
  }

  private getHeroRestOffset(width?: number): THREE.Vector3 {
    return this.isMobileLayout(width) ? this.heroRestOffsetMobile : this.heroRestOffsetDesktop;
  }

  /**
   * Met à jour la position de la caméra selon le modèle actif (hero vs morphé) et le mode mobile/desktop
   */
  private updateCameraForModel(): void {
    if (!this.points || !this.isLoaded || !this.camera) return;
    
    const isDefaultCam =
      this.cameraPosition.x === 0 && this.cameraPosition.y === 0 && this.cameraPosition.z === 5;
    if (!isDefaultCam) return; // Ne pas modifier si la caméra est personnalisée

    const el = this.host?.nativeElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const w = Math.max(1, rect.width || el.clientWidth || window.innerWidth);
    
    const bounds = new THREE.Box3().setFromObject(this.points);
    const size = bounds.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const fov = this.camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= 1.15;
    
    const isMobile = this.isMobileLayout(w);
    const cameraY = isMobile ? this.MOBILE_CAMERA_Y : 0;
    
    // Détecter si on est sur un modèle morphé (pas le hero)
    const isMorphedModel = !!(this.activeMorphKeyId || this.lastBestId);
    
    if (isMobile) {
      if (isMorphedModel) {
        // Mobile + modèle morphé: AGRANDIR en rapprochant la caméra
        cameraZ *= this.MOBILE_MORPHED_CAMERA_Z_MULT;
      } else {
        // Mobile + hero: RÉDUIRE la taille (logique existante)
        cameraZ *= this.MOBILE_CAMERA_Z_MULT;
      }
    } else {
      // Desktop: rapprocher la caméra pour agrandir le modèle
      cameraZ *= this.DESKTOP_CAMERA_Z_MULT;
    }
    
    this.camera.position.set(0, cameraY, cameraZ);
    this.camera.lookAt(0, 0, 0);
  }

  private onWindowScroll = (): void => {
    // Don't push the raw scroll into the shader here (can look "steppy").
    // We smooth it inside the RAF loop for a premium transition.
    this.scrollTarget = Math.max(0, window.scrollY || 0);
  };

  private onResize = (): void => {
    if (this.resizeTimeout !== null) {
      cancelAnimationFrame(this.resizeTimeout);
    }
    this.resizeTimeout = requestAnimationFrame(() => {
      const el = this.host?.nativeElement;
      if (!el || !this.camera || !this.renderer) return;
      const rect = el.getBoundingClientRect();
      const w = Math.max(1, rect.width || el.clientWidth || window.innerWidth);
      const h = Math.max(1, rect.height || el.clientHeight || window.innerHeight);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      
      // Ajuster la position Z de la caméra selon le modèle actif (hero vs morphé)
      if (this.points && this.isLoaded) {
        const bounds = new THREE.Box3().setFromObject(this.points);
        const size = bounds.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const fov = this.camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        cameraZ *= 1.15;
        
        // Utiliser la fonction centralisée pour mettre à jour la caméra
        this.updateCameraForModel();
      }
      
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      this.renderer.setSize(w, h);
      this.resizeTimeout = null;
    });
  };

  private onWindowPointerMove = (ev: PointerEvent): void => {
    if (!this.mouseInteractive) return;
    const now = performance.now();
    if (now - this.lastMouseUpdate < this.mouseUpdateThrottle) return;
    this.lastMouseUpdate = now;
    
    const w = Math.max(1, window.innerWidth);
    const h = Math.max(1, window.innerHeight);
    const nx = (ev.clientX / w) * 2 - 1;
    const ny = -((ev.clientY / h) * 2 - 1);
    this.mouseTarget.set(THREE.MathUtils.clamp(nx, -1, 1), THREE.MathUtils.clamp(ny, -1, 1));
    this.hasMouseMoved = true; // Mark that mouse has actually moved
    this.uniformsDirty = true;
  };

  private installVisibilityHandlers(): void {
    const onVis = () => {
      this.isTabVisible = document.visibilityState === 'visible';
      if (this.isTabVisible) this.start();
      else this.stop();
    };
    document.addEventListener('visibilitychange', onVis, { passive: true } as any);
    (this as any)._onVis = onVis;

    if (!this.pauseWhenHidden) return;
    if (typeof IntersectionObserver === 'undefined') return;

    this.io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        this.isInView = !!entry?.isIntersecting;
        if (this.isInView) this.start();
        else this.stop();
      },
      { root: null, threshold: 0.01 }
    );
    this.io.observe(this.host.nativeElement);
  }

  private load(url: string): void {
    this.loadGltfScene(url)
      .then((scene) => {
        const built = this.buildPointCloud(scene);
        this.setPoints(built.points, built.bounds);
      })
      .catch((err) => {
        if (typeof window !== 'undefined') {
          console.error('[ThreeParticlesSimple] GLB load failed', err, 'URL:', url);
        }
      });
  }

  private fetchArrayBuffer(url: string): Promise<ArrayBuffer> {
    const u = String(url || '').trim();
    if (!u) return Promise.reject(new Error('Missing URL'));
    const cached = ThreeParticlesSimpleComponent.arrayBufferCache.get(u);
    if (cached) return cached;
    const p = fetch(u, { cache: 'force-cache' })
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to fetch ${u} (${r.status})`);
        return r.arrayBuffer();
      })
      .catch((e) => {
        // Allow retry on next call.
        ThreeParticlesSimpleComponent.arrayBufferCache.delete(u);
        throw e;
      });
    ThreeParticlesSimpleComponent.arrayBufferCache.set(u, p);
    return p;
  }

  private async loadGltfScene(url: string): Promise<THREE.Object3D> {
    if (!this.loader) throw new Error('GLTFLoader not initialized');
    const data = await this.fetchArrayBuffer(url);
    const basePath = url.includes('/') ? url.slice(0, url.lastIndexOf('/') + 1) : '/';
    const gltf = await new Promise<any>((resolve, reject) => {
      this.loader.parse(data as any, basePath, (g) => resolve(g), (e) => reject(e));
    });
    return gltf.scene as THREE.Object3D;
  }

  private prefetchMorphModelsOnce(): void {
    if (this.didPrefetchMorphModels) return;
    this.didPrefetchMorphModels = true;
    const paths = Array.from(
      new Set([this.modelPath, ...(this.morphKeys || []).map((k) => k.modelPath)].filter(Boolean) as string[]),
    );
    // Fire-and-forget warmup (keeps scroll morph snappy when user reaches sections).
    (async () => {
      for (const p of paths) {
        try {
          await this.fetchArrayBuffer(p);
        } catch {
          // ignore
        }
        await new Promise((r) => setTimeout(r, 140));
      }
    })();
  }

  private setPoints(points: THREE.Points, bounds: THREE.Box3): void {
    if (this.points) {
      this.scene.remove(this.points);
      this.disposePoints(this.points);
    }
    this.points = points;
    this.scene.add(points);
    // Initialize SSOT rotation from baseRotation (hero-facing by usage)
    this.tmpEuler.set(this.baseRotation.x, this.baseRotation.y, this.baseRotation.z);
    this.baseRotationQuat.setFromEuler(this.tmpEuler);
    this.rotationSmoothedQuat.copy(this.baseRotationQuat);
    this.rotationTargetQuat.copy(this.baseRotationQuat);
    this.points.quaternion.copy(this.rotationSmoothedQuat);

    const isDefaultCam =
      this.cameraPosition.x === 0 && this.cameraPosition.y === 0 && this.cameraPosition.z === 5;
    if (isDefaultCam) {
      // Position initiale par défaut (sera mise à jour par updateCameraForModel() après isLoaded)
      const isMobile = this.isMobileLayout();
      const cameraY = isMobile ? this.MOBILE_CAMERA_Y : 0;
    const size = bounds.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const fov = this.camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= 1.15;
      if (isMobile) {
        cameraZ *= this.MOBILE_CAMERA_Z_MULT; // Hero par défaut
      } else {
        cameraZ *= this.DESKTOP_CAMERA_Z_MULT;
      }
      this.camera.position.set(0, cameraY, cameraZ);
      this.camera.lookAt(0, 0, 0);
    } else {
      this.camera.position.set(this.cameraPosition.x, this.cameraPosition.y, this.cameraPosition.z);
      this.camera.lookAt(0, 0, 0);
    }

    this.isLoaded = true;

    // Warm-cache other morph models as soon as the hero is ready.
    this.prefetchMorphModelsOnce();

    // Notify bootstrap loader gate once (avoids "empty hero then pop-in").
    if (!this.readyDispatched && typeof window !== 'undefined') {
      this.readyDispatched = true;
      try {
        window.dispatchEvent(new Event('three-particles-ready'));
      } catch {
        // ignore
      }
    }
    
    // Mettre à jour la caméra avec la logique hero vs morphé après chargement
    if (isDefaultCam) {
      // Utiliser requestAnimationFrame pour s'assurer que isLoaded est bien défini
      requestAnimationFrame(() => {
        this.updateCameraForModel();
      });
    }
    this.loadStartTime = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
    
    if (this.entryAnimation) {
      this.entryStartTime = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000 + this.entryDelay;
      const mat = this.points.material as THREE.ShaderMaterial;
      (mat.uniforms as any).uEntryProgress.value = 0.0;
    }

    this.applyThemeColor();
  }

  private applyThemeColor(): void {
    if (!this.points) return;
    const mat = this.points.material as THREE.ShaderMaterial;
    // Theme colors (multi-color) - GARANTIE VISIBILITÉ
    const uniforms = mat.uniforms as any;
    uniforms.uColor.value.setHex(this.colorDark);
    uniforms.uColor2.value.setHex(this.colorSecondary);
    uniforms.uColor3.value.setHex(this.colorTeal);
    uniforms.uOpacity.value = this.opacity;
    
    // DEBUG: Log pour vérifier que les couleurs sont bien appliquées
    if (typeof window !== 'undefined' && (window as any).__DEBUG_PARTICLES) {
      console.log('[Particles] Colors applied:', {
        uColor: `#${this.colorDark.toString(16)}`,
        uColor2: `#${this.colorSecondary.toString(16)}`,
        uColor3: `#${this.colorTeal.toString(16)}`,
        uOpacity: this.opacity,
      });
    }
    // No needsUpdate: uniforms update does not require shader recompilation.
  }

  private start(): void {
    if (!this.isTabVisible) return;
    if (this.pauseWhenHidden && !this.isInView) return;
    if (this.raf !== null) return;
    
    let uniformsCache: any = null;
    
    const tick = () => {
      this.raf = requestAnimationFrame(tick);
      if (this.points) {
        const lerp = 0.08;
        const prevMouseX = this.mouseSmoothed.x;
        const prevMouseY = this.mouseSmoothed.y;
        this.mouseSmoothed.lerp(this.mouseTarget, lerp);
        
        if (this.uniformsDirty || Math.abs(this.mouseSmoothed.x - prevMouseX) > 0.0001 || Math.abs(this.mouseSmoothed.y - prevMouseY) > 0.0001) {
          this.mouseVel.copy(this.mouseSmoothed).sub(this.mouseSmoothedPrev);
          this.mouseSmoothedPrev.copy(this.mouseSmoothed);
          this.mouseSpeed = Math.min(1.0, this.mouseVel.length() * 18.0);
        }

        if (!uniformsCache) {
          const mat = this.points.material as THREE.ShaderMaterial;
          uniformsCache = mat.uniforms as any;
        }

        const currentTime = ((typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000) - this.startTime;
        uniformsCache.uTime.value = currentTime;
        
        if (this.isLoaded && uniformsCache.uLoadProgress) {
          const loadElapsed = ((typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000) - this.loadStartTime;
          const loadProgress = Math.min(1.0, loadElapsed * 2.0);
          uniformsCache.uLoadProgress.value = loadProgress;
        }
        
        if (this.entryAnimation && uniformsCache.uEntryProgress !== undefined) {
          const currentTime = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
          const entryElapsed = currentTime - this.entryStartTime;
          if (entryElapsed >= 0) {
            const entryProgress = Math.min(1.0, entryElapsed / this.entryDuration);
            uniformsCache.uEntryProgress.value = entryProgress;
          }
        }
        
        // NOTE: palette sync is handled by DynamicPaletteService.activePalette$ subscription above
        // (frame-perfect during tween). Keep counters for compatibility but no polling here.
        this.colorCheckCounter++;

        if (this.uniformsDirty) {
          uniformsCache.uMouse.value.set(this.mouseSmoothed.x, this.mouseSmoothed.y);
          uniformsCache.uMouseVel.value.set(this.mouseVel.x, this.mouseVel.y);
          uniformsCache.uMouseSpeed.value = this.mouseSpeed;
          // Also update color when uniforms are dirty (color may have changed from CSS)
          if (this.useThemeColors) {
            uniformsCache.uColor.value.setHex(this.colorDark);
            uniformsCache.uColor2.value.setHex(this.colorSecondary);
            uniformsCache.uColor3.value.setHex(this.colorTeal);
          }
          this.uniformsDirty = false;
        }
        
        uniformsCache.uOrganic.value = this.organic ? 1.0 : 0.0;
        uniformsCache.uOrganicStrength.value = this.organicStrength;
        uniformsCache.uOrganicSpeed.value = this.organicSpeed;
        uniformsCache.uMouseStrength.value = this.mouseInteractive ? this.mouseStrength : 0.0;
        // Smooth scroll for shader (animation only; default state stays the same)
        const scrollLerp = 0.14; // higher = more reactive, lower = smoother
        this.scrollSmoothed += (this.scrollTarget - this.scrollSmoothed) * scrollLerp;
        uniformsCache.uScrollY.value = this.scrollSmoothed * 0.002;

        // ============================================================
        // SCROLL MORPH (SSOT): computed by ScrollMorphService
        // ============================================================
        // This is the single source of truth for progress across ALL sections.
        if (this.morphOnScroll) {
          const { bestId, bestT } = this.scrollMorph.compute(this.morphKeys || []);
          this.morphTarget = bestT;
          this.lastBestId = bestId;
          this.lastBestT = bestT;

          // Preload morph positions for best candidate (ensures instant morph on activation)
          const bestKey = bestId ? (this.morphKeys || []).find((k) => k.id === bestId) : undefined;
          const bestCacheKey = bestId && bestKey ? this.getMorphCacheKey(bestId, bestKey) : null;

          if (bestId && bestKey && bestCacheKey && !this.morphPositionsById.has(bestCacheKey) && !this.morphLoadingById.has(bestCacheKey) && this.basePointCount > 0) {
            const key = (this.morphKeys || []).find((k) => k.id === bestId);
            if (key) {
              const preload = this.loadMorphPositionsForKey(key, this.basePointCount, this.baseRadius)
                .then((arr) => {
                  this.morphPositionsById.set(bestCacheKey, arr);
                  return arr;
                })
                .finally(() => {
                  this.morphLoadingById.delete(bestCacheKey);
                });
              this.morphLoadingById.set(bestCacheKey, preload);
            }
          }

          // Activation: switch active morph target when the service says so
          if (bestId && bestT > 0.001) {
            if (bestId !== this.activeMorphKeyId) {
              this.activeMorphKeyId = bestId;
              // Palette is managed by ScrollPaletteService (decoupled from morph).
              // Here we only re-read CSS vars to keep Three.js tint in sync.
              // Use setTimeout to ensure CSS variables are updated first
              setTimeout(() => {
                if (this.useThemeColors) {
                  this.applyThemeColorsFromCss();
                  // Immediately update Three.js uniforms with new colors
                  this.applyThemeColor();
                }
              }, 0);
              // Mettre à jour la caméra pour le nouveau modèle (mobile: agrandir les modèles morphés)
              this.updateCameraForModel();
              this.ensureMorphTargetApplied(bestId).catch(() => {
                // ignore (fallback: stays on base positions)
              });
            }
          } else {
            // When leaving all sections, smoothly blend the target back to base
            if (this.morphAttrFrom && this.morphAttrTo && this.basePositions && this.morphTargetKey !== '__base__') {
              this.applyMorphTargetSwap(this.basePositions, '__base__');
            }
            // Leaving all morph sections: just re-read CSS vars (palette service decides what base is).
            if (this.activeMorphKeyId !== null) {
              setTimeout(() => {
                if (this.useThemeColors) {
                  this.applyThemeColorsFromCss();
                  this.applyThemeColor();
                }
              }, 0);
            }
            this.activeMorphKeyId = null;
            // Mettre à jour la caméra pour revenir au hero (mobile: taille normale)
            this.updateCameraForModel();
          }
        } else {
          this.morphTarget = 0;
          this.activeMorphKeyId = null;
        }
        
        // TARGET SMOOTHING: make it more reactive (faster to reach the final shape)
        // Higher = more responsive, still stable (no jitter).
        const targetLerp = 0.16;
        this.morphTargetSmoothed += (this.morphTarget - this.morphTargetSmoothed) * targetLerp;

        // OPTIMIZED MORPH LERP: Perfectly smooth, natural progression
        // Creates a flawlessly smooth, cinematic morph that feels natural and fluid
        const isMorphingIn = this.morphTargetSmoothed > this.morphSmoothed;
        const morphProgress = this.morphSmoothed;
        const morphDelta = Math.abs(this.morphTargetSmoothed - this.morphSmoothed);
        
        // MORPH LERP: speed up convergence (users perceive “formation” as too slow)
        let baseLerp = isMorphingIn ? 0.06 : 0.075;
        
        // OPTIMIZED PROGRESSIVE SLOWDOWN: Natural, smooth deceleration
        if (isMorphingIn) {
          // Smooth deceleration curve: faster at start, slower near end
          // Use quadratic curve for optimal balance between smoothness and responsiveness
          const progressFactor = 1.0 - (morphProgress * morphProgress); // Quadratic slowdown
          baseLerp = 0.085 * (0.55 + progressFactor * 0.45); // Range: ~0.047 to 0.085 (more reactive)
          
          // Additional smooth slowdown when very close for perfect finish
          if (morphDelta < 0.16) {
            const closeFactor = morphDelta / 0.2; // 0 to 1 as we approach
            const closeSlowdown = 0.55 + closeFactor * 0.45; // 55% to 100% of base lerp
            baseLerp *= closeSlowdown;
          }
        }
        
        // Apply optimized smooth lerp using smoothed target
        this.morphSmoothed += (this.morphTargetSmoothed - this.morphSmoothed) * baseLerp;
        
        // Snap to exact values when very close (avoid micro-drift)
        if (this.morphTargetSmoothed < 0.0002 && Math.abs(this.morphSmoothed) < 0.0002) {
          this.morphSmoothed = 0;
          this.morphTargetSmoothed = 0;
        }
        if (this.morphTargetSmoothed > 0.9995 && Math.abs(1 - this.morphSmoothed) < 0.0002) {
          this.morphSmoothed = 1;
          this.morphTargetSmoothed = 1;
        }
        if (uniformsCache.uMorph !== undefined) uniformsCache.uMorph.value = this.morphSmoothed;
        // Smoothly blend between morph targets when switching sections
        const targetMixLerp = 0.09;
        this.morphTargetMixSmoothed += (this.morphTargetMixTarget - this.morphTargetMixSmoothed) * targetMixLerp;
        if (uniformsCache.uMorphTargetMix !== undefined) uniformsCache.uMorphTargetMix.value = this.morphTargetMixSmoothed;
        // Enable breakup only while morphing (keeps hero/base crisp).
        if (uniformsCache.uBreakStrength !== undefined) {
          const m = this.morphSmoothed;
          const active = this.activeMorphKeyId ? 1.0 : 0.0;
          // Soft gate: 0 when idle, 1 when mid-morph.
          const gate = m > 0.0005 && m < 0.9995 ? 1.0 : 0.0;
          uniformsCache.uBreakStrength.value = active * gate;
        }

        // Placement: move the whole point cloud toward a DOM target (e.g. About left photo)
        // so the morphed model materializes exactly where you want.
        this.updateMorphRotation();
        if (this.autoRotate) this.points.rotateY(0.002);
        this.updateMorphPlacement();
      }
      this.renderer.render(this.scene, this.camera);
    };
    tick();
  }

  /**
   * Per-model rotation SSOT:
   * - `baseRotation` is the hero/default orientation.
   * - `pointsRotation` on keys preserves the original facing of section models.
   * - rotation is blended using `morphSmoothed` for stability and coherence.
   */
  private updateMorphRotation(): void {
    if (!this.points) return;

    // Base quaternion from current baseRotation input
    this.tmpEuler.set(this.baseRotation.x, this.baseRotation.y, this.baseRotation.z);
    this.baseRotationQuat.setFromEuler(this.tmpEuler);

    const key = this.lastBestId ? (this.morphKeys || []).find((k) => k.id === this.lastBestId) : undefined;

    // Special case: Events date-text should face the camera (flat text would otherwise look "de profil").
    const isEventsTextMode = key?.id === 'events' && this.eventsHasUpcoming && !!this.eventsNextDateText;
    const targetRot = isEventsTextMode ? { x: 0, y: 0, z: 0 } : (key?.pointsRotation ?? this.baseRotation);

    this.tmpEuler.set(targetRot.x, targetRot.y, targetRot.z);
    this.keyRotationQuat.setFromEuler(this.tmpEuler);

    // Desired rotation blends base -> key with morph progress
    this.rotationTargetQuat.copy(this.baseRotationQuat).slerp(this.keyRotationQuat, this.morphSmoothed);

    // Smooth toward target to avoid micro jitter on key switches
    const rotLerp = 0.12;
    this.rotationSmoothedQuat.slerp(this.rotationTargetQuat, rotLerp);
    this.points.quaternion.copy(this.rotationSmoothedQuat);
  }

  private updateMorphPlacement(): void {
    if (!this.points || !this.camera || !this.renderer) return;

    const m = this.morphSmoothed;
    const activeId = this.activeMorphKeyId;
    const activeKey = activeId ? (this.morphKeys || []).find((k) => k.id === activeId) : undefined;

    const isMobile = this.isMobileLayout();
    const kOff = (key?: MorphKey | null): Vec3 => {
      const base = key?.placeOffset ?? { x: 0, y: 0, z: 0 };
      const bp = isMobile ? (key?.placeOffsetMobile ?? { x: 0, y: 0, z: 0 }) : (key?.placeOffsetDesktop ?? { x: 0, y: 0, z: 0 });
      return { x: base.x + bp.x, y: base.y + bp.y, z: base.z + bp.z };
    };

    // Default: hero resting position (no active morph) or models without targetSelector
    if (!activeKey || !activeKey.targetSelector || m <= 0.00001) {
      const baseOffset = this.getHeroRestOffset();
      const o = kOff(activeKey);
      const oy = o.y + (activeKey?.offsetY ?? 0);
      this.morphPlaceTarget.set(baseOffset.x + o.x, baseOffset.y + oy, baseOffset.z + o.z);
      // Ultra-smooth lerp back to center (no sudden jumps)
      const returnLerp = 0.06;
      this.morphPlaceSmoothed.lerp(this.morphPlaceTarget, returnLerp);
      if (this.morphPlaceSmoothed.lengthSq() < 1e-6) {
        this.morphPlaceSmoothed.copy(this.morphPlaceTarget);
      }
      this.points.position.copy(this.morphPlaceSmoothed);
      return;
    }

    // Cache the target element lookup per active morph id (cheap + robust).
    if (!this.morphTargetEl || this.morphTargetElKey !== activeId) {
      this.morphTargetEl = document.querySelector(activeKey.targetSelector) as HTMLElement | null;
      this.morphTargetElKey = activeId;
      // Invalidate cached rects when switching targets.
      this.cachedTargetRect = null;
      this.cachedCanvasRect = null;
      this.lastTargetRectMs = 0;
    }
    // If the element is not found yet (late render), retry gently.
    if (!this.morphTargetEl) {
      this.morphTargetEl = document.querySelector(activeKey.targetSelector) as HTMLElement | null;
    }

    if (!this.morphTargetEl) {
      this.morphPlaceTarget.copy(this.getHeroRestOffset());
      this.morphPlaceTarget.copy(this.getHeroRestOffset());
      const returnLerp = 0.04;
      this.morphPlaceSmoothed.lerp(this.morphPlaceTarget, returnLerp);
      this.points.position.copy(this.morphPlaceSmoothed);
      return;
    }

    // Avoid forcing layout every single RAF: cache rects ~30fps (more than enough for smooth placement).
    const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (nowMs - this.lastTargetRectMs > 33 || !this.cachedTargetRect || !this.cachedCanvasRect) {
      this.cachedCanvasRect = this.renderer.domElement.getBoundingClientRect();
      this.cachedTargetRect = this.morphTargetEl.getBoundingClientRect();
      this.lastTargetRectMs = nowMs;
    }
    const canvasRect = this.cachedCanvasRect!;
    const r = this.cachedTargetRect!;
    const vh = Math.max(1, window.innerHeight);
    const vw = Math.max(1, window.innerWidth);

    // Target point: center of the element
    const cx = r.left + r.width * 0.5;
    const cy = r.top + r.height * 0.5;

    // ============================================================
    // ULTRA-PROGRESSIVE PLACEMENT: Synchronized with morph progress
    // ============================================================
    // The key insight: placement should FOLLOW the morph progress (m) smoothly,
    // not race ahead or lag behind. This creates a perfectly synchronized motion
    // that accompanies the morph from start to finish.

    // Size check: only place if element is reasonably sized (avoid tiny/hidden elements)
    const sizeOk = r.width > 8 && r.height > 8;

    // ============================================================
    // PERFECT SYNCHRONIZATION: Placement directly follows morph progress
    // ============================================================
    // Since morph is now driven by target position, placement can directly use morph progress (m)
    // This ensures perfect synchronization: morph and placement finish together at the final position
    
    // Use morph progress directly for placement weight
    // This ensures placement accompanies morph perfectly from start to finish
    // Use morph progress as-is for perfect linear synchronization (no extra easing needed)
    let placeWeight = sizeOk ? m : 0;
    
    // Ultra-linear placement: use morph progress directly for perfect synchronization
    // The morph lerp already provides smoothness, so we keep placement linear
    const easedWeight = placeWeight;

    // Convert to canvas local coords
    const x = cx - canvasRect.left;
    const y = cy - canvasRect.top;

    const w = Math.max(1, canvasRect.width);
    const h = Math.max(1, canvasRect.height);
    // Clamp NDC to avoid extreme rays if the element is partially off-canvas
    const ndcX = Math.max(-1, Math.min(1, (x / w) * 2 - 1));
    const ndcY = Math.max(-1, Math.min(1, -((y / h) * 2 - 1)));

    // Build ray from camera through that screen point
    this.tmpNdc.set(ndcX, ndcY, 0.5).unproject(this.camera);
    this.morphRay.ray.origin.copy(this.camera.position);
    this.morphRay.ray.direction.copy(this.tmpNdc.sub(this.camera.position).normalize());

    // Placement plane: camera-facing plane (robust, works in all cases)
    if (typeof activeKey.targetPlaneZ === 'number') {
      const z = activeKey.targetPlaneZ;
      this.morphPlacePlane.set(new THREE.Vector3(0, 0, 1), -z);
    } else {
      this.camera.getWorldDirection(this.tmpCamDir);
      this.morphPlacePlane.setFromNormalAndCoplanarPoint(this.tmpCamDir, new THREE.Vector3(0, 0, 0));
    }

    const hit = this.morphRay.ray.intersectPlane(this.morphPlacePlane, this.tmpWorld);
    if (hit) {
      // Apply eased placement weight progressively (ultra-smooth, no sudden jumps)
      this.morphPlaceTarget.copy(this.tmpWorld).multiplyScalar(easedWeight);

      // SSOT per-key placement offset (scaled with morph progress to avoid snapping)
      const o = kOff(activeKey);
      const ox = o.x;
      const oy = o.y + (activeKey.offsetY ?? 0);
      const oz = o.z;
      if (ox !== 0 || oy !== 0 || oz !== 0) {
        this.morphPlaceTarget.x += ox * easedWeight;
        this.morphPlaceTarget.y += oy * easedWeight;
        this.morphPlaceTarget.z += oz * easedWeight;
      }
    } else {
      this.morphPlaceTarget.set(0, 0, 0);
    }

    // ============================================================
    // OPTIMIZED PLACEMENT LERP: Perfectly synchronized with morph
    // ============================================================
    // The placement lerp is perfectly synchronized with morph progress
    // Creates flawlessly smooth motion that accompanies the morph perfectly
    const currentDist = this.morphPlaceSmoothed.lengthSq();
    const targetDist = this.morphPlaceTarget.lengthSq();
    const isMovingToward = targetDist > currentDist;
    
    // OPTIMIZED ADAPTIVE LERP: Balanced smoothness and responsiveness
    let baseLerp = isMovingToward ? 0.05 : 0.06; // More reactive placement
    
    if (isMovingToward && m > 0.05) {
      // Smooth deceleration synchronized with morph progress
      // Use quadratic curve for optimal balance
      const morphFactor = 1.0 - (m * m); // Quadratic slowdown
      baseLerp = 0.065 * (0.55 + morphFactor * 0.45); // Range: ~0.036 to 0.065 (more reactive)
      
      // Additional smooth slowdown when very close for perfect finish
      if (targetDist > 0.0001) {
        const placementProgress = Math.min(1, Math.sqrt(currentDist / targetDist));
        if (placementProgress > 0.75) {
          const closeFactor = (placementProgress - 0.75) / 0.25; // 0 to 1 in last 25%
          const closeSlowdown = 0.5 + closeFactor * 0.5; // 50% to 100% of base lerp
          baseLerp *= closeSlowdown;
        }
      }
    }
    
    const placeLerp = baseLerp;

    this.morphPlaceSmoothed.lerp(this.morphPlaceTarget, placeLerp);

    // Snap to zero when very close (avoid micro-jitter)
    if (this.morphPlaceTarget.lengthSq() < 1e-8 && this.morphPlaceSmoothed.lengthSq() < 1e-6) {
      this.morphPlaceSmoothed.set(0, 0, 0);
    }

    this.points.position.copy(this.morphPlaceSmoothed);
  }

  private stop(): void {
    if (this.raf !== null) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
    }
  }

  private buildPointCloud(root: THREE.Object3D): { points: THREE.Points; bounds: THREE.Box3 } {
    root.updateWorldMatrix(true, true);

    const dpr = window.devicePixelRatio || 1;
    const cores = (navigator as any).hardwareConcurrency || 4;
    const isSmall = window.innerWidth < 768;
    const autoCap =
      isSmall || dpr > 1.5
        ? 80000
        : cores <= 4
          ? 120000
          : 150000;
    // Increased minimum for better silhouette definition during morph
    const targetCount = Math.max(20000, Math.min(this.maxPoints, autoCap));

    // Sample points ON SURFACE (crisper silhouette than vertex skipping)
    const { positions: worldPositions, bounds } = this.sampleSurfacePositions(root, targetCount, this.SAMPLE_SEED);
    const positions = new Float32Array(worldPositions.length);
    positions.set(worldPositions);
    const seeds = new Float32Array(targetCount);
    const rands = new Float32Array(targetCount * 3);

    const rand01 = (n: number): number => {
      const x = (Math.imul(n ^ 0x9e3779b9, 1664525) + 1013904223) >>> 0;
      return (x & 0x00ffffff) / 0x01000000;
    };

    for (let i = 0; i < targetCount; i++) {
      const k = i * 3;
      const s = rand01(i + 1);
      seeds[i] = s;
      rands[k] = rand01(i + 11) * 2 - 1;
      rands[k + 1] = rand01(i + 101) * 2 - 1;
      rands[k + 2] = rand01(i + 1009) * 2 - 1;
    }

    const center = bounds.getCenter(new THREE.Vector3());
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] -= center.x;
      positions[i + 1] -= center.y;
      positions[i + 2] -= center.z;
    }
    bounds.translate(center.multiplyScalar(-1));

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    geom.setAttribute('aRand', new THREE.BufferAttribute(rands, 3));
    geom.computeBoundingSphere();
    geom.computeBoundingBox();

    const boundingSphere = geom.boundingSphere;
    const modelRadius = boundingSphere ? boundingSphere.radius : 1.0;
    this.basePointCount = targetCount;
    this.baseRadius = modelRadius;

    // Base positions (kept for smooth return / target blending)
    this.basePositions = new Float32Array(positions.length);
    this.basePositions.set(positions);

    // Morph target blending:
    // - aMorphFrom: previous target shape (or base)
    // - aMorphTo: next target shape (or base)
    const morphFrom = new Float32Array(positions.length);
    const morphTo = new Float32Array(positions.length);
    morphFrom.set(positions);
    morphTo.set(positions);
    geom.setAttribute('aMorphFrom', new THREE.BufferAttribute(morphFrom, 3));
    geom.setAttribute('aMorphTo', new THREE.BufferAttribute(morphTo, 3));
    this.morphAttrFrom = geom.getAttribute('aMorphFrom') as THREE.BufferAttribute;
    this.morphAttrTo = geom.getAttribute('aMorphTo') as THREE.BufferAttribute;

    const uniforms = {
      uColor: { value: new THREE.Color(0xcfeeff) }, // Fallback visible
      uColor2: { value: new THREE.Color(0x3b82f6) }, // Fallback visible
      uColor3: { value: new THREE.Color(0x8b5cf6) }, // Fallback visible
      uOpacity: { value: this.opacity },
      uSize: { value: this.pointSize * this.GLOBAL_POINT_SIZE_MULT },
      uTightness: { value: this.GLOBAL_SHAPE_TIGHTNESS },
      uTime: { value: 2.5 }, // Start with non-zero time so resonance wave is already in motion
      uLoadProgress: { value: 0.0 },
      uEntryProgress: { value: this.entryAnimation ? 0.0 : 1.0 },
      uEntryRadius: { value: modelRadius * 3.5 },
      uOrganic: { value: 1.0 },
      uOrganicStrength: { value: this.organicStrength },
      uOrganicSpeed: { value: this.organicSpeed },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uMouseStrength: { value: this.mouseStrength },
      uMouseVel: { value: new THREE.Vector2(0, 0) },
      uMouseSpeed: { value: 0.0 },
      uRadius: { value: modelRadius },
      uScrollY: { value: 0.0 },
      uMorph: { value: 0.0 },
      // Smoothly blend morph targets when switching between models (prevents pop)
      uMorphTargetMix: { value: 1.0 },
      // Hero-like breakup/reform during morph (scroll-driven)
      uBreakStrength: { value: 0.0 },
      // ---------------------------------------------------------
      // Hero pulse resonance (default): center-out traveling wave with visible displacement
      // GPU-only (no per-particle CPU work) — ultra cheap.
      // Immediate response when wave arrives - no delay.
      // ---------------------------------------------------------
      uResonanceStrength: { value: 0.45 }, // master displacement amount (0..1+) - subtle
      uResonanceSpeed: { value: 0.28 }, // cycles/sec (wave travel speed)
      uResonanceWidth: { value: 0.085 }, // wavefront thickness (normalized by radius) - tighter for instant pulse
      uResonanceDecay: { value: 4.5 }, // trailing decay rate after the wave hits
    };

    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        attribute float aSeed;
        attribute vec3 aRand;
        attribute vec3 aMorphFrom;
        attribute vec3 aMorphTo;

        uniform float uSize;
        uniform float uTightness;
        uniform float uTime;
        uniform float uEntryProgress;
        uniform float uEntryRadius;
        uniform float uOrganic;
        uniform float uOrganicStrength;
        uniform float uOrganicSpeed;
        uniform vec2 uMouse;
        uniform float uMouseStrength;
        uniform vec2 uMouseVel;
        uniform float uMouseSpeed;
        uniform float uRadius;
        uniform float uScrollY;
        uniform float uMorph;
        uniform float uMorphTargetMix;
        uniform float uBreakStrength;
        uniform float uResonanceStrength;
        uniform float uResonanceSpeed;
        uniform float uResonanceWidth;
        uniform float uResonanceDecay;

        varying float vSeed;
        varying float vSpark;
        varying float vMouseProximity;
        varying float vDepth;
        varying float vMotion;
        varying float vScrollFade;
        varying float vTwinkle;
        varying float vRadialDist;
        varying float vPulse;
        varying float vResonance;

        void main() {
          vec3 pos = position;
          vSeed = aSeed;
          float t = uTime * uOrganicSpeed;
          float r = max(uRadius, 0.0001);

          // ---------------------------------------------------------
          // MORPH (GLB-to-GLB): base model -> active morph target model
          // ---------------------------------------------------------
          float m = clamp(uMorph, 0.0, 1.0);
          vec3 morphTarget = mix(aMorphFrom, aMorphTo, clamp(uMorphTargetMix, 0.0, 1.0));
          pos = mix(position, morphTarget, m);

          // ---------------------------------------------------------
          // BREAKUP -> REFORM (Hero-like): désagrège puis reforme
          // ---------------------------------------------------------
          // Purely driven by morph progress (scroll-driven), not time-based.
          // Peak at mid-morph; zero near 0 and 1.
          float breakT = 4.0 * m * (1.0 - m);          // peak at 0.5
          breakT = pow(clamp(breakT, 0.0, 1.0), 0.85); // slightly wider peak
          breakT *= smoothstep(0.04, 0.12, m);
          breakT *= smoothstep(0.04, 0.12, 1.0 - m);

          // Deterministic directions per particle
          vec3 rndDir = normalize(aRand * 2.0 - 1.0 + vec3(0.0001));
          vec3 swirlAxis = normalize(vec3(0.25, 1.0, 0.15));
          vec3 swirlDir = normalize(cross(swirlAxis, rndDir) + vec3(0.0001));
          float swirlPhase = sin(t * 0.9 + aSeed * 12.73);

          // Strong enough to be visible, but still premium (not “exploding”)
          float shatter = r * (0.78 * uBreakStrength) * breakT;
          float swirl = r * (0.26 * uBreakStrength) * breakT * swirlPhase;

          pos += rndDir * shatter;
          pos += swirlDir * swirl;
          
          // PROGRESSIVE DAMPING: Aggressive early damping for crisp silhouette definition
          // Use an aggressive easing curve so damping kicks in early (shape becomes defined quickly)
          // This ensures the morphed shape is crisp and well-defined from the start
          float mEased = m * m * (3.0 - 2.0 * m); // Smoothstep for smooth damping curve
          float mEasedAggressive = mEased * mEased; // Square for even more aggressive early damping
          
          // Ultra-strong progressive damping: starts early, becomes very strong
          // At 30% morph: ~70% damping (shape already well-defined)
          // At 50% morph: ~90% damping (shape very crisp)
          // At 100% morph: ~98% damping (perfect definition)
          float morphDamp = 1.0 - mEasedAggressive * 0.98;
          
          vec3 entryPos = pos;
          if (uEntryProgress < 1.0) {
            vec3 finalPos = pos;
            vec3 dirToFinal = normalize(finalPos + vec3(0.0001));
            float startRadius = uEntryRadius * (0.7 + 0.5 * aSeed);
            vec3 dispersionDir = normalize(dirToFinal + aRand * 0.4);
            vec3 startPos = dispersionDir * startRadius;
            float delay = aSeed * 0.4;
            float delayedProgress = clamp((uEntryProgress - delay) / (1.0 - delay), 0.0, 1.0);
            float eased = 1.0 - pow(1.0 - delayedProgress, 3.0);
            entryPos = mix(startPos, finalPos, eased);
          }
          
          pos = entryPos;

          // Effet scroll : ÉLÉGANT & INTÉGRÉ (mouvement fluide et harmonieux)
          float scrollFade = 1.0;
          
          if (uScrollY > 0.0) {
            float scrollAmount = uScrollY * morphDamp;
            float scrollT = clamp(scrollAmount / 2.0, 0.0, 1.0);
            scrollT = pow(scrollT, 1.2); // Courbe douce et élégante
            
            // Distance depuis le centre
            float distFromCenter = length(pos.xz);
            float normalizedDist = distFromCenter / r;
            
            // Sensibilité unique par particule (variation naturelle et subtile)
            float particleSensitivity = 0.25 + fract(aSeed * 7.3) * 0.4;
            float particlePhase = fract(aSeed * 11.7);
            
            // Position du centre
            vec3 centerPos = vec3(0.0, pos.y, 0.0);
            
            // Angle polaire pour rotation élégante
            float angle = atan(pos.z, pos.x);
            
            // PHASE 1 : ROTATION SPIRALE ÉLÉGANTE (mouvement fluide et subtil)
            float spiralTightness = 0.5 + normalizedDist * 0.3;
            float rotationSpeed = scrollAmount * 1.0 * particleSensitivity;
            float spiralRotation = rotationSpeed / (spiralTightness + 0.3);
            float newAngle = angle + spiralRotation;
            
            // PHASE 2 : EXPANSION RADIALE HARMONIEUSE (mouvement fluide)
            float expansionForce = scrollAmount * particleSensitivity * 0.7;
            float expansionIntensity = smoothstep(0.0, 1.5, normalizedDist);
            expansionIntensity = pow(expansionIntensity, 2.0); // Courbe douce
            float expansionSpeed = expansionForce * expansionIntensity * r * 0.5;
            
            // Nouvelle position radiale avec expansion harmonieuse
            float newDist = distFromCenter + expansionSpeed;
            
            // Application de la rotation spirale
            pos.x = centerPos.x + cos(newAngle) * newDist;
            pos.z = centerPos.z + sin(newAngle) * newDist;
            
            // PHASE 3 : DESCENTE GRAVITATIONNELLE FLUIDE (mouvement naturel)
            float yDist = pos.y;
            float downAttraction = smoothstep(-r * 0.7, r * 1.6, yDist);
            float downPull = scrollAmount * downAttraction * particleSensitivity * 0.2;
            float freeFall = smoothstep(r * 0.4, r * 1.4, yDist);
            downPull += freeFall * scrollAmount * particleSensitivity * 0.1;
            pos.y -= downPull * r * 0.3;
            
            // PHASE 4 : VAGUES ORGANIQUES (propagation douce et harmonieuse)
            // Vague principale (fluide)
            float waveSpeed1 = scrollAmount * 2.0;
            float wavePhase1 = waveSpeed1 - normalizedDist * 2.0;
            float wave1 = sin(wavePhase1) * 0.5 + 0.5;
            wave1 = smoothstep(0.2, 0.8, wave1);
            wave1 = pow(wave1, 1.4);
            
            // Vague secondaire (lente, décalée)
            float waveSpeed2 = scrollAmount * 1.3;
            float wavePhase2 = waveSpeed2 - normalizedDist * 1.2 + particlePhase;
            float wave2 = sin(wavePhase2) * 0.5 + 0.5;
            wave2 = smoothstep(0.25, 0.75, wave2);
            wave2 = pow(wave2, 1.6);
            
            // Combinaison harmonieuse des vagues
            float waveIntensity = (wave1 * 0.6 + wave2 * 0.4);
            
            // Mouvement radial harmonieux avec les vagues
            vec3 radialDir = normalize(vec3(pos.x, 0.0, pos.z) + vec3(0.0001));
            float waveBoost = waveIntensity * scrollAmount * particleSensitivity * 0.4;
            pos += radialDir * waveBoost * r;
            
            // PHASE 5 : VORTEX ÉLÉGANT (rotation subtile)
            float vortexStrength = scrollAmount * expansionIntensity * 0.3;
            vec3 toCenterNew = pos - centerPos;
            float cosVortex = cos(vortexStrength);
            float sinVortex = sin(vortexStrength);
            vec3 rotated = vec3(
              toCenterNew.x * cosVortex - toCenterNew.z * sinVortex,
              toCenterNew.y,
              toCenterNew.x * sinVortex + toCenterNew.z * cosVortex
            );
            pos = centerPos + rotated;

            // PHASE 6 : EFFET DE PROFONDEUR 3D SUBTIL (push/pull élégant)
            float depthJitter = (fract(aSeed * 9.7) - 0.5);
            vec3 nrmScroll = normalize(pos + vec3(0.0001));
            float depthEffect = scrollT * r * 0.03 * depthJitter;
            pos += nrmScroll * depthEffect;
            
            // PHASE 7 : MOUVEMENT HORIZONTAL SUBTIL (effet de "vent" élégant)
            float windPhase = scrollAmount * 0.5 + particlePhase * 6.28;
            float windStrength = sin(windPhase) * 0.5 + 0.5;
            windStrength = pow(windStrength, 2.2);
            vec3 windDir = normalize(vec3(cos(angle + 1.57), 0.0, sin(angle + 1.57)));
            pos += windDir * windStrength * scrollAmount * particleSensitivity * r * 0.12;
            
            // CALCUL DU FADE OUT PREMIUM ET FLUIDE
            // 1. Fade progressif basé sur le scroll (disparaît progressivement)
            float scrollFadeAmount = smoothstep(0.0, 2.5, scrollAmount);
            scrollFadeAmount = pow(scrollFadeAmount, 0.7); // Courbe douce
            
            // 2. Fade radial : disparaît en s'éloignant du centre (élégant)
            float fadeStartDist = r * 0.6;
            float fadeEndDist = r * 3.2;
            float fadeDist = smoothstep(fadeEndDist, fadeStartDist, distFromCenter);
            
            // 3. Fade vertical : disparaît vers le bas (fluide)
            float bottomThreshold = -r * 1.0;
            float fadeStartY = bottomThreshold + r * 1.8;
            float fadeY = smoothstep(bottomThreshold, fadeStartY, pos.y);
            
            // 4. Fade combiné : distance + position Y
            scrollFade = min(fadeY, fadeDist);
            
            // 5. Appliquer le fade progressif du scroll
            scrollFade *= (1.0 - scrollFadeAmount * 0.75); // Disparaît jusqu'à 75%
            
            // 6. Boost de fade avec les vagues (effet de dissolution progressive)
            scrollFade *= (1.0 - waveIntensity * 0.25);
            
            // 7. Fade supplémentaire pour les particules très éloignées
            float farFade = smoothstep(r * 2.5, r * 4.0, distFromCenter);
            scrollFade *= (1.0 - farFade * 0.4);
            
            // 8. Courbe finale ultra-douce et fluide
            scrollFade = pow(max(scrollFade, 0.0), 0.7); // Courbe douce
            scrollFade = clamp(scrollFade, 0.0, 1.0);
          }
          
          // Passer le fade au fragment shader
          vScrollFade = scrollFade;

          float particleSensitivity = 0.45 + 0.55 * fract(aSeed * 7.13);
          float neural = 0.0;
          float organicMultiplier = mix(0.0, 1.0, smoothstep(0.7, 1.0, uEntryProgress));

          if (uOrganic > 0.5 && uEntryProgress > 0.7) {
            float h = aSeed;
            vec3 rnd = aRand;
            float particleTime = t + h * 12.0;
            float slowBreath = particleTime * 0.5;
            float mediumFlow = particleTime * 1.0;
            float fastJitter = particleTime * 2.0;
            float nd = clamp(length(pos) / r, 0.0, 1.0);
            float centerFalloff = 1.0 - nd;
            centerFalloff = centerFalloff * centerFalloff;
            
            // DAMPING (Hero-consistent): keep silhouette crisp only during mid-morph.
            // We allow full organic motion at the start/end (like Hero),
            // and damp mainly near m≈0.5 where the shape is most fragile.
            float midMorph = 4.0 * m * (1.0 - m);              // peak at 0.5
            midMorph = pow(clamp(midMorph, 0.0, 1.0), 0.9);
            float organicDamp = mix(1.0, 0.12, midMorph);
            float amp = uOrganicStrength * r * 3.5 * organicMultiplier * organicDamp;
            amp *= uTightness;

            vec3 nrm = normalize(pos + vec3(0.0001));
            vec3 centerDir = normalize(pos + vec3(0.0001));

            float explosionPhase = sin(slowBreath * 0.8 + h * 6.283) * 0.5 + 0.5;
            float explosionStrength = smoothstep(0.3, 0.0, nd);
            pos += centerDir * (amp * 0.45 * explosionPhase * explosionStrength * (0.7 + 0.3 * h));

            vec3 up = vec3(0.0, 1.0, 0.0);
            vec3 tangent = normalize(cross(nrm, up) + vec3(0.0001));
            vec3 bitangent = cross(nrm, tangent);
            
            float vortexSpeed = 0.8 + h * 1.2;
            float vortexPhase = mediumFlow * vortexSpeed + dot(pos, vec3(0.1, 0.15, 0.12)) * 3.0;
            float vortexStrength = smoothstep(0.5, 0.0, nd);
            vec3 vortexDir = tangent * sin(vortexPhase) + bitangent * cos(vortexPhase * 1.1);
            pos += vortexDir * (amp * 0.42 * vortexStrength * centerFalloff);

            float radialPhase = sin(mediumFlow * (0.7 + 0.5 * h) + h * 6.283);
            float radialStrength = smoothstep(0.4, 0.0, nd);
            pos += centerDir * (amp * 0.35 * radialPhase * radialStrength * (0.6 + 0.4 * h));

            vec3 rotAxis = normalize(rnd * 2.0 - 1.0);
            float rotSpeed = 0.7 + h * 1.0;
            float rotAngle = mediumFlow * rotSpeed;
            vec3 rotOffset = cross(rotAxis, pos) * sin(rotAngle + h * 6.283);
            pos += rotOffset * (amp * 0.32 * centerFalloff);

            vec3 jitter = vec3(
              sin(fastJitter * (1.1 + h * 0.55) + rnd.x * 6.283),
              sin(fastJitter * (1.2 + h * 0.65) + rnd.y * 6.283),
              sin(fastJitter * (1.0 + h * 0.45) + rnd.z * 6.283)
            );
            pos += normalize(jitter + vec3(0.0001)) * (amp * 0.12 * (0.3 + 0.7 * h) * centerFalloff);

            // ---------------------------------------------------------
            // NEURAL FIELD (synapses): organic "brain-like" pulses
            // ---------------------------------------------------------
            // A few moving attractors create subtle, neural-looking micro flows.
            vec3 nodeA = r * 0.35 * vec3(sin(t * 0.55), cos(t * 0.62), sin(t * 0.48));
            vec3 nodeB = r * 0.40 * vec3(cos(t * 0.46 + 1.7), sin(t * 0.58 + 0.9), cos(t * 0.51 + 2.4));
            vec3 nodeC = r * 0.30 * vec3(sin(t * 0.73 + 2.1), sin(t * 0.41 + 1.3), cos(t * 0.66 + 0.4));

            float dA = length(pos - nodeA);
            float dB = length(pos - nodeB);
            float dC = length(pos - nodeC);

            float iA = exp(-dA * dA * 2.2);
            float iB = exp(-dB * dB * 1.8);
            float iC = exp(-dC * dC * 2.6);

            float fire = sin(uTime * 1.7 + h * 18.0) * 0.5 + 0.5;
            fire = pow(fire, 2.4);
            neural = clamp((iA * 0.9 + iB * 0.7 + iC * 1.1) * fire, 0.0, 1.0);

            vec3 pullDir =
              normalize((nodeA - pos) * iA + (nodeB - pos) * iB + (nodeC - pos) * iC + vec3(0.0001));
            vec3 filament = normalize(cross(pullDir, nrm) + vec3(0.0001));

            // Soft attraction + filament swirl, damped during morph for silhouette stability
            pos += pullDir * (amp * 0.18 * neural);
            pos += filament * (amp * 0.10 * neural) * sin(uTime * 0.9 + h * 9.2);
          }

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          vec4 clip0 = projectionMatrix * mvPosition;
          vec2 ndc = clip0.xy / max(0.0001, clip0.w);
          
          // Ignore mouse effect if mouse is outside valid NDC range (-1 to 1)
          // This prevents initial "focus" effect when mouse hasn't moved yet
          float mouseInRange = step(abs(uMouse.x), 1.5) * step(abs(uMouse.y), 1.5);
          
          vec2 deltaNdc = uMouse - ndc;
          float distNdc = length(deltaNdc);

          float influenceNdc = 0.62;
          float prox = smoothstep(influenceNdc, 0.14, distNdc);
          prox = pow(prox, 1.25);
          prox *= mouseInRange; // Zero out if mouse is outside valid range
          
          // Mouse damping: same idea as organic.
          // Keep strong hover at the start/end (Hero-like), damp in the middle of morph.
          float midMorph2 = 4.0 * m * (1.0 - m);
          midMorph2 = pow(clamp(midMorph2, 0.0, 1.0), 0.9);
          float mouseDamp = mix(1.0, 0.18, midMorph2);
          prox *= mouseDamp;
          
          vMouseProximity = prox;

          vDepth = -mvPosition.z;
          vMotion = prox * (0.65 + 0.45 * uMouseSpeed);

          // Calculer la distance radiale pour les effets (toujours disponible)
          float distFromCenter = length(pos.xz);
          float normalizedDist = distFromCenter / r;
          
          vSpark = 0.78 + 0.35 * sin(uTime * 1.15 + aSeed * 22.0);
          // Neural: small brightness boost on synapse pulses
          vSpark += neural * 0.22;
          float sparkMask = step(0.80, fract(aSeed * 13.37));
          vSpark += uMouseSpeed * 0.35 * sparkMask;
          vSpark += prox * 0.4 * (1.0 + uMouseSpeed * 0.45);
          vSpark = clamp(vSpark, 0.0, 1.6);
          
          // EFFET 1 : Scintillement/Twinkle (réduit au scroll pour isoler l'effet)
          float twinkleSpeed = 0.8 + fract(aSeed * 7.3) * 0.6;
          float twinklePhase = uTime * twinkleSpeed + aSeed * 15.7;
          vTwinkle = sin(twinklePhase) * 0.5 + 0.5;
          vTwinkle = pow(vTwinkle, 2.5);
          // Boost du twinkle près de la souris (seulement si pas de scroll)
          float scrollT = clamp(uScrollY / 1.5, 0.0, 1.0);
          float scrollInfluence = 1.0 - scrollT * 0.8; // Réduit le twinkle au scroll
          vTwinkle += prox * 0.4 * (1.0 + uMouseSpeed * 0.3) * scrollInfluence;
          vTwinkle = clamp(vTwinkle, 0.0, 1.5);
          
          // EFFET 2 : Distance radiale pour effets de couleur
          vRadialDist = normalizedDist;
          
          // EFFET 3 : Pulsation rythmique (réduite au scroll pour isoler l'effet)
          float pulseSpeed = 0.6 + fract(aSeed * 11.3) * 0.4;
          float pulsePhase = uTime * pulseSpeed + aSeed * 8.9;
          vPulse = sin(pulsePhase) * 0.5 + 0.5;
          vPulse = pow(vPulse, 1.8);
          // Réduire la pulsation au scroll pour isoler l'effet de scroll
          vPulse *= (1.0 - scrollT * 0.7);
          vPulse = clamp(vPulse, 0.0, 1.3);

          // ---------------------------------------------------------
          // HERO PULSE RESONANCE (default): natural, organic center-out wave
          // - More natural: per-particle phase variation prevents perfect sync
          // - Smoother curves: uses smoothstep for natural fade transitions
          // - Organic oscillation: multiple harmonics for richer wave feel
          // - Fluid domino trail: natural decay with gentle shimmer
          // ---------------------------------------------------------
          // Use 3D distance for resonance (more accurate radial effect from center)
          float distFromCenter3D = length(pos);
          float normalizedDist3D = clamp(distFromCenter3D / r, 0.0, 2.5);
          
          // Wave travels from center (0) outward, repeating every cycle
          // NO particle phase offset - all particles react instantly when wave arrives
          float wavePhase = mod(uTime * max(0.01, uResonanceSpeed), 1.5);
          float waveFront = wavePhase;
          
          // Distance from particle to wavefront (positive = wave hasn't reached yet, negative = wave passed)
          float distToFront = normalizedDist3D - waveFront;
          
          // Sharp envelope: immediate impact when wave arrives (gaussian for instant response)
          float w = max(0.006, uResonanceWidth * 0.75); // narrower for more immediate effect
          float envelope = exp(-pow(distToFront / w, 2.0));
          // Sharper peak for instant pulse
          envelope = pow(envelope, 1.8);
          
          // Direct oscillation: immediate response when wave arrives
          float rippleFreq = 15.0; // single frequency for instant, clear wave
          float ripple = sin(distToFront * rippleFreq - uTime * 3.5) * envelope;
          
          // Main wave kick: immediate radial push (no delay)
          float waveKick = envelope;
          
          // Domino trail: starts immediately after wave passes
          float hasPassed = step(0.0, -distToFront); // instant transition
          float trailDist = max(0.0, -distToFront); // distance behind the wavefront
          // Direct exponential decay (no extra fade delay)
          float trailDecay = exp(-trailDist * max(0.7, uResonanceDecay));
          
          // Simple domino shimmer: immediate response
          float domino = 0.5 + 0.5 * sin(trailDist * 7.5 + aSeed * 8.2 + uTime * 2.8);
          domino = pow(domino, 1.5);
          float trail = trailDecay * domino * hasPassed;
          
          // Combined resonance intensity (for size/brightness boost) - natural blend
          float resonance = (waveKick * 0.85 + trail * 0.35) * uResonanceStrength;
          resonance *= (1.0 - scrollT * 0.35); // Slight damp during scroll
          vResonance = clamp(resonance, 0.0, 1.15);
          
          // Physical displacement: natural, organic motion
          vec3 radialDir = normalize(pos + vec3(0.0001)); // direction from center to particle
          vec3 upRes = vec3(0.0, 1.0, 0.0);
          vec3 tanRes = normalize(cross(radialDir, upRes) + vec3(0.0001));
          vec3 bitanRes = cross(radialDir, tanRes);
          
          // Main displacement: immediate radial push + oscillation
          float displacementAmount = r * uResonanceStrength;
          // Direct blend: kick happens instantly, ripple adds wave motion
          pos += radialDir * displacementAmount * (0.040 * waveKick + 0.026 * ripple);
          
          // Domino swirl: immediate tangential motion after wave passes
          float resonanceSwirl = trail * (0.5 + 0.5 * sin(uTime * 5.5 + aSeed * 11.3));
          pos += tanRes * displacementAmount * 0.010 * resonanceSwirl;
          pos += bitanRes * displacementAmount * 0.007 * resonanceSwirl * (0.5 + 0.5 * sin(uTime * 6.2 + aSeed * 9.7));

          if (uMouseStrength > 0.0001 && mouseInRange > 0.5) {
            vec2 dir = distNdc > 0.0001 ? (deltaNdc / distNdc) : vec2(0.0);
            vec2 perp = vec2(-dir.y, dir.x);

            vec3 nrm2 = normalize(pos + vec3(0.0001));
            vec3 up2 = vec3(0.0, 1.0, 0.0);
            vec3 tangent2 = normalize(cross(nrm2, up2) + vec3(0.0001));
            vec3 bitangent2 = cross(nrm2, tangent2);

            float phase = sin(t * 0.6 + aSeed * 12.34) * 0.25 + 0.75;
            // PROGRESSIVE MOUSE STRENGTH DAMPING: Aggressive early damping for crisp definition
            // Use aggressive easing so mouse strength is damped early in the morph
            // Reuse mEasedAggressive from above for consistency
            // Keep hover strength at start/end; reduce mostly mid-morph.
            float midMorph3 = 4.0 * m * (1.0 - m);
            midMorph3 = pow(clamp(midMorph3, 0.0, 1.0), 0.9);
            float strength = uMouseStrength * r * 0.52 * mix(1.0, 0.28, midMorph3);
            float cleanProx = prox * prox;
            float amt = strength * cleanProx * particleSensitivity * phase;
            amt *= uTightness;

            pos += tangent2 * (dir.x * amt * (0.8 + 0.2 * sin(t * 0.9 + aSeed * 9.1)));
            pos += bitangent2 * (dir.y * amt * (0.8 + 0.2 * cos(t * 1.0 + aSeed * 8.3)));

            float vortexPhase = t * (0.8 + 0.6 * fract(aSeed * 5.67)) + aSeed * 6.283;
            float vortexStrength = sin(vortexPhase) * 0.5 + 0.5;
            float vortexAmt = amt * 0.48 * vortexStrength;
            pos += tangent2 * (perp.x * vortexAmt);
            pos += bitangent2 * (perp.y * vortexAmt);

            float explosionPhase = sin(t * 0.7 + aSeed * 10.5) * 0.5 + 0.5;
            float explosionAmt = amt * 0.25 * explosionPhase * (1.0 - cleanProx);
            pos += tangent2 * (dir.x * explosionAmt);
            pos += bitangent2 * (dir.y * explosionAmt);

            mvPosition = modelViewMatrix * vec4(pos, 1.0);
          }
          
          float depthFactor = smoothstep(5.0, 1.0, -mvPosition.z);
          float depthSizeBoost = 1.0 + depthFactor * 0.15;
          float pulse = 0.85 + 0.4 * vSpark;
          pulse *= depthSizeBoost;
          float baseSize = uSize * pulse * (300.0 / -mvPosition.z);
          
          // Retrecir les particules au scroll + renforcer la profondeur PREMIUM
          // Sophisticated shrink effect with multiple phases
          float scrollTSize = clamp(uScrollY / 1.5, 0.0, 1.0);
          float scrollTSize2 = scrollTSize * scrollTSize; // Courbe accélérée
          scrollTSize = mix(scrollTSize, scrollTSize2, 0.4); // Mix pour transition fluide
          
          // Phase 1 : Réduction globale progressive
          float sizeScroll = mix(1.0, 0.55, scrollTSize);
          
          // Phase 2 : Réduction basée sur la profondeur (particules lointaines)
          float far = smoothstep(1.8, 11.0, vDepth);
          float sizeDepth = mix(1.0, 0.7, far * scrollTSize);
          
          // Phase 3 : Réduction basée sur la distance radiale (particules extérieures)
          float radialDist = length(gl_Position.xy / gl_Position.w);
          float radialFade = smoothstep(0.3, 1.2, radialDist);
          float sizeRadial = mix(1.0, 0.8, radialFade * scrollTSize);
          
          // Combinaison des effets de réduction
          baseSize *= sizeScroll * sizeDepth * sizeRadial;

          // Resonance: subtle and elegant (size kick travels from center).
          baseSize *= (1.0 + vResonance * 0.28);

          // Clamp to avoid huge points close to camera.
          // Keep a visible minimum so the model silhouette stays clearly readable.
          baseSize = clamp(baseSize, 0.38, 64.0);

          gl_PointSize = baseSize;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform vec3 uColor2;
        uniform vec3 uColor3;
        uniform float uOpacity;
        uniform vec2 uMouse;
        uniform float uRadius;
        uniform float uMouseSpeed;
        uniform float uTime;
        uniform float uLoadProgress;
        uniform float uScrollY;
        varying float vSeed;
        varying float vSpark;
        varying float vMouseProximity;
        varying float vDepth;
        varying float vMotion;
        varying float vScrollFade;
        varying float vTwinkle;
        varying float vRadialDist;
        varying float vPulse;
        
        void main() {
          vec2 c = gl_PointCoord - vec2(0.5);
          float d = length(c);
          // Slightly richer point falloff: keeps silhouette clean but adds more perceived "energy"
          float edgeSoftness = 0.52;
          float edgeHardness = 0.22;
          float alpha = smoothstep(edgeSoftness, edgeHardness, d) * uOpacity;
          
          // INTENSITÉ DE BASE avec tous les effets (harmonieuse et équilibrée)
          float scrollInfluence = clamp(uScrollY / 2.0, 0.0, 1.0);
          scrollInfluence = pow(scrollInfluence, 1.2); // Courbe douce

          // Depth fade: far points become slightly less dominant → silhouette reads cleaner.
          // vDepth is positive; smaller = closer to camera.
          float depthFade = smoothstep(16.0, 1.8, vDepth);
          
          // Brighter baseline (less "dull"), still controlled by scroll + motion.
          float baseIntensity = 1.08 + 0.62 * vSpark;
          float depthIntensity = smoothstep(8.0, 1.2, vDepth);
          baseIntensity += depthIntensity * 0.24;
          
          // Harmoniser les effets de souris avec le scroll (transition douce)
          float mouseInfluence = 1.0 - scrollInfluence * 0.4; // Réduction plus subtile
          float accretionBoost = vMouseProximity * (1.0 + uMouseSpeed * 0.75) * mouseInfluence;
          baseIntensity += accretionBoost * 0.8;
          float motionGlow = vMotion * 0.42 * mouseInfluence;
          baseIntensity += motionGlow;
          
          // EFFET 1 : Scintillement/Twinkle (harmonisé avec le scroll)
          baseIntensity += vTwinkle * 0.45 * (1.0 - scrollInfluence * 0.4);
          
          // EFFET 2 : Pulsation rythmique (harmonisée avec le scroll)
          baseIntensity += vPulse * 0.32 * (1.0 - scrollInfluence * 0.4);
          
          // EFFET SCROLL : Boost de brillance subtil et élégant au scroll
          float scrollGlow = scrollInfluence * 0.45;
          baseIntensity += scrollGlow;
          
          // Allow more headroom before clamping (keeps "pop" without blowing out)
          alpha *= clamp(baseIntensity, 0.0, 2.85);
          // Appliquer le fade out du scroll
          alpha *= vScrollFade;
          // Keep far particles just a bit softer (do NOT kill visibility).
          alpha *= mix(0.9, 1.0, depthFade);
          
          // COULEUR DE BASE (multi-palette)
          vec3 colA = uColor;
          vec3 colB = uColor2;
          vec3 colC = uColor3;

          float seed = fract(vSeed * 13.37);
          float wobble = 0.5 + 0.5 * sin(uTime * 0.55 + vSeed * 6.283);
          float blendAB = smoothstep(0.08, 0.92, seed);

          // Base mix: accent <-> secondary, with a subtle teal wobble
          vec3 baseCol = mix(colA, colB, blendAB);
          baseCol = mix(baseCol, colC, 0.10 + 0.18 * wobble);

          // More color towards edges + spark/twinkle (adds modern vivacity without becoming rainbow)
          float vib = clamp(0.22 + 0.28 * vSpark + 0.14 * vTwinkle + vRadialDist * 0.18, 0.0, 0.7);
          vec3 finalColor = mix(colA, baseCol, vib);
          
          // EFFET 3 : Saturation dynamique basée sur la profondeur
          float luminance = dot(finalColor, vec3(0.299, 0.587, 0.114));
          float saturationBoost = 1.15 + depthIntensity * 0.15;
          vec3 saturated = mix(vec3(luminance), finalColor, saturationBoost);
          finalColor = mix(finalColor, saturated, 0.6);
          
          // EFFET 4 : Highlight blanc près de la souris
          float colorShift = vMouseProximity * 0.18;
          vec3 highlightColor = vec3(1.0, 1.0, 1.0);
          finalColor = mix(finalColor, highlightColor, colorShift);
          
          // EFFET 5 : Tint chaud basé sur la profondeur
          float depthColorShift = smoothstep(8.0, 1.5, vDepth) * 0.12;
          vec3 richTint = vec3(1.08, 1.05, 1.02);
          finalColor = mix(finalColor, finalColor * richTint, depthColorShift);
          
          // EFFET 6 : Chromatic aberration près de la souris
          float chromaAmount = vMouseProximity * 0.045;
          vec3 chromaR = vec3(1.0 + chromaAmount * 1.2, 1.0, 1.0 - chromaAmount);
          vec3 chromaB = vec3(1.0 - chromaAmount, 1.0, 1.0 + chromaAmount * 1.2);
          finalColor.r *= chromaR.r;
          finalColor.b *= chromaB.b;
          
          // EFFET 7 : Gradient radial de couleur (bleu au centre, blanc à l'extérieur)
          float radialGradient = smoothstep(0.0, 1.5, vRadialDist);
          vec3 centerColor = mix(uColor2, vec3(1.0, 1.0, 1.0), 0.35); // Palette secondary → blanc
          vec3 outerColor = vec3(1.0, 1.0, 1.0); // Blanc à l'extérieur
          vec3 radialTint = mix(centerColor, outerColor, radialGradient);
          finalColor = mix(finalColor, finalColor * radialTint, 0.15);
          
          // EFFET 8 : Bloom/Halo externe (harmonisé avec le scroll)
          float bloomRadius = smoothstep(0.48, 0.10, d);
          float bloomIntensity = (vMouseProximity * 0.55 + vMotion * 0.35 + vSpark * 0.22 + vTwinkle * 0.28) * mouseInfluence;
          // Boost de bloom subtil et élégant au scroll
          bloomIntensity += scrollInfluence * 0.35;
          // Reduce bloom on far points a little to keep the silhouette crisp
          bloomIntensity *= mix(0.9, 1.0, depthFade);
          vec3 bloomColor = finalColor * bloomIntensity * bloomRadius;
          finalColor += bloomColor * 1.05;
          
          // EFFET 9 : Inner glow (harmonisé avec le scroll)
          float innerGlow = smoothstep(0.35, 0.0, d);
          float innerGlowIntensity = (0.4 + vTwinkle * 0.26 + vPulse * 0.18) * (1.0 - scrollInfluence * 0.25);
          // Boost d'inner glow subtil au scroll
          innerGlowIntensity += scrollInfluence * 0.28;
          finalColor += finalColor * innerGlow * innerGlowIntensity;
          
          // EFFET 10 : Corona effect (harmonisé avec le scroll)
          float corona = smoothstep(0.25, 0.1, d) * smoothstep(0.0, 0.15, d);
          float coronaIntensity = (vTwinkle * 0.3 + vMouseProximity * 0.2) * mouseInfluence;
          // Boost de corona subtil au scroll
          coronaIntensity += scrollInfluence * 0.2;
          vec3 coronaColor = vec3(1.0, 1.0, 1.0) * coronaIntensity;
          finalColor += coronaColor * corona * 0.4;
          
          // EFFET 11 : Traînée de mouvement (harmonisée avec le scroll)
          float trail = smoothstep(0.4, 0.2, d) * vMotion * mouseInfluence;
          vec3 trailColor = finalColor * trail * 0.3;
          finalColor += trailColor;
          
          // EFFET SCROLL ÉLÉGANT : Traînée de scroll subtile (effet de vitesse harmonieux)
          float scrollTrail = smoothstep(0.5, 0.25, d) * scrollInfluence;
          vec3 scrollTrailColor = vec3(0.85, 0.92, 1.0) * scrollTrail * scrollInfluence * 0.3;
          finalColor += scrollTrailColor;
          
          // EFFET 12 : Color shift basé sur le scroll (transition de couleur harmonieuse)
          float scrollColorShift = clamp(uScrollY / 2.5, 0.0, 1.0);
          scrollColorShift = pow(scrollColorShift, 1.3); // Courbe douce
          vec3 scrollTint = mix(vec3(1.0), vec3(0.92, 0.96, 1.0), scrollColorShift);
          finalColor *= scrollTint;
          
          // Tone mapping final (keep it bright, premium)
          finalColor = pow(finalColor, vec3(0.84));
          
          // Fade au chargement
          float loadFade = smoothstep(0.0, 1.0, uLoadProgress);
          alpha *= loadFade;
          
          if (alpha <= 0.005) discard;
          gl_FragColor = vec4(finalColor, clamp(alpha, 0.0, 1.0));
        }
      `,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      blending: this.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });

    const pts = new THREE.Points(geom, mat);
    const bs = geom.boundingSphere;
    if (bs) {
      (mat.uniforms as any).uRadius.value = Math.max(0.0001, bs.radius);
    }
    return { points: pts, bounds };
  }

  private ensureMorphTargetApplied(id: string): Promise<void> {
    if (!this.morphAttrFrom || !this.morphAttrTo || !this.basePositions) return Promise.resolve();
    const key = (this.morphKeys || []).find((k) => k.id === id);
    if (!key) return Promise.resolve();
    const cacheKey = this.getMorphCacheKey(id, key);

    const cached = this.morphPositionsById.get(cacheKey);
    if (cached) {
      this.applyMorphTargetSwap(cached, cacheKey);
      return Promise.resolve();
    }

    const inflight = this.morphLoadingById.get(cacheKey);
    if (inflight) {
      return inflight.then((arr) => this.applyMorphTargetSwap(arr, cacheKey));
    }

    const p = this.loadMorphPositionsForKey(key, this.basePointCount, this.baseRadius)
      .then((arr) => {
        this.morphPositionsById.set(cacheKey, arr);
        return arr;
      })
      .finally(() => {
        this.morphLoadingById.delete(cacheKey);
      });

    this.morphLoadingById.set(cacheKey, p);
    return p.then((arr) => this.applyMorphTargetSwap(arr, cacheKey));
  }

  private applyMorphTargetSwap(targetPositions: Float32Array, targetKey: string): void {
    if (!this.morphAttrFrom || !this.morphAttrTo || !this.basePositions) return;
    if (targetPositions.length !== this.morphAttrTo.array.length) return;

    // Avoid re-applying the same target (keeps blend stable)
    if (this.morphTargetKey === targetKey) return;

    // FROM = current "to" (current target), or base if unavailable
    const currentTo = this.morphAttrTo.array as Float32Array;
    (this.morphAttrFrom.array as Float32Array).set(currentTo.length ? currentTo : this.basePositions);
    this.morphAttrFrom.needsUpdate = true;

    // TO = new target
    (this.morphAttrTo.array as Float32Array).set(targetPositions);
    this.morphAttrTo.needsUpdate = true;

    // Restart target blend (prevents pops when switching models mid-scroll)
    this.morphTargetMixSmoothed = 0.0;
    this.morphTargetMixTarget = 1.0;
    this.morphTargetKey = targetKey;
  }

  private getMorphCacheKey(id: string, key: MorphKey): string {
    const base = `${id}@${(key.rotateX ?? 0).toFixed(5)}@${(key.rotateY ?? 0).toFixed(5)}@${(key.rotateZ ?? 0).toFixed(5)}`;
    if (id === 'events' && this.eventsHasUpcoming && this.eventsNextDateText) {
      // Include the date text so cache invalidates when the next event changes
      return `${base}@text:${this.eventsNextDateText}`;
    }
    return base;
  }

  private loadMorphPositionsForKey(key: MorphKey, count: number, targetRadius: number): Promise<Float32Array> {
    // Special case: Events = show next event date as particles when available
    if (key.id === 'events' && this.eventsHasUpcoming && this.eventsNextDateText) {
      return this.loadMorphTextPositions(
        this.eventsNextDateText,
        count,
        targetRadius,
        key.rotateY ?? 0,
        key.rotateX ?? 0,
        key.rotateZ ?? 0,
      );
    }
    return this.loadMorphModelPositions(
      key.modelPath,
      count,
      targetRadius,
      key.rotateY ?? 0,
      key.rotateX ?? 0,
      key.rotateZ ?? 0,
    );
  }

  private async loadMorphModelPositions(
    modelPath: string,
    count: number,
    targetRadius: number,
    rotateY: number = 0,
    rotateX: number = 0,
    rotateZ: number = 0,
  ): Promise<Float32Array> {
    const scene = await this.loadGltfScene(modelPath);
    const { positions, radius } = await this.extractCenteredPositionsAsync(scene, count);

    // Apply rotations to the sampled cloud (Y then X then Z)
    const eps = 0.00001;
    const cy = Math.cos(rotateY);
    const sy = Math.sin(rotateY);
    const cx = Math.cos(rotateX);
    const sx = Math.sin(rotateX);
    const cz = Math.cos(rotateZ);
    const sz = Math.sin(rotateZ);

    if (Math.abs(rotateY) > eps || Math.abs(rotateX) > eps || Math.abs(rotateZ) > eps) {
      for (let i = 0; i < positions.length; i += 3) {
        let x = positions[i];
        let y = positions[i + 1];
        let z = positions[i + 2];

        // Y
        if (Math.abs(rotateY) > eps) {
          const nx = x * cy - z * sy;
          const nz = x * sy + z * cy;
          x = nx;
          z = nz;
        }
        // X
        if (Math.abs(rotateX) > eps) {
          const ny = y * cx - z * sx;
          const nz = y * sx + z * cx;
          y = ny;
          z = nz;
        }
        // Z
        if (Math.abs(rotateZ) > eps) {
          const nx = x * cz - y * sz;
          const ny = x * sz + y * cz;
          x = nx;
          y = ny;
        }

        positions[i] = x;
        positions[i + 1] = y;
        positions[i + 2] = z;
      }
    }

    const scale = targetRadius / Math.max(0.0001, radius);
    for (let i = 0; i < positions.length; i++) positions[i] *= scale;
    return positions;
  }

  private loadMorphTextPositions(
    text: string,
    count: number,
    targetRadius: number,
    rotateY: number = 0,
    rotateX: number = 0,
    rotateZ: number = 0,
  ): Promise<Float32Array> {
    try {
      const positions = this.buildTextPositions(text, count);

      // Rotate (Y then X then Z) like model sampling
      const eps = 0.00001;
      const cy = Math.cos(rotateY);
      const sy = Math.sin(rotateY);
      const cx = Math.cos(rotateX);
      const sx = Math.sin(rotateX);
      const cz = Math.cos(rotateZ);
      const sz = Math.sin(rotateZ);

      if (Math.abs(rotateY) > eps || Math.abs(rotateX) > eps || Math.abs(rotateZ) > eps) {
        for (let i = 0; i < positions.length; i += 3) {
          let x = positions[i];
          let y = positions[i + 1];
          let z = positions[i + 2];

          if (Math.abs(rotateY) > eps) {
            const nx = x * cy - z * sy;
            const nz = x * sy + z * cy;
            x = nx;
            z = nz;
          }
          if (Math.abs(rotateX) > eps) {
            const ny = y * cx - z * sx;
            const nz = y * sx + z * cx;
            y = ny;
            z = nz;
          }
          if (Math.abs(rotateZ) > eps) {
            const nx = x * cz - y * sz;
            const ny = x * sz + y * cz;
            x = nx;
            y = ny;
          }

          positions[i] = x;
          positions[i + 1] = y;
          positions[i + 2] = z;
        }
      }

      // Scale to targetRadius
      let max = 0.0001;
      for (let i = 0; i < positions.length; i += 3) {
        max = Math.max(max, Math.abs(positions[i]), Math.abs(positions[i + 1]), Math.abs(positions[i + 2]));
      }
      const scale = targetRadius / Math.max(0.0001, max);
      for (let i = 0; i < positions.length; i++) positions[i] *= scale;

      return Promise.resolve(positions);
    } catch (e) {
      // Fallback: if canvas/text fails, keep app stable (use a tiny dot cloud)
      const fallback = new Float32Array(count * 3);
      for (let i = 0; i < fallback.length; i += 3) {
        fallback[i] = (Math.random() - 0.5) * targetRadius * 0.2;
        fallback[i + 1] = (Math.random() - 0.5) * targetRadius * 0.1;
        fallback[i + 2] = (Math.random() - 0.5) * targetRadius * 0.02;
      }
      return Promise.resolve(fallback);
    }
  }

  private buildTextPositions(text: string, count: number): Float32Array {
    if (typeof document === 'undefined') {
      throw new Error('No DOM for canvas');
    }

    const t = String(text || '').trim();
    if (!t) throw new Error('Empty text');

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2D context');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Premium uppercase date look
    const fontSize = 150;
    ctx.font = `800 ${fontSize}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white';

    // Slight letter spacing effect: draw per-char
    const chars = t.split('');
    const letterSpacing = 4;
    const metrics = ctx.measureText(t);
    const totalW = metrics.width + letterSpacing * Math.max(0, chars.length - 1);
    let x = canvas.width / 2 - totalW / 2;
    const y = canvas.height / 2;
    for (const ch of chars) {
      const w = ctx.measureText(ch).width;
      ctx.fillText(ch, x + w / 2, y);
      x += w + letterSpacing;
    }

    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pts: Array<{ x: number; y: number }> = [];
    const step = 2;
    for (let yy = 0; yy < canvas.height; yy += step) {
      for (let xx = 0; xx < canvas.width; xx += step) {
        const idx = (yy * canvas.width + xx) * 4;
        const r = img.data[idx];
        if (r > 40) {
          // normalize to [-1..1]
          const nx = (xx / canvas.width) * 2 - 1;
          const ny = -((yy / canvas.height) * 2 - 1);
          pts.push({ x: nx, y: ny });
        }
      }
    }
    if (pts.length < 50) throw new Error('Too few pixels for text');

    const out = new Float32Array(count * 3);
    for (let i = 0; i < out.length; i += 3) {
      const p = pts[(Math.random() * pts.length) | 0];
      out[i] = p.x;
      out[i + 1] = p.y;
      out[i + 2] = (Math.random() - 0.5) * 0.03; // tiny depth for nicer silhouette
    }
    return out;
  }

  private extractCenteredPositions(root: THREE.Object3D, desiredCount: number): { positions: Float32Array; radius: number } {
    root.updateWorldMatrix(true, true);
    const { positions: worldPositions, bounds } = this.sampleSurfacePositions(root, desiredCount, this.SAMPLE_SEED);
    const positions = new Float32Array(worldPositions.length);
    positions.set(worldPositions);

    const center = bounds.getCenter(new THREE.Vector3());
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] -= center.x;
      positions[i + 1] -= center.y;
      positions[i + 2] -= center.z;
    }

    // Radius from the actual sampled cloud (stable + matches what we render)
    const tmp = new THREE.BufferGeometry();
    tmp.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    tmp.computeBoundingSphere();
    const radius = Math.max(0.0001, tmp.boundingSphere?.radius ?? 1.0);
    tmp.dispose();

    return { positions, radius };
  }

  private nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }

  /**
   * Async/time-sliced variant used for morph targets.
   * Avoids long main-thread stalls when sampling 80k–150k particles.
   */
  private async extractCenteredPositionsAsync(
    root: THREE.Object3D,
    desiredCount: number,
  ): Promise<{ positions: Float32Array; radius: number }> {
    root.updateWorldMatrix(true, true);
    const { positions: worldPositions, bounds } = await this.sampleSurfacePositionsAsync(root, desiredCount);
    const positions = new Float32Array(worldPositions.length);
    positions.set(worldPositions);

    const center = bounds.getCenter(new THREE.Vector3());
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] -= center.x;
      positions[i + 1] -= center.y;
      positions[i + 2] -= center.z;
    }

    const tmp = new THREE.BufferGeometry();
    tmp.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    tmp.computeBoundingSphere();
    const radius = Math.max(0.0001, tmp.boundingSphere?.radius ?? 1.0);
    tmp.dispose();

    return { positions, radius };
  }

  private mulberry32(seed: number): () => number {
    let t = seed >>> 0;
    return () => {
      t += 0x6d2b79f5;
      let x = Math.imul(t ^ (t >>> 15), 1 | t);
      x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  private withDeterministicRandom<T>(seed: number, fn: () => T): T {
    const old = Math.random;
    (Math as any).random = this.mulberry32(seed);
    try {
      return fn();
    } finally {
      (Math as any).random = old;
    }
  }

  private sampleSurfacePositions(
    root: THREE.Object3D,
    desiredCount: number,
    seed: number,
  ): { positions: Float32Array; bounds: THREE.Box3 } {
    const meshes: THREE.Mesh[] = [];
    const weights: number[] = [];
    let totalWeight = 0;

    root.traverse((o) => {
      const m = o as any;
      if (!m?.isMesh) return;
      const mesh = m as THREE.Mesh;
      const geom = mesh.geometry as THREE.BufferGeometry | undefined;
      const p = geom?.getAttribute('position') as THREE.BufferAttribute | undefined;
      if (!geom || !p || p.count < 3) return;
      meshes.push(mesh);
      const w = p.count; // cheap proxy for surface importance
      weights.push(w);
      totalWeight += w;
    });

    const count = Math.max(1, desiredCount);
    const positions = new Float32Array(count * 3);
    const bounds = new THREE.Box3();
    if (!meshes.length || totalWeight <= 0) return { positions, bounds };

    // Allocate samples per mesh proportional to weight; ensure exact sum = count
    const perMesh = weights.map((w) => Math.floor((w / totalWeight) * count));
    let assigned = perMesh.reduce((a, b) => a + b, 0);
    // Distribute remaining to the heaviest meshes
    const order = weights
      .map((w, i) => ({ w, i }))
      .sort((a, b) => b.w - a.w)
      .map((x) => x.i);
    let oi = 0;
    while (assigned < count) {
      perMesh[order[oi % order.length]]++;
      assigned++;
      oi++;
    }

    const tmp = new THREE.Vector3();
    let write = 0;

    this.withDeterministicRandom(seed, () => {
      for (let mi = 0; mi < meshes.length; mi++) {
        const n = perMesh[mi];
        if (n <= 0) continue;
        const mesh = meshes[mi];
        const sampler = new MeshSurfaceSampler(mesh).build();
        for (let i = 0; i < n; i++) {
          sampler.sample(tmp);
          tmp.applyMatrix4(mesh.matrixWorld);
          const k = write * 3;
          positions[k] = tmp.x;
          positions[k + 1] = tmp.y;
          positions[k + 2] = tmp.z;
          bounds.expandByPoint(tmp);
          write++;
          if (write >= count) break;
        }
        if (write >= count) break;
      }
    });

    return { positions, bounds };
  }

  private async sampleSurfacePositionsAsync(
    root: THREE.Object3D,
    desiredCount: number,
  ): Promise<{ positions: Float32Array; bounds: THREE.Box3 }> {
    const meshes: THREE.Mesh[] = [];
    const weights: number[] = [];
    let totalWeight = 0;

    root.traverse((o) => {
      const m = o as any;
      if (!m?.isMesh) return;
      const mesh = m as THREE.Mesh;
      const geom = mesh.geometry as THREE.BufferGeometry | undefined;
      const p = geom?.getAttribute('position') as THREE.BufferAttribute | undefined;
      if (!geom || !p || p.count < 3) return;
      meshes.push(mesh);
      const w = p.count;
      weights.push(w);
      totalWeight += w;
    });

    const count = Math.max(1, desiredCount);
    const positions = new Float32Array(count * 3);
    const bounds = new THREE.Box3();
    if (!meshes.length || totalWeight <= 0) return { positions, bounds };

    const perMesh = weights.map((w) => Math.floor((w / totalWeight) * count));
    let assigned = perMesh.reduce((a, b) => a + b, 0);
    const order = weights
      .map((w, i) => ({ w, i }))
      .sort((a, b) => b.w - a.w)
      .map((x) => x.i);
    let oi = 0;
    while (assigned < count) {
      perMesh[order[oi % order.length]]++;
      assigned++;
      oi++;
    }

    const tmp = new THREE.Vector3();
    const samplers = meshes.map((mesh) => new MeshSurfaceSampler(mesh).build());

    let write = 0;
    const YIELD_EVERY = 2200;
    for (let mi = 0; mi < meshes.length; mi++) {
      const n = perMesh[mi];
      if (n <= 0) continue;
      const mesh = meshes[mi];
      const sampler = samplers[mi];
      for (let i = 0; i < n; i++) {
        sampler.sample(tmp);
        tmp.applyMatrix4(mesh.matrixWorld);
        const k = write * 3;
        positions[k] = tmp.x;
        positions[k + 1] = tmp.y;
        positions[k + 2] = tmp.z;
        bounds.expandByPoint(tmp);
        write++;
        if (write >= count) break;
        if (write % YIELD_EVERY === 0) await this.nextFrame();
      }
      if (write >= count) break;
      await this.nextFrame();
    }

    return { positions, bounds };
  }

  private disposePoints(points: THREE.Points): void {
    (points.geometry as THREE.BufferGeometry | undefined)?.dispose();
    const m = points.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
    else m?.dispose();
  }

  private dispose(): void {
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('pointermove', this.onWindowPointerMove);
    window.removeEventListener('scroll', this.onWindowScroll);
    this.ro?.disconnect();
    this.ro = undefined;
    
    if (this.resizeTimeout !== null) {
      cancelAnimationFrame(this.resizeTimeout);
      this.resizeTimeout = null;
    }
    
    this.io?.disconnect();
    this.io = undefined;

    const onVis = (this as any)._onVis as ((this: Document, ev: Event) => any) | undefined;
    if (onVis) document.removeEventListener('visibilitychange', onVis);

    if (this.points) {
      this.scene.remove(this.points);
      this.disposePoints(this.points);
      this.points = undefined;
    }
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.parentElement?.removeChild(this.renderer.domElement);
    }
    this.draco?.dispose();
    this.scene?.clear();
  }
}

