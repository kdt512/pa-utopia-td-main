import { _decorator, Component, MeshRenderer, utils, Mesh, gfx, Vec3, Vec4, Color, Mat4, sys } from 'cc';
import { IParticleDrawSystem, Particle } from './ParticleSpawnSystem';
import { ParticleSpawnSystem } from './ParticleSpawnSystem';

const { ccclass, property, requireComponent } = _decorator;

@ccclass('ParticleDrawSystem')
@requireComponent(MeshRenderer)
export class ParticleDrawSystem extends Component implements IParticleDrawSystem {

    @property
    public particleCount: number = 4000; // Max particles

    @property
    public textureUrl: string = ''; // Optional texture

    // Interface implementation
    public nextSpawnIndex: number = 0;
    public particleBuffer: Particle[] = [];

    // Internal state
    private _meshRenderer: MeshRenderer = null!;
    private _mesh: Mesh = null!;
    private _vertexData: Float32Array = null!;
    private _indices: Uint16Array = null!;
    
    // Geometry constants
    private readonly VERTS_PER_PARTICLE = 4;
    private readonly INDICES_PER_PARTICLE = 6;
    private readonly FLOATS_PER_VERT = 9; // pos(3) + normal(3) + uv(2) + color(4) -> wait, standard fmt
    // Standard vfmtPosUvColor: pos(3) + uv(2) + color(4) = 9 floats
    
    protected onLoad() {
        this._meshRenderer = this.getComponent(MeshRenderer)!;
        
        // Initialize particle storage
        this.particleBuffer = new Array(this.particleCount);
        for(let i=0; i<this.particleCount; i++) {
            this.particleBuffer[i] = {
                pos_size: new Vec4(0,0,0,0),
                vel_life: new Vec4(0,0,0,-1), // Dead
                extra: new Vec4(),
                color: new Vec4(),
                misc: new Vec4()
            };
        }

        this.createMesh();
        
        // Auto-assign to SpawnSystem if present
        if (ParticleSpawnSystem.instance) {
            ParticleSpawnSystem.instance.setMainParticleSystem(this);
        }
    }

    protected start() {
        // Re-check assignment in start just in case execution order
        if (ParticleSpawnSystem.instance) {
            ParticleSpawnSystem.instance.setMainParticleSystem(this);
        }
    }

    private createMesh() {
        // Create dynamic mesh
        const totalVerts = this.particleCount * this.VERTS_PER_PARTICLE;
        const totalIndices = this.particleCount * this.INDICES_PER_PARTICLE;

        // stride = 3(pos) + 2(uv) + 4(color) = 9 floats * 4 bytes = 36 bytes
        const stride = 9 * 4; 
        
        this._vertexData = new Float32Array(totalVerts * 9);
        this._indices = new Uint16Array(totalIndices);

        // Pre-calculate indices
        for (let i = 0; i < this.particleCount; i++) {
            const vStart = i * 4;
            const iStart = i * 6;
            
            this._indices[iStart] = vStart;
            this._indices[iStart+1] = vStart + 1;
            this._indices[iStart+2] = vStart + 2;
            this._indices[iStart+3] = vStart + 2;
            this._indices[iStart+4] = vStart + 3;
            this._indices[iStart+5] = vStart;
            
            // Pre-calculate UVs (flipped Y for Cocos?)
            // BL
            this._vertexData[vStart * 9 + 3] = 0;
            this._vertexData[vStart * 9 + 4] = 1;
            // BR
            this._vertexData[(vStart + 1) * 9 + 3] = 1;
            this._vertexData[(vStart + 1) * 9 + 4] = 1;
            // TR
            this._vertexData[(vStart + 2) * 9 + 3] = 1;
            this._vertexData[(vStart + 2) * 9 + 4] = 0;
            // TL
            this._vertexData[(vStart + 3) * 9 + 3] = 0;
            this._vertexData[(vStart + 3) * 9 + 4] = 0;
        }

        // Define vertex format
        const gfxParams = {
            positions: [], // we will update buffer directly
            uvs: [],
            colors: [],
            indices: [],
            customAttributes: []
        };

        this._mesh = utils.createMesh({
            positions: new Array(totalVerts * 3).fill(0),
            uvs: new Array(totalVerts * 2).fill(0),
            colors: new Array(totalVerts * 4).fill(0),
            indices: Array.from(this._indices), // initial indices
            primitiveMode: gfx.PrimitiveMode.TRIANGLE_LIST,
            minPos: new Vec3(-1000, -1000, -1000),
            maxPos: new Vec3(1000, 1000, 1000)
        });
        
        this._meshRenderer.mesh = this._mesh;
        
        // Important: set usage to dynamic for frequent updates
        // Note: utils.createMesh might not expose usage setting easily, 
        // but we will update the buffers using mesh.updateSubMesh or directly accessing buffers.
    }

    public writeParticleData(particles: Particle[], startIndex: number, count: number) {
        // Copy new particles into our buffer
        for (let i = 0; i < count; i++) {
            const idx = (startIndex + i) % this.particleCount;
            const src = particles[i];
            const dst = this.particleBuffer[idx];
            
            // Manual copy to avoid creating new objects
            Vec4.copy(dst.pos_size, src.pos_size);
            Vec4.copy(dst.vel_life, src.vel_life);
            Vec4.copy(dst.extra, src.extra);
            Vec4.copy(dst.color, src.color);
            Vec4.copy(dst.misc, src.misc);
        }
    }

    protected update(dt: number) {
        if (!this._mesh) return;

        let activeParticles = 0;
        const vData = this._vertexData;

        // Reuse temp vectors
        const right = Vec3.RIGHT; // Assuming billboard faces Z or Camera
        const up = Vec3.UP;
        
        // For 3D billboard, we might need camera rotation. 
        // For simplicity, let's assume XY plane billboards (2D style) or screen-facing.
        // If 3D, we usually want View-aligned billboards.
        
        // Simple CPU Simulation
        for (let i = 0; i < this.particleCount; i++) {
            const p = this.particleBuffer[i];
            
            if (p.vel_life.w > 0) {
                // Alive
                p.vel_life.w -= dt; // Decrease life
                
                if (p.vel_life.w <= 0) {
                    // Died this frame
                    p.vel_life.w = -1;
                    this.clearParticleGeometry(i);
                    continue;
                }

                // Physics
                // pos += vel * dt
                p.pos_size.x += p.vel_life.x * dt;
                p.pos_size.y += p.vel_life.y * dt;
                p.pos_size.z += p.vel_life.z * dt;
                
                // Gravity
                if (p.misc.w !== 0) {
                    p.vel_life.y -= 9.8 * p.misc.w * dt;
                }

                // Update Geometry
                activeParticles++;
                this.updateParticleGeometry(i, p);
            }
        }

        if (activeParticles > 0) {
             this.uploadMesh();
        }
    }

    private updateParticleGeometry(index: number, p: Particle) {
        const vStart = index * 4; // 4 verts
        const offset = vStart * 9; // 9 floats per vert
        
        const x = p.pos_size.x;
        const y = p.pos_size.y;
        const z = p.pos_size.z;
        const size = p.pos_size.w; // or calculate from scale curves
        const halfSize = size * 0.5;

        // Color (r,g,b,a)
        const r = p.color.x;
        const g = p.color.y;
        const b = p.color.z;
        const a = p.color.w * (Math.min(p.vel_life.w, 1.0)); // Fade out? p.vel_life.w is remaining life.
        // Usually alpha is life/startLife or just curve. For now just use stored alpha.
        // Actually p.color.w was 'life' in SpawnSystem but usually it should be alpha. 
        // SpawnSystem: color.w = life (duration). Wait, let's check SpawnSystem.
        // SpawnSystem: color = new float4(..., life). 
        // So stored alpha is actually duration? That's weird. 
        // Let's assume we want full opacity for now. 
        // Or re-read SpawnSystem: 
        // color = new Vector4(entry.ColorIntensity.x, ... y, ... z, life);
        // It seems the 4th component IS life duration passed to shader?
        // Let's just use 1.0 for alpha for now, or fade based on life.
        const alpha = 1.0; 

        // Billboard Quad (XY plane)
        // BL
        vData[offset]     = x - halfSize;
        vData[offset + 1] = y - halfSize;
        vData[offset + 2] = z;
        vData[offset + 5] = r; vData[offset + 6] = g; vData[offset + 7] = b; vData[offset + 8] = alpha;

        // BR
        const offset2 = offset + 9;
        vData[offset2]     = x + halfSize;
        vData[offset2 + 1] = y - halfSize;
        vData[offset2 + 2] = z;
        vData[offset2 + 5] = r; vData[offset2 + 6] = g; vData[offset2 + 7] = b; vData[offset2 + 8] = alpha;

        // TR
        const offset3 = offset + 18;
        vData[offset3]     = x + halfSize;
        vData[offset3 + 1] = y + halfSize;
        vData[offset3 + 2] = z;
        vData[offset3 + 5] = r; vData[offset3 + 6] = g; vData[offset3 + 7] = b; vData[offset3 + 8] = alpha;

        // TL
        const offset4 = offset + 27;
        vData[offset4]     = x - halfSize;
        vData[offset4 + 1] = y + halfSize;
        vData[offset4 + 2] = z;
        vData[offset4 + 5] = r; vData[offset4 + 6] = g; vData[offset4 + 7] = b; vData[offset4 + 8] = alpha;

        // Note: UVs are static in createMesh, so we don't update them here unless we use texture atlas.
        // UV indices are at offset + 3, + 4.
    }

    private clearParticleGeometry(index: number) {
        // Collapse quad to 0 to hide it
        const vStart = index * 4;
        const offset = vStart * 9;
        
        // Zero out positions
        for(let i=0; i<4; i++) {
            this._vertexData[offset + i*9] = 0;
            this._vertexData[offset + i*9 + 1] = 0;
            this._vertexData[offset + i*9 + 2] = 0;
        }
    }

    private uploadMesh() {
        // Upload vertex buffer
        // Access low-level rendering buffer
        this._mesh.reset({
            struct: {
                vertexBundles: [{
                    view: {
                        offset: 0,
                        length: this._vertexData.byteLength,
                        count: this._vertexData.length / 9,
                        stride: 9 * 4 // 9 floats, 4 bytes each
                    },
                    attributes: [
                        { name: gfx.AttributeName.ATTR_POSITION, format: gfx.Format.RGB32F },
                        { name: gfx.AttributeName.ATTR_TEX_COORD, format: gfx.Format.RG32F },
                        { name: gfx.AttributeName.ATTR_COLOR, format: gfx.Format.RGBA32F }
                    ]
                }],
                primitives: [{
                    primitiveMode: gfx.PrimitiveMode.TRIANGLE_LIST,
                    vertexBundleIndices: [0],
                    indexView: {
                        offset: 0,
                        length: this._indices.byteLength,
                        count: this._indices.length,
                        stride: 2
                    }
                }]
            },
            data: {
                vertexBuffers: [this._vertexData],
                indexBuffer: this._indices
            }
        });
    }
}
