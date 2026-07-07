import { _decorator, Component, Node, Vec2, Vec3, Vec4, Color, math, sys } from 'cc';
const { ccclass, property } = _decorator;

// --- Data Structures (Mocking Unity/C# structs) ---

// Giả lập cấu trúc SpawnRequest (bạn cần định nghĩa lại cho khớp với project)
export interface SpawnRequest {
    position: Vec3;
    color: Color;
    intensity: number;
    count: number;
    radius: number;
    minRadius: number;
    coneAngle: number;
    direction: Vec2;
    angleJitter: number;
    speedMin: number;
    speedMax: number;
    lifeMin: number;
    lifeMax: number;
    lengthMin: number;
    lengthMax: number;
    thicknessMin: number;
    thicknessMax: number;
    scaleDelayMin: number;
    scaleDelayMax: number;
    scaleSpeedMin: number;
    scaleSpeedMax: number;
    pulseFreqMin: number;
    pulseFreqMax: number;
    pulseStrengthMin: number;
    pulseStrengthMax: number;
    gravityScale: number;
    moveDelayMin: number;
    moveDelayMax: number;
    particleSpawnDelay: number; // 0 for instant
}

// Giả lập cấu trúc Particle của ParticleDrawSystem
export interface Particle {
    pos_size: Vec4; // x, y, z, size (length)
    vel_life: Vec4; // vx, vy, vz, life
    extra: Vec4;    // thickness, moveDelay, scaleSpeed, scaleDelay
    color: Vec4;    // r, g, b, a (life)
    misc: Vec4;     // phase, frequency, pulseStrength, gravityScale
}

// Interface cho hệ thống vẽ (bạn cần implement class này)
export interface IParticleDrawSystem {
    particleCount: number;
    nextSpawnIndex: number;
    particleBuffer: any; // Float32Array or similar
    writeParticleData(particles: Particle[], startIndex: number, count: number): void;
}

interface ActiveSpawnRequest {
    request: SpawnRequest;
    particlesRemaining: number;
    nextSpawnTime: number;
    baseSeed: number;
}

interface BatchedSpawnEntry {
    basePosition: Vec3;
    colorIntensity: Vec4;
    radius: number;
    minRadius: number;
    coneAngle: number;
    direction: Vec2;
    angleJitter: number;
    speedMin: number;
    speedMax: number;
    lifeMin: number;
    lifeMax: number;
    lengthMin: number;
    lengthMax: number;
    thicknessMin: number;
    thicknessMax: number;
    scaleDelayMin: number;
    scaleDelayMax: number;
    scaleSpeedMin: number;
    scaleSpeedMax: number;
    pulseFreqMin: number;
    pulseFreqMax: number;
    pulseStrengthMin: number;
    pulseStrengthMax: number;
    gravityScale: number;
    moveDelayMin: number;
    moveDelayMax: number;
    randomSeed: number;
}

// --- Helper Random (Seeded) ---
class SeededRandom {
    private _seed: number;
    constructor(seed: number) {
        this._seed = seed;
    }
    // Simple LCG or similar
    nextFloat(min: number = 0, max: number = 1): number {
        this._seed = (this._seed * 9301 + 49297) % 233280;
        const rnd = this._seed / 233280;
        return min + rnd * (max - min);
    }
}

@ccclass('ParticleSpawnSystem')
export class ParticleSpawnSystem extends Component {

    // --- References ---
    // @property(ParticleDrawSystem) // Uncomment when ParticleDrawSystem is a Component
    private _mainParticleDrawSystem: IParticleDrawSystem | null = null;

    // --- Settings ---
    @property
    private maxParticlesPerFrame: number = 500;
    @property
    private maxSpawnRequestsPerFrame: number = 50;
    @property
    private maxRequestsPerFrame: number = 10;
    @property
    private mobileSpawnCooldown: number = 2; // Spawn every N frames on mobile

    // --- State ---
    private _spawnQueue: SpawnRequest[] = []; // Using Array as Queue
    private _frameSpawnRequests: SpawnRequest[] = [];
    private _activeRequests: ActiveSpawnRequest[] = [];
    
    // Batched data
    private _batchedEntries: BatchedSpawnEntry[] = [];
    private _batchedParticleOutput: Particle[] = [];
    // private readonly MAX_BATCHED_PARTICLES = 15000; // Not strictly needed in JS array

    private _isMobilePlatform: boolean = false;
    private _framesSinceLastSpawn: number = 0;
    
    // Fixed timestep logic
    private _fixedTimeAccumulator: number = 0;
    private _simulatedFixedTime: number = 0;
    private readonly FIXED_TIMESTEP: number = 0.02;

    // Rate limiting
    private _requestsThisSecond: number = 0;
    private _secondTimer: number = 0;
    private _seedCounter: number = 0;

    public static instance: ParticleSpawnSystem | null = null;

    protected onLoad() {
        ParticleSpawnSystem.instance = this;
        this._isMobilePlatform = sys.isMobile;
    }

    protected onDestroy() {
        if (ParticleSpawnSystem.instance === this) {
            ParticleSpawnSystem.instance = null;
        }
    }

    protected update(dt: number) {
        // Clear previous batch
        this._batchedEntries.length = 0;

        // Rate limit reset
        this._secondTimer += dt;
        if (this._secondTimer >= 1.0) {
            this._requestsThisSecond = 0;
            this._secondTimer = 0;
        }

        // Fixed timestep for gradual spawning
        this._fixedTimeAccumulator += dt;
        while (this._fixedTimeAccumulator >= this.FIXED_TIMESTEP) {
            this._simulatedFixedTime += this.FIXED_TIMESTEP;
            this.processActiveRequests();
            this._fixedTimeAccumulator -= this.FIXED_TIMESTEP;
        }

        this.processSpawnQueue();
        this.scheduleBatchedJob();
    }

    public requestSpawn(request: SpawnRequest) {
        if (this._requestsThisSecond >= this.maxRequestsPerFrame) return;
        
        this._requestsThisSecond++;
        // Limit queue size if needed
        if (this._spawnQueue.length < 100) {
            this._spawnQueue.push(request);
        }
    }

    private processSpawnQueue() {
        if (!this._mainParticleDrawSystem || this._spawnQueue.length === 0) return;

        if (this._isMobilePlatform && this.mobileSpawnCooldown > 1) {
            this._framesSinceLastSpawn++;
            if (this._framesSinceLastSpawn < this.mobileSpawnCooldown) return;
            this._framesSinceLastSpawn = 0;
        }

        this._frameSpawnRequests.length = 0;
        let processedCount = 0;

        while (this._spawnQueue.length > 0 && processedCount < this.maxSpawnRequestsPerFrame) {
            const request = this._spawnQueue.shift(); // Dequeue
            if (!request) break;

            if (request.particleSpawnDelay === 0) {
                this._frameSpawnRequests.push(request);
            } else {
                if (this._activeRequests.length < 1000) { // MAX_ACTIVE_REQUESTS
                    this._activeRequests.push({
                        request: request,
                        particlesRemaining: request.count,
                        nextSpawnTime: this._simulatedFixedTime,
                        baseSeed: Date.now() + this._seedCounter++ * 1000000
                    });
                }
            }
            processedCount++;
        }

        if (this._frameSpawnRequests.length > 0) {
            this.addInstantSpawnsToBatch();
        }
    }

    private processActiveRequests() {
        if (!this._mainParticleDrawSystem || this._activeRequests.length === 0) return;

        const currentTime = this._simulatedFixedTime;

        // Iterate backwards to remove items safely
        for (let i = this._activeRequests.length - 1; i >= 0; i--) {
            const activeReq = this._activeRequests[i];
            
            if (currentTime < activeReq.nextSpawnTime) continue;

            const delay = activeReq.request.particleSpawnDelay;
            const elapsedTime = currentTime - activeReq.nextSpawnTime;
            let particlesToSpawn = 1 + Math.floor(elapsedTime / delay);
            
            const maxPerStep = this._isMobilePlatform ? 10 : 50;
            particlesToSpawn = Math.min(particlesToSpawn, maxPerStep);
            particlesToSpawn = Math.min(particlesToSpawn, activeReq.particlesRemaining);

            if (particlesToSpawn > 0) {
                this.addGradualSpawnsToBatch(activeReq.request, particlesToSpawn, activeReq.baseSeed + activeReq.particlesRemaining);
                activeReq.particlesRemaining -= particlesToSpawn;
                activeReq.nextSpawnTime += delay * particlesToSpawn;
            }

            if (activeReq.particlesRemaining <= 0) {
                // Remove at index
                this._activeRequests.splice(i, 1);
            }
        }
    }

    private addInstantSpawnsToBatch() {
        for (const request of this._frameSpawnRequests) {
            let count = Math.min(request.count, this._mainParticleDrawSystem!.particleCount);
            count = Math.min(count, this.maxParticlesPerFrame);

            if (this._isMobilePlatform) {
                count = Math.min(count, 50);
            }

            const r = request.color.r / 255 * request.intensity;
            const g = request.color.g / 255 * request.intensity;
            const b = request.color.b / 255 * request.intensity;
            const colorIntensity = new Vec4(r, g, b, 1.0);

            for (let i = 0; i < count; i++) {
                this._batchedEntries.push({
                    basePosition: new Vec3(request.position.x, request.position.y, 0),
                    colorIntensity: colorIntensity,
                    radius: request.radius,
                    minRadius: request.minRadius,
                    coneAngle: request.coneAngle,
                    direction: new Vec2(request.direction.x, request.direction.y),
                    angleJitter: request.angleJitter,
                    speedMin: request.speedMin,
                    speedMax: request.speedMax,
                    lifeMin: request.lifeMin,
                    lifeMax: request.lifeMax,
                    lengthMin: request.lengthMin,
                    lengthMax: request.lengthMax,
                    thicknessMin: request.thicknessMin,
                    thicknessMax: request.thicknessMax,
                    scaleDelayMin: request.scaleDelayMin,
                    scaleDelayMax: request.scaleDelayMax,
                    scaleSpeedMin: request.scaleSpeedMin,
                    scaleSpeedMax: request.scaleSpeedMax,
                    pulseFreqMin: request.pulseFreqMin,
                    pulseFreqMax: request.pulseFreqMax,
                    pulseStrengthMin: request.pulseStrengthMin,
                    pulseStrengthMax: request.pulseStrengthMax,
                    gravityScale: request.gravityScale,
                    moveDelayMin: request.moveDelayMin,
                    moveDelayMax: request.moveDelayMax,
                    randomSeed: Date.now() + this._seedCounter++ * 1000000 + i * 12345
                });
            }
        }
    }

    private addGradualSpawnsToBatch(request: SpawnRequest, count: number, baseSeed: number) {
        const r = request.color.r / 255 * request.intensity;
        const g = request.color.g / 255 * request.intensity;
        const b = request.color.b / 255 * request.intensity;
        const colorIntensity = new Vec4(r, g, b, 1.0);

        for (let i = 0; i < count; i++) {
            this._batchedEntries.push({
                basePosition: new Vec3(request.position.x, request.position.y, 0),
                colorIntensity: colorIntensity,
                radius: request.radius,
                minRadius: request.minRadius,
                coneAngle: request.coneAngle,
                direction: new Vec2(request.direction.x, request.direction.y),
                angleJitter: request.angleJitter,
                speedMin: request.speedMin,
                speedMax: request.speedMax,
                lifeMin: request.lifeMin,
                lifeMax: request.lifeMax,
                lengthMin: request.lengthMin,
                lengthMax: request.lengthMax,
                thicknessMin: request.thicknessMin,
                thicknessMax: request.thicknessMax,
                scaleDelayMin: request.scaleDelayMin,
                scaleDelayMax: request.scaleDelayMax,
                scaleSpeedMin: request.scaleSpeedMin,
                scaleSpeedMax: request.scaleSpeedMax,
                pulseFreqMin: request.pulseFreqMin,
                pulseFreqMax: request.pulseFreqMax,
                pulseStrengthMin: request.pulseStrengthMin,
                pulseStrengthMax: request.pulseStrengthMax,
                gravityScale: request.gravityScale,
                moveDelayMin: request.moveDelayMin,
                moveDelayMax: request.moveDelayMax,
                randomSeed: baseSeed + i * 12345
            });
        }
    }

    private scheduleBatchedJob() {
        const totalParticles = this._batchedEntries.length;
        if (totalParticles === 0 || !this._mainParticleDrawSystem) return;

        if (this._batchedParticleOutput.length < totalParticles) {
            this._batchedParticleOutput = new Array(totalParticles);
        }

        for (let i = 0; i < totalParticles; i++) {
            const entry = this._batchedEntries[i];
            const random = new SeededRandom(entry.randomSeed);

            let ang: number;
            const centerAngle = Math.atan2(entry.direction.y, entry.direction.x);
            const halfCone = math.toRadian(entry.coneAngle * 0.5);

            if (entry.coneAngle >= 360 - 0.001) {
                ang = random.nextFloat(0, Math.PI * 2);
            } else {
                const aMin = centerAngle - halfCone;
                const aMax = centerAngle + halfCone;
                ang = random.nextFloat(aMin, aMax);
                if (entry.angleJitter > 0) {
                    ang += random.nextFloat(-entry.angleJitter, entry.angleJitter) * math.toRadian(1);
                }
            }

            const dirX = Math.cos(ang);
            const dirY = Math.sin(ang);
            const u = random.nextFloat();
            const rad = math.lerp(entry.minRadius, entry.radius, u);
            const posX = entry.basePosition.x + dirX * rad;
            let posY = entry.basePosition.y + dirY * rad;

            const speed = random.nextFloat(entry.speedMin, entry.speedMax);
            const length = random.nextFloat(entry.lengthMin, entry.lengthMax);
            const thickness = random.nextFloat(entry.thicknessMin, entry.thicknessMax);
            const life = random.nextFloat(entry.lifeMin, entry.lifeMax);
            const scaleDelay = random.nextFloat(entry.scaleDelayMin, entry.scaleDelayMax);
            const scaleSpeed = random.nextFloat(entry.scaleSpeedMin, entry.scaleSpeedMax);
            const phase = random.nextFloat(0, Math.PI * 2);
            const frequency = random.nextFloat(entry.pulseFreqMin, entry.pulseFreqMax);
            const pulseStrength = random.nextFloat(entry.pulseStrengthMin, entry.pulseStrengthMax);
            const moveDelay = random.nextFloat(entry.moveDelayMin, entry.moveDelayMax);

            this._batchedParticleOutput[i] = {
                pos_size: new Vec4(posX, posY, 0, length),
                vel_life: new Vec4(dirX * speed, dirY * speed, 0, life),
                extra: new Vec4(thickness, moveDelay, scaleSpeed, scaleDelay),
                color: new Vec4(entry.colorIntensity.x, entry.colorIntensity.y, entry.colorIntensity.z, life),
                misc: new Vec4(phase, frequency, pulseStrength, entry.gravityScale)
            };
        }

        this.writeBatchedParticles(totalParticles);
    }

    private writeBatchedParticles(count: number) {
        this.writeParticlesToBuffer(this._batchedParticleOutput, count);
    }

    private writeParticlesToBuffer(particles: Particle[], count: number) {
        if (!this._mainParticleDrawSystem) return;

        const startIndex = this._mainParticleDrawSystem.nextSpawnIndex;
        const particleCount = this._mainParticleDrawSystem.particleCount;
        const first = Math.min(count, particleCount - startIndex);

        // Helper function if possible, or direct access
        this._mainParticleDrawSystem.writeParticleData(particles, startIndex, first);

        if (first < count) {
            const remaining = count - first;
            // Create a temporary slice for the wrap-around part
            const remainingParticles = particles.slice(first, first + remaining);
            this._mainParticleDrawSystem.writeParticleData(remainingParticles, 0, remaining);
            this._mainParticleDrawSystem.nextSpawnIndex = remaining;
        } else {
            this._mainParticleDrawSystem.nextSpawnIndex = (startIndex + count) % particleCount;
        }
    }

    public setMainParticleSystem(system: IParticleDrawSystem) {
        this._mainParticleDrawSystem = system;
    }
}
