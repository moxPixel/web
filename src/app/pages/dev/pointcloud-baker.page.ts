import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';

type BakeItem = {
  id: string;
  modelPath: string;
};

@Component({
  selector: 'app-pointcloud-baker-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="ui-container" style="padding: 2rem 0; max-width: 920px;">
      <h1 style="margin:0 0 0.5rem;">Pointcloud baker</h1>
      <p style="margin:0 0 1rem; opacity:0.75;">
        Génère une fois des fichiers <code>.bin</code> (Float32 positions) à partir des <code>.glb</code> et les télécharge.
        Ensuite tu les mets dans <code>public/assets/pointclouds/&lt;count&gt;/&lt;id&gt;.bin</code>.
      </p>

      <div style="display:flex; gap:0.75rem; flex-wrap:wrap; align-items:center; margin-bottom: 1rem;">
        <button (click)="run()" [disabled]="running" style="height:2.75rem;padding:0 1rem;border-radius:999px;">
          {{ running ? 'Génération…' : 'Générer & télécharger' }}
        </button>
        <label style="display:flex; gap:0.5rem; align-items:center; opacity:0.85;">
          <span>Counts:</span>
          <input type="text" [(ngModel)]="countsText" style="width:220px;"/>
        </label>
      </div>

      <pre style="background:rgba(255,255,255,0.06); padding:1rem; border-radius:12px; overflow:auto; max-height: 55vh;">{{ log }}</pre>
    </section>
  `,
})
export class PointcloudBakerPage {
  running = false;
  log = '';
  countsText = '45000,90000';

  private readonly items: BakeItem[] = [
    { id: 'hero', modelPath: '/assets/models/unlock-model.glb' },
    { id: 'about', modelPath: '/assets/models/unlock-model-about.glb' },
    { id: 'business', modelPath: '/assets/models/unlock-model-buisness-.glb' },
    { id: 'reviews', modelPath: '/assets/models/unlock-model-review-.glb' },
    { id: 'quality', modelPath: '/assets/models/unlock-model-quality.glb' },
    { id: 'locky-games', modelPath: '/assets/models/unlock-model-games.glb' },
    { id: 'events', modelPath: '/assets/models/unlock-model-event.glb' },
  ];

  async run(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.log = '';
    try {
      const counts = this.countsText
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n) && n > 0);

      const loader = new GLTFLoader();
      const draco = new DRACOLoader();
      draco.setDecoderPath('/assets/draco/');
      draco.setDecoderConfig({ type: 'wasm' });
      draco.setWorkerLimit(Math.min(4, (navigator as any).hardwareConcurrency || 4));
      draco.preload();
      loader.setDRACOLoader(draco);

      const manifest: any = { version: 1, counts, items: this.items.map((x) => ({ id: x.id, modelPath: x.modelPath })) };

      for (const count of counts) {
        for (const item of this.items) {
          this.append(`Loading ${item.modelPath}…`);
          const scene = await this.loadGltfScene(loader, item.modelPath);
          this.append(`Sampling ${item.id} @ ${count}…`);
          const positions = this.extractCenteredSurfacePositions(scene, count, 1337);
          this.downloadBin(`${item.id}.bin`, positions);
          this.append(`Downloaded ${item.id}.bin (${(positions.byteLength / 1024 / 1024).toFixed(2)} MB)`);
          await this.sleep(180);
        }
      }

      this.downloadJson('manifest.json', manifest);
      this.append('Downloaded manifest.json');
    } catch (e: any) {
      this.append(`ERROR: ${String(e?.message || e)}`);
    } finally {
      this.running = false;
    }
  }

  private append(s: string): void {
    this.log += (this.log ? '\n' : '') + s;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }

  private async loadGltfScene(loader: GLTFLoader, url: string): Promise<THREE.Object3D> {
    const r = await fetch(url, { cache: 'force-cache' });
    if (!r.ok) throw new Error(`Failed to fetch ${url} (${r.status})`);
    const data = await r.arrayBuffer();
    const basePath = url.includes('/') ? url.slice(0, url.lastIndexOf('/') + 1) : '/';
    const gltf = await new Promise<any>((resolve, reject) => {
      loader.parse(data as any, basePath, (g) => resolve(g), (e) => reject(e));
    });
    return gltf.scene as THREE.Object3D;
  }

  private extractCenteredSurfacePositions(root: THREE.Object3D, desiredCount: number, seed: number): Float32Array {
    root.updateWorldMatrix(true, true);
    const { positions, bounds } = this.sampleSurfacePositions(root, desiredCount, seed);
    const center = bounds.getCenter(new THREE.Vector3());
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] -= center.x;
      positions[i + 1] -= center.y;
      positions[i + 2] -= center.z;
    }
    return positions;
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

  private downloadBin(filename: string, positions: Float32Array): void {
    // Create an explicit ArrayBuffer copy to avoid TS complaining about ArrayBufferLike/SharedArrayBuffer.
    const buffer = new ArrayBuffer(positions.byteLength);
    new Uint8Array(buffer).set(new Uint8Array(positions.buffer));
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    this.downloadBlob(filename, blob);
  }

  private downloadJson(filename: string, data: any): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    this.downloadBlob(filename, blob);
  }

  private downloadBlob(filename: string, blob: Blob): void {
    const a = document.createElement('a');
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 8000);
  }
}


