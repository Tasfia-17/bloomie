"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { GardenState, TimeOfDay } from "@/lib/types";

type Props = {
  gardenState: GardenState;
  timeOfDay: TimeOfDay;
};

const SKY_COLORS: Record<string, Record<TimeOfDay, string>> = {
  clear: { day: "#87CEEB", sunset: "#FF8C69", night: "#0D1B2A" },
  cloudy: { day: "#9FB8C8", sunset: "#C4756B", night: "#1A2A3E" },
  stormy: { day: "#6B7B8A", sunset: "#8B5E5E", night: "#0A1420" },
  sunset: { day: "#87CEEB", sunset: "#FF6B6B", night: "#0D1B2A" },
  night: { day: "#87CEEB", sunset: "#FF8C69", night: "#080E1C" },
};

export function GardenScene3D({ gardenState, timeOfDay }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animIdRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const skyColors = SKY_COLORS[gardenState.sky] || SKY_COLORS.clear;
    const bgColor = skyColors[timeOfDay];

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(bgColor);
    scene.fog = new THREE.FogExp2(bgColor, 0.025);

    const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 120);
    camera.position.set(7, 4.5, 7);
    camera.lookAt(0, 0.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = timeOfDay === "night" ? 0.6 : 1.3;
    container.appendChild(renderer.domElement);

    // === LIGHTING ===
    const ambI = timeOfDay === "night" ? 0.15 : timeOfDay === "sunset" ? 0.45 : 0.55;
    const ambC = timeOfDay === "night" ? "#334477" : timeOfDay === "sunset" ? "#FFD4A8" : "#FFFAF0";
    scene.add(new THREE.AmbientLight(ambC, ambI));

    const sunC = timeOfDay === "night" ? "#6688BB" : timeOfDay === "sunset" ? "#FF7744" : "#FFE8C4";
    const sunI = timeOfDay === "night" ? 0.25 : timeOfDay === "sunset" ? 1.0 : 1.3;
    const sun = new THREE.DirectionalLight(sunC, sunI);
    sun.position.set(timeOfDay === "sunset" ? -2 : 5, 8, 3);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.far = 30;
    sun.shadow.camera.left = -10;
    sun.shadow.camera.right = 10;
    sun.shadow.camera.top = 10;
    sun.shadow.camera.bottom = -10;
    scene.add(sun);

    if (timeOfDay === "sunset") {
      const rimLight = new THREE.DirectionalLight("#FF4400", 0.3);
      rimLight.position.set(-5, 2, -3);
      scene.add(rimLight);
    }

    // === FLOATING ISLAND ===
    const island = new THREE.Group();

    // Ground layers
    const groundGeo = new THREE.CylinderGeometry(4.5, 4, 0.8, 48);
    const groundMat = new THREE.MeshStandardMaterial({ color: "#4A7A48", roughness: 0.85 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.4;
    ground.receiveShadow = true;
    island.add(ground);

    // Grass surface
    const grassGeo = new THREE.CylinderGeometry(4.5, 4.5, 0.08, 48);
    const grassMat = new THREE.MeshStandardMaterial({ color: "#6CB86A", roughness: 0.9 });
    const grass = new THREE.Mesh(grassGeo, grassMat);
    grass.position.y = 0.04;
    grass.receiveShadow = true;
    island.add(grass);

    // Earth/dirt underneath (organic shape)
    const dirtGeo = new THREE.ConeGeometry(3.5, 5, 24);
    const dirtMat = new THREE.MeshStandardMaterial({ color: "#7B5B2A", roughness: 1 });
    const dirt = new THREE.Mesh(dirtGeo, dirtMat);
    dirt.position.y = -3.3;
    dirt.rotation.x = Math.PI;
    island.add(dirt);

    // Rocks on the edge
    const rockMat = new THREE.MeshStandardMaterial({ color: "#8A8A7A", roughness: 0.9 });
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + 0.3;
      const r = 3.8 + Math.random() * 0.5;
      const rockGeo = new THREE.SphereGeometry(0.15 + Math.random() * 0.15, 6, 5);
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(Math.cos(angle) * r, 0.1, Math.sin(angle) * r);
      rock.scale.y = 0.6;
      island.add(rock);
    }

    // === MAIN TREE ===
    const treeH = 2.5 + gardenState.tree_growth * 2.5;
    const trunkGeo = new THREE.CylinderGeometry(0.12, 0.28, treeH, 10);
    const trunkMat = new THREE.MeshStandardMaterial({ color: "#5A3518" });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(0, treeH / 2 + 0.05, 0);
    trunk.castShadow = true;
    island.add(trunk);

    // Branches
    for (let i = 0; i < 3; i++) {
      const bAngle = (i / 3) * Math.PI * 2 + 0.5;
      const bLen = 0.5 + gardenState.tree_growth * 0.5;
      const bGeo = new THREE.CylinderGeometry(0.03, 0.06, bLen, 6);
      const branch = new THREE.Mesh(bGeo, trunkMat);
      branch.position.set(Math.cos(bAngle) * 0.2, treeH * 0.7, Math.sin(bAngle) * 0.2);
      branch.rotation.z = Math.cos(bAngle) * 0.6;
      branch.rotation.x = Math.sin(bAngle) * 0.4;
      island.add(branch);
    }

    // Canopy (lush, multiple spheres)
    const canopySize = 1.0 + gardenState.tree_growth * 1.5;
    const canopyN = Math.floor(5 + gardenState.tree_growth * 6);
    const canopyC = timeOfDay === "night" ? "#1E4D2B" : timeOfDay === "sunset" ? "#3A7A3A" : "#4A9A4A";
    const canopyMat = new THREE.MeshStandardMaterial({ color: canopyC, roughness: 0.75 });

    for (let i = 0; i < canopyN; i++) {
      const a = (i / canopyN) * Math.PI * 2;
      const r = canopySize * (0.3 + Math.random() * 0.4);
      const s = canopySize * (0.35 + Math.random() * 0.35);
      const geo = new THREE.SphereGeometry(s, 10, 8);
      const c = new THREE.Mesh(geo, canopyMat);
      c.position.set(Math.cos(a) * r * 0.6, treeH + 0.3 + Math.random() * 0.6, Math.sin(a) * r * 0.6);
      c.castShadow = true;
      island.add(c);
    }

    // === FLOWERS ===
    const flowerColors = ["#F4A7BB", "#C4B1D4", "#F5E6A3", "#FFDAB9", "#B5E8D5", "#FF8A80", "#CE93D8", "#80DEEA"];
    const flowerN = Math.floor(10 + gardenState.flower_bloom * 18);
    const flowers: THREE.Mesh[] = [];
    for (let i = 0; i < flowerN; i++) {
      const a = (i / flowerN) * Math.PI * 2 + Math.random() * 0.6;
      const r = 1.5 + Math.random() * 2.5;
      const size = 0.05 + gardenState.flower_bloom * 0.06;
      const fGeo = new THREE.SphereGeometry(size, 8, 6);
      const color = flowerColors[i % flowerColors.length];
      const fMat = new THREE.MeshStandardMaterial({
        color,
        emissive: timeOfDay === "night" ? color : "#000",
        emissiveIntensity: timeOfDay === "night" ? 0.3 : 0,
      });
      const flower = new THREE.Mesh(fGeo, fMat);
      flower.position.set(Math.cos(a) * r, 0.12 + Math.random() * 0.08, Math.sin(a) * r);
      island.add(flower);
      flowers.push(flower);

      // Stem
      const sGeo = new THREE.CylinderGeometry(0.008, 0.01, 0.15 + Math.random() * 0.1, 4);
      const sMat = new THREE.MeshStandardMaterial({ color: "#4A8A48" });
      const stem = new THREE.Mesh(sGeo, sMat);
      stem.position.set(flower.position.x, flower.position.y - 0.08, flower.position.z);
      island.add(stem);
    }

    // === POND ===
    const pondR = 0.7 + gardenState.pond_level * 0.5;
    const pondC = timeOfDay === "night" ? "#1A3A5A" : "#4AAFCC";
    const pondGeo = new THREE.CircleGeometry(pondR, 32);
    const pondMat = new THREE.MeshStandardMaterial({
      color: pondC,
      transparent: true,
      opacity: 0.55 + gardenState.pond_level * 0.35,
      roughness: 0.05,
      metalness: 0.4,
    });
    const pond = new THREE.Mesh(pondGeo, pondMat);
    pond.rotation.x = -Math.PI / 2;
    pond.position.set(2.8, 0.08, 1.8);
    island.add(pond);

    // Lily pads
    for (let i = 0; i < 5; i++) {
      const lGeo = new THREE.CircleGeometry(0.08 + Math.random() * 0.05, 8);
      const lMat = new THREE.MeshStandardMaterial({ color: "#4A8A48", side: THREE.DoubleSide });
      const lily = new THREE.Mesh(lGeo, lMat);
      lily.rotation.x = -Math.PI / 2;
      lily.position.set(2.8 + (Math.random() - 0.5) * pondR * 1.5, 0.09, 1.8 + (Math.random() - 0.5) * pondR * 1.3);
      island.add(lily);
    }

    // === COTTAGE ===
    const cottageMat = new THREE.MeshStandardMaterial({ color: "#FFF5E6" });
    const cottageBody = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.7), cottageMat);
    cottageBody.position.set(-2.2, 0.45, -2.0);
    cottageBody.castShadow = true;
    island.add(cottageBody);

    const roofMat = new THREE.MeshStandardMaterial({ color: "#C05040" });
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.5, 4), roofMat);
    roof.position.set(-2.2, 1.0, -2.0);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    island.add(roof);

    // Door
    const door = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.3), new THREE.MeshStandardMaterial({ color: "#5A3518" }));
    door.position.set(-2.2, 0.28, -1.65);
    island.add(door);

    // Windows (glowing at night)
    const windowMat = new THREE.MeshStandardMaterial({
      color: "#F5E6A3",
      emissive: "#F5E6A3",
      emissiveIntensity: timeOfDay === "night" ? 1.0 : 0.1,
    });
    for (const xOff of [-0.2, 0.2]) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.12), windowMat);
      win.position.set(-2.2 + xOff, 0.55, -1.65);
      island.add(win);
    }

    // === CAMPFIRE ===
    const fireBase = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.08, 8), new THREE.MeshStandardMaterial({ color: "#3A2A1A" }));
    fireBase.position.set(2.2, 0.12, -2.0);
    island.add(fireBase);

    // Log ring
    for (let i = 0; i < 6; i++) {
      const la = (i / 6) * Math.PI * 2;
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 4), new THREE.MeshStandardMaterial({ color: "#5A3518" }));
      log.position.set(2.2 + Math.cos(la) * 0.15, 0.18, -2.0 + Math.sin(la) * 0.15);
      log.rotation.z = Math.PI / 2;
      log.rotation.y = la;
      island.add(log);
    }

    const fireCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.1, 0.4, 6),
      new THREE.MeshStandardMaterial({ color: "#FF6B2B", emissive: "#FF4500", emissiveIntensity: timeOfDay === "night" ? 1.5 : 0.8 })
    );
    fireCone.position.set(2.2, 0.38, -2.0);
    island.add(fireCone);

    const fireLight = new THREE.PointLight("#FF6B2B", timeOfDay === "night" ? 2.0 : 0.6, 5);
    fireLight.position.set(2.2, 0.6, -2.0);
    island.add(fireLight);

    // === BENCH ===
    const benchMat = new THREE.MeshStandardMaterial({ color: "#7A5A28" });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.3), benchMat);
    seat.position.set(-2.8, 0.4, 1.0);
    seat.castShadow = true;
    island.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, 0.04), benchMat);
    back.position.set(-2.8, 0.6, 0.85);
    island.add(back);

    // === PATH (stone path) ===
    const pathMat = new THREE.MeshStandardMaterial({ color: "#C8B89A", roughness: 0.95 });
    for (let i = 0; i < 8; i++) {
      const t = i / 7;
      const px = THREE.MathUtils.lerp(0, 2.2, t) + (Math.random() - 0.5) * 0.2;
      const pz = THREE.MathUtils.lerp(0, -2.0, t) + (Math.random() - 0.5) * 0.2;
      const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.12 + Math.random() * 0.06, 0.14, 0.04, 6), pathMat);
      stone.position.set(px, 0.07, pz);
      stone.rotation.y = Math.random() * Math.PI;
      island.add(stone);
    }

    // === RABBITS ===
    const rabbitMat = new THREE.MeshStandardMaterial({ color: "#F5F0E8" });
    const rabbitMeshes: THREE.Group[] = [];
    const rabbitPos = [{ x: 1.2, z: 0.6 }, { x: -0.8, z: 1.8 }, { x: 0.3, z: -1.2 }];
    rabbitPos.forEach(({ x, z }) => {
      const rg = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), rabbitMat);
      body.position.y = 0.18;
      rg.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), rabbitMat);
      head.position.y = 0.32;
      rg.add(head);
      for (const ex of [-0.03, 0.03]) {
        const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.1, 4, 4), rabbitMat);
        ear.position.set(ex, 0.44, 0);
        rg.add(ear);
      }
      // Tail
      const tail = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), rabbitMat);
      tail.position.set(0, 0.15, -0.1);
      rg.add(tail);
      rg.position.set(x, 0, z);
      island.add(rg);
      rabbitMeshes.push(rg);
    });

    scene.add(island);

    // === BUTTERFLIES ===
    const bColors = [0xC4B1D4, 0xF4A7BB, 0xB8D8E8, 0xF5E6A3, 0xB5E8D5, 0xFFDAB9, 0xFF8A80, 0xCE93D8];
    const butterflies: THREE.Mesh[] = [];
    for (let i = 0; i < gardenState.butterfly_count; i++) {
      const wGeo = new THREE.PlaneGeometry(0.09, 0.06);
      const wMat = new THREE.MeshStandardMaterial({ color: bColors[i % bColors.length], side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
      const b = new THREE.Mesh(wGeo, wMat);
      b.position.set((Math.random() - 0.5) * 7, 1.5 + Math.random() * 3.5, (Math.random() - 0.5) * 7);
      scene.add(b);
      butterflies.push(b);
    }

    // === BIRDS ===
    const birdMeshes: THREE.Group[] = [];
    for (let i = 0; i < gardenState.bird_count; i++) {
      const bird = new THREE.Group();
      const bdy = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? "#4A6B8A" : "#AA6633" }));
      bird.add(bdy);
      const wg = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.03), new THREE.MeshStandardMaterial({ color: "#6B8CAA", side: THREE.DoubleSide }));
      wg.position.x = -0.06;
      bird.add(wg);
      const wg2 = wg.clone();
      wg2.position.x = 0.06;
      bird.add(wg2);
      bird.position.set((Math.random() - 0.5) * 10, 4 + Math.random() * 2.5, (Math.random() - 0.5) * 10);
      scene.add(bird);
      birdMeshes.push(bird);
    }

    // === FIREFLIES ===
    const fireflyMeshes: THREE.Mesh[] = [];
    const ffCount = timeOfDay === "night" ? Math.max(gardenState.firefly_count, 12) : gardenState.firefly_count;
    if (ffCount > 0) {
      for (let i = 0; i < ffCount; i++) {
        const ff = new THREE.Mesh(
          new THREE.SphereGeometry(0.02, 6, 4),
          new THREE.MeshStandardMaterial({ color: "#F5E6A3", emissive: "#F5E6A3", emissiveIntensity: 2.5 })
        );
        ff.position.set((Math.random() - 0.5) * 7, 0.4 + Math.random() * 3.5, (Math.random() - 0.5) * 7);
        scene.add(ff);
        fireflyMeshes.push(ff);
      }
    }

    // === CLOUDS ===
    const cloudGroups: THREE.Group[] = [];
    if (gardenState.sky === "cloudy" || gardenState.sky === "stormy" || timeOfDay === "day") {
      const cloudN = gardenState.sky === "stormy" ? 10 : gardenState.sky === "cloudy" ? 6 : 3;
      const cloudC = gardenState.sky === "stormy" ? "#555" : timeOfDay === "sunset" ? "#FFD4A8" : "#FFFFFF";
      const cloudMat2 = new THREE.MeshStandardMaterial({ color: cloudC, transparent: true, opacity: 0.5 });
      for (let i = 0; i < cloudN; i++) {
        const cg = new THREE.Group();
        for (let j = 0; j < 4; j++) {
          const cGeo = new THREE.SphereGeometry(0.4 + Math.random() * 0.4, 8, 6);
          const cp = new THREE.Mesh(cGeo, cloudMat2);
          cp.position.set(j * 0.35 - 0.5, Math.random() * 0.15, Math.random() * 0.2);
          cg.add(cp);
        }
        cg.position.set((Math.random() - 0.5) * 18, 6 + Math.random() * 3, -4 - Math.random() * 12);
        scene.add(cg);
        cloudGroups.push(cg);
      }
    }

    // === STARS (night only) ===
    if (timeOfDay === "night") {
      const starsGeo = new THREE.BufferGeometry();
      const starPositions = new Float32Array(300 * 3);
      for (let i = 0; i < 300; i++) {
        starPositions[i * 3] = (Math.random() - 0.5) * 60;
        starPositions[i * 3 + 1] = 10 + Math.random() * 30;
        starPositions[i * 3 + 2] = (Math.random() - 0.5) * 60;
      }
      starsGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
      const starsMat = new THREE.PointsMaterial({ color: "#FFFFFF", size: 0.08, sizeAttenuation: true });
      scene.add(new THREE.Points(starsGeo, starsMat));
    }

    // === MOON (night) ===
    if (timeOfDay === "night") {
      const moonGeo = new THREE.SphereGeometry(0.8, 16, 16);
      const moonMat = new THREE.MeshStandardMaterial({ color: "#FFFFEE", emissive: "#FFFFCC", emissiveIntensity: 0.5 });
      const moon = new THREE.Mesh(moonGeo, moonMat);
      moon.position.set(-8, 12, -10);
      scene.add(moon);

      const moonLight = new THREE.PointLight("#AABBFF", 0.3, 30);
      moonLight.position.copy(moon.position);
      scene.add(moonLight);
    }

    // === ANIMATION ===
    let time = 0;
    const animate = () => {
      time += 0.004;

      // Camera orbit
      camera.position.x = 7 * Math.cos(time * 0.15);
      camera.position.z = 7 * Math.sin(time * 0.15);
      camera.position.y = 4 + Math.sin(time * 0.8) * 0.4;
      camera.lookAt(0, 0.8, 0);

      // Island float
      island.position.y = Math.sin(time * 1.2) * 0.06;

      // Flowers sway
      flowers.forEach((f, i) => {
        f.position.y = 0.12 + Math.sin(time * 2 + i) * 0.02;
      });

      // Butterflies
      butterflies.forEach((b, i) => {
        b.position.x += Math.sin(time * 2.5 + i * 2.2) * 0.005;
        b.position.y += Math.cos(time * 3.5 + i) * 0.003;
        b.position.z += Math.cos(time * 2 + i * 1.7) * 0.004;
        b.rotation.z = Math.sin(time * 7 + i) * 0.6;
        // Keep in bounds
        if (Math.abs(b.position.x) > 6) b.position.x *= 0.99;
        if (Math.abs(b.position.z) > 6) b.position.z *= 0.99;
      });

      // Birds
      birdMeshes.forEach((bird, i) => {
        const r = 5 + i * 1.2;
        bird.position.x = Math.cos(time * 0.5 + i * 1.3) * r;
        bird.position.z = Math.sin(time * 0.5 + i * 1.3) * r;
        bird.position.y = 3.5 + Math.sin(time * 1.5 + i) * 0.5;
        bird.rotation.y = Math.atan2(-Math.sin(time * 0.5 + i * 1.3), Math.cos(time * 0.5 + i * 1.3));
      });

      // Fireflies
      fireflyMeshes.forEach((ff, i) => {
        ff.position.x += Math.sin(time * 1.5 + i * 3.3) * 0.004;
        ff.position.y += Math.cos(time * 2.5 + i * 2.1) * 0.003;
        ff.position.z += Math.sin(time * 1.2 + i * 4.1) * 0.004;
        const mat = ff.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 1.5 + Math.sin(time * 4 + i * 2.5) * 1.5;
      });

      // Campfire
      fireCone.scale.y = 1 + Math.sin(time * 12) * 0.25;
      fireCone.scale.x = 1 + Math.cos(time * 10) * 0.15;
      fireLight.intensity = (timeOfDay === "night" ? 1.5 : 0.5) + Math.sin(time * 8) * 0.4;

      // Rabbits
      rabbitMeshes.forEach((r, i) => {
        r.position.y = Math.abs(Math.sin(time * 1.5 + i * 2.5)) * 0.04;
        r.rotation.y = Math.sin(time * 0.3 + i) * 0.2;
      });

      // Clouds drift
      cloudGroups.forEach((c, i) => {
        c.position.x += 0.003 * (i % 2 === 0 ? 1 : -1);
        if (c.position.x > 15) c.position.x = -15;
        if (c.position.x < -15) c.position.x = 15;
      });

      renderer.render(scene, camera);
      animIdRef.current = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animIdRef.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [gardenState, timeOfDay]);

  return <div ref={containerRef} className="scene-canvas" />;
}
