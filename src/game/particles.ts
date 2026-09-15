import * as THREE from 'three';

export class ParticleManager {
  private scene: THREE.Scene;
  private smokeParticles: { mesh: THREE.Mesh; life: number; maxLife: number; velocity: THREE.Vector3 }[] = [];
  private smokeMaterial: THREE.MeshBasicMaterial;
  private smokeGeometry: THREE.SphereGeometry;

  // Skidmarks
  private skidmarks: { mesh: THREE.Mesh; life: number }[] = [];
  private skidMaterial: THREE.MeshBasicMaterial;
  private skidGeometry: THREE.PlaneGeometry;
  private lastSkidPosL: THREE.Vector3 | null = null;
  private lastSkidPosR: THREE.Vector3 | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.smokeGeometry = new THREE.SphereGeometry(0.45, 6, 6);
    this.smokeMaterial = new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.4,
    });

    this.skidGeometry = new THREE.PlaneGeometry(0.32, 1.2);
    this.skidGeometry.rotateX(-Math.PI / 2);
    this.skidMaterial = new THREE.MeshBasicMaterial({
      color: 0x111827,
      transparent: true,
      opacity: 0.65,
    });
  }

  public emitDriftSmoke(posL: THREE.Vector3, posR: THREE.Vector3, intensity = 1.0) {
    if (this.smokeParticles.length > 80) return; // Limit particles for smooth 60fps

    const emit = (pos: THREE.Vector3) => {
      const mesh = new THREE.Mesh(this.smokeGeometry, this.smokeMaterial.clone());
      mesh.position.copy(pos);
      mesh.position.y += 0.2;
      mesh.scale.setScalar(0.4 + Math.random() * 0.4);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        0.8 + Math.random() * 0.8,
        (Math.random() - 0.5) * 1.5
      );

      this.scene.add(mesh);
      this.smokeParticles.push({
        mesh,
        life: 0,
        maxLife: 0.8 + Math.random() * 0.4,
        velocity,
      });
    };

    if (Math.random() < 0.6 * intensity) emit(posL);
    if (Math.random() < 0.6 * intensity) emit(posR);
  }

  public addSkidmarks(posL: THREE.Vector3, posR: THREE.Vector3, heading: number) {
    // Only drop skidmark if moved enough distance
    if (!this.lastSkidPosL || this.lastSkidPosL.distanceTo(posL) > 1.2) {
      this.lastSkidPosL = posL.clone();
      this.lastSkidPosR = posR.clone();

      const dropMark = (pos: THREE.Vector3) => {
        const mark = new THREE.Mesh(this.skidGeometry, this.skidMaterial);
        mark.position.set(pos.x, 0.055, pos.z);
        mark.rotation.y = heading;
        this.scene.add(mark);
        this.skidmarks.push({ mesh: mark, life: 0 });
      };

      dropMark(posL);
      dropMark(posR);

      // Limit skidmark count
      if (this.skidmarks.length > 160) {
        const oldest = this.skidmarks.shift();
        if (oldest) this.scene.remove(oldest.mesh);
      }
    }
  }

  public update(delta: number) {
    // Update smoke particles
    for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
      const p = this.smokeParticles[i];
      p.life += delta;
      p.mesh.position.addScaledVector(p.velocity, delta);
      p.mesh.scale.multiplyScalar(1.0 + delta * 1.5);

      const progress = p.life / p.maxLife;
      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - progress) * 0.35;

      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        this.smokeParticles.splice(i, 1);
      }
    }

    // Fade skidmarks slowly
    for (let i = this.skidmarks.length - 1; i >= 0; i--) {
      const s = this.skidmarks[i];
      s.life += delta;
      if (s.life > 18) {
        this.scene.remove(s.mesh);
        this.skidmarks.splice(i, 1);
      }
    }
  }

  public clear() {
    for (const p of this.smokeParticles) {
      this.scene.remove(p.mesh);
    }
    this.smokeParticles = [];

    for (const s of this.skidmarks) {
      this.scene.remove(s.mesh);
    }
    this.skidmarks = [];
  }
}
