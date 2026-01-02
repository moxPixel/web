/* eslint-disable no-console */
/**
 * Bake Draco-compressed GLB models into raw pointcloud `.bin` files (Float32 xyz).
 *
 * Output:
 *  public/assets/pointclouds/<count>/<id>.bin
 *
 * This script is the automated equivalent of the in-app dev baker page (`/_dev/pointclouds`),
 * but runs in Node so you can generate all pointclouds in one command and commit them.
 */
const fs = require('fs');
const path = require('path');
const THREE = require('three');

const DracoDecoderModuleFactory = require('../public/assets/draco/draco_decoder.js');

/** @type {{id: string, modelPath: string}[]} */
const ITEMS = [
  { id: 'hero', modelPath: 'public/assets/models/unlock-model.glb' },
  { id: 'about', modelPath: 'public/assets/models/unlock-model-about.glb' },
  { id: 'business', modelPath: 'public/assets/models/unlock-model-buisness-.glb' },
  { id: 'reviews', modelPath: 'public/assets/models/unlock-model-review-.glb' },
  { id: 'quality', modelPath: 'public/assets/models/unlock-model-quality.glb' },
  { id: 'locky-games', modelPath: 'public/assets/models/unlock-model-games.glb' },
  { id: 'events', modelPath: 'public/assets/models/unlock-model-event.glb' },
];

function parseArgs(argv) {
  const out = {
    counts: [45000, 90000],
    seed: 1337,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--counts' && argv[i + 1]) {
      out.counts = String(argv[++i])
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n) && n > 0);
    } else if (a === '--seed' && argv[i + 1]) {
      out.seed = Number(argv[++i]) || out.seed;
    }
  }
  return out;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function readGlb(filePath) {
  const buf = fs.readFileSync(filePath);
  const magic = buf.toString('utf8', 0, 4);
  if (magic !== 'glTF') throw new Error(`Not a GLB: ${filePath}`);
  const jsonLen = buf.readUInt32LE(12);
  const jsonType = buf.readUInt32LE(16);
  if (jsonType !== 0x4e4f534a) throw new Error(`Missing JSON chunk in: ${filePath}`);
  const jsonStr = buf.toString('utf8', 20, 20 + jsonLen);
  const json = JSON.parse(jsonStr);

  // BIN chunk starts right after JSON chunk header+data.
  const binHeaderOffset = 20 + jsonLen;
  const binLen = buf.readUInt32LE(binHeaderOffset);
  const binType = buf.readUInt32LE(binHeaderOffset + 4);
  if (binType !== 0x004e4942) throw new Error(`Missing BIN chunk in: ${filePath}`);
  const binStart = binHeaderOffset + 8;
  const bin = new Uint8Array(buf.buffer, buf.byteOffset + binStart, binLen);
  return { json, bin };
}

function buildWorldMatrices(gltfJson) {
  const nodes = gltfJson.nodes || [];
  const scenes = gltfJson.scenes || [];
  const sceneIndex = gltfJson.scene ?? 0;
  const scene = scenes[sceneIndex] || { nodes: [] };

  /** @type {THREE.Matrix4[]} */
  const world = nodes.map(() => new THREE.Matrix4());
  const visited = new Array(nodes.length).fill(false);

  function nodeLocalMatrix(n) {
    const m = new THREE.Matrix4();
    if (Array.isArray(n.matrix) && n.matrix.length === 16) {
      m.fromArray(n.matrix);
      return m;
    }
    const t = Array.isArray(n.translation) ? n.translation : [0, 0, 0];
    const r = Array.isArray(n.rotation) ? n.rotation : [0, 0, 0, 1];
    const s = Array.isArray(n.scale) ? n.scale : [1, 1, 1];
    const pos = new THREE.Vector3(t[0] || 0, t[1] || 0, t[2] || 0);
    const quat = new THREE.Quaternion(r[0] || 0, r[1] || 0, r[2] || 0, r[3] ?? 1);
    const scl = new THREE.Vector3(s[0] ?? 1, s[1] ?? 1, s[2] ?? 1);
    m.compose(pos, quat, scl);
    return m;
  }

  function visit(idx, parentMat) {
    if (idx == null || idx < 0 || idx >= nodes.length) return;
    const n = nodes[idx] || {};
    const local = nodeLocalMatrix(n);
    const wm = new THREE.Matrix4();
    wm.multiplyMatrices(parentMat, local);
    world[idx].copy(wm);
    visited[idx] = true;
    const children = Array.isArray(n.children) ? n.children : [];
    for (const c of children) visit(c, wm);
  }

  const identity = new THREE.Matrix4();
  for (const rootIdx of scene.nodes || []) {
    visit(rootIdx, identity);
  }

  // Ensure all nodes have something (avoid undefined matrix later)
  for (let i = 0; i < nodes.length; i++) {
    if (!visited[i]) world[i].copy(nodeLocalMatrix(nodes[i] || {}));
  }

  return world;
}

function transformPositionsInPlace(positions, mat4) {
  const m = mat4.elements;
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
    positions[i] = m[0] * x + m[4] * y + m[8] * z + m[12];
    positions[i + 1] = m[1] * x + m[5] * y + m[9] * z + m[13];
    positions[i + 2] = m[2] * x + m[6] * y + m[10] * z + m[14];
  }
}

async function createDracoModule() {
  const decoderDir = path.resolve(__dirname, '../public/assets/draco');
  const draco = await DracoDecoderModuleFactory({
    locateFile: (file) => path.join(decoderDir, file),
  });
  return draco;
}

function decodeDracoPrimitive(draco, gltfJson, binChunk, primitive) {
  const ext = primitive?.extensions?.KHR_draco_mesh_compression;
  if (!ext) throw new Error('Primitive has no KHR_draco_mesh_compression extension');
  const bufferViewIndex = ext.bufferView;
  const bufferViews = gltfJson.bufferViews || [];
  const bv = bufferViews[bufferViewIndex];
  if (!bv) throw new Error(`Missing bufferView ${bufferViewIndex}`);
  const byteOffset = bv.byteOffset || 0;
  const byteLength = bv.byteLength || 0;
  const dracoData = new Int8Array(binChunk.buffer, binChunk.byteOffset + byteOffset, byteLength);

  const decoder = new draco.Decoder();
  const buffer = new draco.DecoderBuffer();
  buffer.Init(dracoData, dracoData.length);

  const geomType = decoder.GetEncodedGeometryType(buffer);
  if (geomType !== draco.TRIANGULAR_MESH) {
    draco.destroy(buffer);
    draco.destroy(decoder);
    throw new Error(`Unsupported Draco geometry type: ${geomType}`);
  }

  const mesh = new draco.Mesh();
  const status = decoder.DecodeBufferToMesh(buffer, mesh);
  if (!status || status.ok?.() === false) {
    draco.destroy(mesh);
    draco.destroy(buffer);
    draco.destroy(decoder);
    throw new Error('Failed to decode Draco mesh');
  }

  // POSITION attribute unique id is specified by glTF extension mapping
  const uniquePosId = ext.attributes?.POSITION;
  if (uniquePosId == null) {
    draco.destroy(mesh);
    draco.destroy(buffer);
    draco.destroy(decoder);
    throw new Error('Missing POSITION mapping in Draco extension');
  }

  const posAttr = decoder.GetAttributeByUniqueId(mesh, uniquePosId);
  if (!posAttr) {
    draco.destroy(mesh);
    draco.destroy(buffer);
    draco.destroy(decoder);
    throw new Error('Failed to get POSITION attribute from Draco mesh');
  }

  const numPoints = mesh.num_points();
  const numComp = posAttr.num_components();
  if (numComp !== 3) {
    draco.destroy(mesh);
    draco.destroy(buffer);
    draco.destroy(decoder);
    throw new Error(`Unexpected POSITION components: ${numComp}`);
  }

  const dracoPos = new draco.DracoFloat32Array();
  decoder.GetAttributeFloatForAllPoints(mesh, posAttr, dracoPos);
  const positions = new Float32Array(numPoints * 3);
  for (let i = 0; i < positions.length; i++) positions[i] = dracoPos.GetValue(i);
  draco.destroy(dracoPos);

  // Indices: build per-face triangles
  const numFaces = mesh.num_faces();
  const indices = new Uint32Array(numFaces * 3);
  const face = new draco.DracoInt32Array();
  for (let fi = 0; fi < numFaces; fi++) {
    decoder.GetFaceFromMesh(mesh, fi, face);
    const k = fi * 3;
    indices[k] = face.GetValue(0);
    indices[k + 1] = face.GetValue(1);
    indices[k + 2] = face.GetValue(2);
  }
  draco.destroy(face);

  draco.destroy(mesh);
  draco.destroy(buffer);
  draco.destroy(decoder);

  return { positions, indices };
}

function centerPositionsInPlace(positions) {
  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i],
      y = positions[i + 1],
      z = positions[i + 2];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (z < minZ) minZ = z;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
  }
  const cx = (minX + maxX) * 0.5;
  const cy = (minY + maxY) * 0.5;
  const cz = (minZ + maxZ) * 0.5;
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] -= cx;
    positions[i + 1] -= cy;
    positions[i + 2] -= cz;
  }
}

function buildTriangleSamplingData(positions, indices) {
  const triCount = Math.floor(indices.length / 3);
  const cumulative = new Float64Array(triCount);
  let total = 0;

  for (let ti = 0; ti < triCount; ti++) {
    const i0 = indices[ti * 3] * 3;
    const i1 = indices[ti * 3 + 1] * 3;
    const i2 = indices[ti * 3 + 2] * 3;

    const ax = positions[i0],
      ay = positions[i0 + 1],
      az = positions[i0 + 2];
    const bx = positions[i1],
      by = positions[i1 + 1],
      bz = positions[i1 + 2];
    const cx = positions[i2],
      cy = positions[i2 + 1],
      cz = positions[i2 + 2];

    const abx = bx - ax,
      aby = by - ay,
      abz = bz - az;
    const acx = cx - ax,
      acy = cy - ay,
      acz = cz - az;

    const crx = aby * acz - abz * acy;
    const cry = abz * acx - abx * acz;
    const crz = abx * acy - aby * acx;
    const area = 0.5 * Math.sqrt(crx * crx + cry * cry + crz * crz);

    total += area;
    cumulative[ti] = total;
  }

  return { cumulative, totalArea: total };
}

function binarySearchCumulative(cum, x) {
  let lo = 0;
  let hi = cum.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (x <= cum[mid]) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

function samplePointOnTriangle(positions, indices, triIndex, rng) {
  const i0 = indices[triIndex * 3] * 3;
  const i1 = indices[triIndex * 3 + 1] * 3;
  const i2 = indices[triIndex * 3 + 2] * 3;

  const ax = positions[i0],
    ay = positions[i0 + 1],
    az = positions[i0 + 2];
  const bx = positions[i1],
    by = positions[i1 + 1],
    bz = positions[i1 + 2];
  const cx = positions[i2],
    cy = positions[i2 + 1],
    cz = positions[i2 + 2];

  // Uniform barycentric sampling
  let u = rng();
  let v = rng();
  if (u + v > 1) {
    u = 1 - u;
    v = 1 - v;
  }
  const abx = bx - ax,
    aby = by - ay,
    abz = bz - az;
  const acx = cx - ax,
    acy = cy - ay,
    acz = cz - az;

  return {
    x: ax + abx * u + acx * v,
    y: ay + aby * u + acy * v,
    z: az + abz * u + acz * v,
  };
}

function sampleSurfacePoints(primitives, count, seed) {
  const rng = mulberry32(seed);

  // Primitive-level area CDF
  const primCum = new Float64Array(primitives.length);
  let total = 0;
  for (let i = 0; i < primitives.length; i++) {
    total += primitives[i].sampling.totalArea;
    primCum[i] = total;
  }

  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = rng() * total;
    const primIdx = binarySearchCumulative(primCum, r);
    const prim = primitives[primIdx];

    const triR = rng() * prim.sampling.totalArea;
    const triIdx = binarySearchCumulative(prim.sampling.cumulative, triR);
    const p = samplePointOnTriangle(prim.positions, prim.indices, triIdx, rng);

    const k = i * 3;
    out[k] = p.x;
    out[k + 1] = p.y;
    out[k + 2] = p.z;
  }
  return out;
}

async function bakeOne(draco, item, counts, baseSeed) {
  const filePath = path.resolve(__dirname, '..', item.modelPath);
  console.log(`\n[Bake] Reading ${item.id} from ${item.modelPath}`);
  const { json: gltfJson, bin } = readGlb(filePath);
  const worldMats = buildWorldMatrices(gltfJson);

  /** @type {{positions: Float32Array, indices: Uint32Array, sampling: {cumulative: Float64Array, totalArea: number}}[]} */
  const primitives = [];

  const nodes = gltfJson.nodes || [];
  const meshes = gltfJson.meshes || [];

  for (let ni = 0; ni < nodes.length; ni++) {
    const node = nodes[ni];
    if (node?.mesh == null) continue;
    const mesh = meshes[node.mesh];
    if (!mesh?.primitives?.length) continue;
    const wm = worldMats[ni] || new THREE.Matrix4();

    for (const prim of mesh.primitives) {
      // We only support Draco-compressed primitives (your assets all are).
      const decoded = decodeDracoPrimitive(draco, gltfJson, bin, prim);
      transformPositionsInPlace(decoded.positions, wm);
      const sampling = buildTriangleSamplingData(decoded.positions, decoded.indices);
      if (!sampling.totalArea || !Number.isFinite(sampling.totalArea)) continue;
      primitives.push({ positions: decoded.positions, indices: decoded.indices, sampling });
    }
  }

  if (!primitives.length) throw new Error(`No primitives decoded for ${item.id}`);

  // Center using ALL vertices across all primitives, then apply same center shift to each primitive.
  // First compute global bounds:
  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity;
  for (const prim of primitives) {
    const p = prim.positions;
    for (let i = 0; i < p.length; i += 3) {
      const x = p[i],
        y = p[i + 1],
        z = p[i + 2];
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (z < minZ) minZ = z;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      if (z > maxZ) maxZ = z;
    }
  }
  const cx = (minX + maxX) * 0.5;
  const cy = (minY + maxY) * 0.5;
  const cz = (minZ + maxZ) * 0.5;
  for (const prim of primitives) {
    const p = prim.positions;
    for (let i = 0; i < p.length; i += 3) {
      p[i] -= cx;
      p[i + 1] -= cy;
      p[i + 2] -= cz;
    }
    // Recompute sampling areas after centering (translation doesn't change areas, but safe)
    prim.sampling = buildTriangleSamplingData(prim.positions, prim.indices);
  }

  for (const count of counts) {
    const seed = baseSeed + count * 17;
    console.log(`[Bake] Sampling ${item.id} @ ${count} points (seed=${seed})…`);
    const positions = sampleSurfacePoints(primitives, count, seed);

    // Output path expected by runtime:
    // public/assets/pointclouds/<count>/<id>.bin
    const outDir = path.resolve(__dirname, '..', 'public/assets/pointclouds', String(count));
    ensureDir(outDir);
    const outFile = path.join(outDir, `${item.id}.bin`);
    fs.writeFileSync(outFile, Buffer.from(positions.buffer));
    console.log(`[Bake] Wrote ${path.relative(path.resolve(__dirname, '..'), outFile)} (${(positions.byteLength / 1024 / 1024).toFixed(2)} MB)`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log(`[Bake] counts=${args.counts.join(',')} seed=${args.seed}`);

  const draco = await createDracoModule();
  try {
    for (const item of ITEMS) {
      await bakeOne(draco, item, args.counts, args.seed);
    }

    // Manifest (handy for debugging)
    const manifest = {
      version: 1,
      seed: args.seed,
      counts: args.counts,
      items: ITEMS.map((x) => ({ id: x.id, modelPath: x.modelPath })),
      output: 'public/assets/pointclouds/<count>/<id>.bin',
    };
    const out = path.resolve(__dirname, '..', 'public/assets/pointclouds', 'manifest.json');
    ensureDir(path.dirname(out));
    fs.writeFileSync(out, JSON.stringify(manifest, null, 2), 'utf8');
    console.log(`\n[Bake] Wrote public/assets/pointclouds/manifest.json`);
  } finally {
    // clean up wasm module
    if (draco && typeof draco.destroy === 'function') {
      // best-effort: module-wide destroy is not required; individual objects are destroyed.
    }
  }
}

main().catch((e) => {
  console.error('[Bake] ERROR:', e);
  process.exitCode = 1;
});


