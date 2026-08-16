"use client";

import { useEffect, useRef, MutableRefObject } from "react";
import * as THREE from "three";

type FlyTarget = "garden" | "today" | "insights" | "nest";
type FlyToFn = (target: FlyTarget) => Promise<void>;

type Props = {
  flyToRef?: MutableRefObject<FlyToFn | null>;
};

export function LandingScene3D({ flyToRef }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    animationId: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#B8D8E8");
    scene.fog = new THREE.Fog("#B8D8E8", 15, 40);

    const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(8, 5, 8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight("#FFF8F0", 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight("#FFE4C4", 1.2);
    sunLight.position.set(5, 8, 3);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(1024, 1024);
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 25;
    sunLight.shadow.camera.left = -8;
    sunLight.shadow.camera.right = 8;
    sunLight.shadow.camera.top = 8;
    sunLight.shadow.camera.bottom = -8;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight("#B8D8E8", 0.4);
    fillLight.position.set(-3, 4, -2);
    scene.add(fillLight);

    // === FLOATING ISLAND ===
    const islandGroup = new THREE.Group();

    // Island body (soft rounded shape)
    const islandGeo = new THREE.SphereGeometry(3.5, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const islandMat = new THREE.MeshStandardMaterial({ color: "#5B8C5A", roughness: 0.8 });
    const island = new THREE.Mesh(islandGeo, islandMat);
    island.receiveShadow = true;
    islandGroup.add(island);

    // Grass layer on top
    const grassGeo = new THREE.CylinderGeometry(3.4, 3.5, 0.3, 32);
    const grassMat = new THREE.MeshStandardMaterial({ color: "#7AB87A", roughness: 0.9 });
    const grass = new THREE.Mesh(grassGeo, grassMat);
    grass.position.y = 0.15;
    grass.receiveShadow = true;
    islandGroup.add(grass);

    // Dirt underneath
    const dirtGeo = new THREE.ConeGeometry(2.5, 3, 16);
    const dirtMat = new THREE.MeshStandardMaterial({ color: "#8B6914", roughness: 1 });
    const dirt = new THREE.Mesh(dirtGeo, dirtMat);
    dirt.position.y = -2;
    dirt.rotation.x = Math.PI;
    islandGroup.add(dirt);

    // === TREE (Big main tree) ===
    const treeTrunkGeo = new THREE.CylinderGeometry(0.15, 0.25, 2.5, 8);
    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: "#6B4226" });
    const treeTrunk = new THREE.Mesh(treeTrunkGeo, treeTrunkMat);
    treeTrunk.position.set(-0.5, 1.6, -0.3);
    treeTrunk.castShadow = true;
    islandGroup.add(treeTrunk);

    // Tree canopy (multiple spheres for organic look)
    const canopyMat = new THREE.MeshStandardMaterial({ color: "#4A8C4A", roughness: 0.8 });
    const canopyPositions = [
      { x: -0.5, y: 3.2, z: -0.3, r: 1.0 },
      { x: -0.9, y: 3.0, z: 0.0, r: 0.7 },
      { x: -0.1, y: 3.4, z: -0.6, r: 0.6 },
      { x: -0.7, y: 3.6, z: -0.5, r: 0.5 },
    ];
    canopyPositions.forEach(({ x, y, z, r }) => {
      const canopyGeo = new THREE.SphereGeometry(r, 12, 8);
      const canopy = new THREE.Mesh(canopyGeo, canopyMat);
      canopy.position.set(x, y, z);
      canopy.castShadow = true;
      islandGroup.add(canopy);
    });

    // === FLOWERS ===
    const flowerColors = ["#F4A7BB", "#C4B1D4", "#F5E6A3", "#FFDAB9", "#B5E8D5"];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const radius = 1.2 + Math.random() * 1.5;
      const flowerGeo = new THREE.SphereGeometry(0.08 + Math.random() * 0.05, 8, 6);
      const flowerMat = new THREE.MeshStandardMaterial({ color: flowerColors[i % flowerColors.length] });
      const flower = new THREE.Mesh(flowerGeo, flowerMat);
      flower.position.set(
        Math.cos(angle) * radius,
        0.4 + Math.random() * 0.2,
        Math.sin(angle) * radius
      );
      flower.castShadow = true;
      islandGroup.add(flower);

      // Stem
      const stemGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.3, 4);
      const stemMat = new THREE.MeshStandardMaterial({ color: "#5B8C5A" });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.set(flower.position.x, flower.position.y - 0.15, flower.position.z);
      islandGroup.add(stem);
    }

    // === POND ===
    const pondGeo = new THREE.CircleGeometry(0.7, 24);
    const pondMat = new THREE.MeshStandardMaterial({
      color: "#5BA8C5",
      transparent: true,
      opacity: 0.7,
      roughness: 0.1,
      metalness: 0.3,
    });
    const pond = new THREE.Mesh(pondGeo, pondMat);
    pond.rotation.x = -Math.PI / 2;
    pond.position.set(1.5, 0.35, 1.2);
    islandGroup.add(pond);

    // Lily pads
    for (let i = 0; i < 3; i++) {
      const lilyGeo = new THREE.CircleGeometry(0.12, 8);
      const lilyMat = new THREE.MeshStandardMaterial({ color: "#5B8C5A", side: THREE.DoubleSide });
      const lily = new THREE.Mesh(lilyGeo, lilyMat);
      lily.rotation.x = -Math.PI / 2;
      lily.position.set(1.5 + (Math.random() - 0.5) * 0.8, 0.36, 1.2 + (Math.random() - 0.5) * 0.6);
      islandGroup.add(lily);
    }

    // === BENCH ===
    const benchSeatGeo = new THREE.BoxGeometry(0.6, 0.05, 0.25);
    const benchMat = new THREE.MeshStandardMaterial({ color: "#8B6914" });
    const benchSeat = new THREE.Mesh(benchSeatGeo, benchMat);
    benchSeat.position.set(2.0, 0.55, -0.5);
    benchSeat.castShadow = true;
    islandGroup.add(benchSeat);

    // Bench legs
    for (const xOff of [-0.25, 0.25]) {
      const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 4);
      const leg = new THREE.Mesh(legGeo, benchMat);
      leg.position.set(2.0 + xOff, 0.45, -0.5);
      islandGroup.add(leg);
    }

    // === LITTLE HOUSE ===
    const houseGeo = new THREE.BoxGeometry(0.6, 0.5, 0.5);
    const houseMat = new THREE.MeshStandardMaterial({ color: "#FFF8F0" });
    const house = new THREE.Mesh(houseGeo, houseMat);
    house.position.set(-2.0, 0.6, 1.0);
    house.castShadow = true;
    islandGroup.add(house);

    // Roof
    const roofGeo = new THREE.ConeGeometry(0.5, 0.4, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: "#E85D5D" });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(-2.0, 1.05, 1.0);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    islandGroup.add(roof);

    // Door
    const doorGeo = new THREE.PlaneGeometry(0.15, 0.25);
    const doorMat = new THREE.MeshStandardMaterial({ color: "#6B4226" });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(-2.0, 0.48, 1.26);
    islandGroup.add(door);

    // === CAMPFIRE ===
    const fireBaseGeo = new THREE.CylinderGeometry(0.15, 0.2, 0.1, 8);
    const fireBaseMat = new THREE.MeshStandardMaterial({ color: "#4A3520" });
    const fireBase = new THREE.Mesh(fireBaseGeo, fireBaseMat);
    fireBase.position.set(1.8, 0.38, -1.8);
    islandGroup.add(fireBase);

    // Fire glow
    const fireGeo = new THREE.ConeGeometry(0.1, 0.3, 6);
    const fireMat = new THREE.MeshStandardMaterial({ color: "#FF6B2B", emissive: "#FF4500", emissiveIntensity: 0.8 });
    const fire = new THREE.Mesh(fireGeo, fireMat);
    fire.position.set(1.8, 0.55, -1.8);
    islandGroup.add(fire);

    const fireLight = new THREE.PointLight("#FF6B2B", 0.5, 3);
    fireLight.position.set(1.8, 0.7, -1.8);
    islandGroup.add(fireLight);

    // === RABBITS ===
    const rabbitGroup = new THREE.Group();
    const rabbitBodyGeo = new THREE.SphereGeometry(0.12, 8, 6);
    const rabbitMat = new THREE.MeshStandardMaterial({ color: "#F5F0E8" });
    const rabbitBody = new THREE.Mesh(rabbitBodyGeo, rabbitMat);
    rabbitBody.position.set(0.8, 0.45, 0.5);
    rabbitGroup.add(rabbitBody);

    const rabbitHeadGeo = new THREE.SphereGeometry(0.08, 8, 6);
    const rabbitHead = new THREE.Mesh(rabbitHeadGeo, rabbitMat);
    rabbitHead.position.set(0.8, 0.58, 0.55);
    rabbitGroup.add(rabbitHead);

    // Ears
    for (const xOff of [-0.03, 0.03]) {
      const earGeo = new THREE.CapsuleGeometry(0.02, 0.08, 4, 4);
      const ear = new THREE.Mesh(earGeo, rabbitMat);
      ear.position.set(0.8 + xOff, 0.68, 0.55);
      rabbitGroup.add(ear);
    }
    islandGroup.add(rabbitGroup);

    // Second rabbit
    const rabbit2 = rabbitGroup.clone();
    rabbit2.position.set(0.6, 0, -0.8);
    rabbit2.scale.setScalar(0.9);
    islandGroup.add(rabbit2);

    scene.add(islandGroup);

    // === BUTTERFLIES ===
    const butterflies: THREE.Mesh[] = [];
    const butterflyMat = new THREE.MeshStandardMaterial({ color: "#C4B1D4", side: THREE.DoubleSide });
    for (let i = 0; i < 6; i++) {
      const wingGeo = new THREE.CircleGeometry(0.06, 6);
      const butterfly = new THREE.Mesh(wingGeo, butterflyMat.clone());
      (butterfly.material as THREE.MeshStandardMaterial).color.setHex(
        [0xC4B1D4, 0xF4A7BB, 0xB8D8E8, 0xF5E6A3, 0xB5E8D5, 0xFFDAB9][i]
      );
      butterfly.position.set(
        (Math.random() - 0.5) * 5,
        2 + Math.random() * 3,
        (Math.random() - 0.5) * 5
      );
      scene.add(butterfly);
      butterflies.push(butterfly);
    }

    // === BIRDS ===
    const birds: THREE.Group[] = [];
    for (let i = 0; i < 4; i++) {
      const bird = new THREE.Group();
      const bodyGeo = new THREE.SphereGeometry(0.05, 6, 4);
      const bodyMat = new THREE.MeshStandardMaterial({ color: i < 2 ? "#4A6B8A" : "#8B6914" });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      bird.add(body);

      // Wings
      const wingGeo = new THREE.PlaneGeometry(0.08, 0.03);
      const wingMat = new THREE.MeshStandardMaterial({ color: "#6B8CAA", side: THREE.DoubleSide });
      const leftWing = new THREE.Mesh(wingGeo, wingMat);
      leftWing.position.x = -0.05;
      bird.add(leftWing);
      const rightWing = new THREE.Mesh(wingGeo, wingMat);
      rightWing.position.x = 0.05;
      bird.add(rightWing);

      bird.position.set(
        (Math.random() - 0.5) * 8,
        4 + Math.random() * 2,
        (Math.random() - 0.5) * 8
      );
      scene.add(bird);
      birds.push(bird);
    }

    // === CLOUDS ===
    const cloudMat = new THREE.MeshStandardMaterial({ color: "#FFFFFF", transparent: true, opacity: 0.7 });
    for (let i = 0; i < 5; i++) {
      const cloudGroup = new THREE.Group();
      for (let j = 0; j < 3; j++) {
        const cloudGeo = new THREE.SphereGeometry(0.5 + Math.random() * 0.4, 8, 6);
        const cloudPiece = new THREE.Mesh(cloudGeo, cloudMat);
        cloudPiece.position.set(j * 0.4 - 0.4, Math.random() * 0.1, Math.random() * 0.2);
        cloudGroup.add(cloudPiece);
      }
      cloudGroup.position.set(
        (Math.random() - 0.5) * 20,
        6 + Math.random() * 3,
        -5 - Math.random() * 10
      );
      scene.add(cloudGroup);
    }

    // === ANIMATION ===
    let time = 0;
    const animate = () => {
      time += 0.005;

      // Rotate camera slowly
      camera.position.x = 8 * Math.cos(time * 0.3);
      camera.position.z = 8 * Math.sin(time * 0.3);
      camera.lookAt(0, 1, 0);

      // Float island gently
      islandGroup.position.y = Math.sin(time * 2) * 0.1;
      islandGroup.rotation.y = time * 0.05;

      // Animate butterflies
      butterflies.forEach((b, i) => {
        b.position.x += Math.sin(time * 3 + i * 2) * 0.005;
        b.position.y += Math.cos(time * 4 + i) * 0.003;
        b.position.z += Math.cos(time * 2.5 + i * 1.5) * 0.004;
        b.rotation.y = time * 5 + i;
      });

      // Animate birds
      birds.forEach((bird, i) => {
        const radius = 5 + i;
        bird.position.x = Math.cos(time * 0.8 + i * 1.5) * radius;
        bird.position.z = Math.sin(time * 0.8 + i * 1.5) * radius;
        bird.position.y = 4 + Math.sin(time * 2 + i) * 0.5;
        bird.rotation.y = Math.atan2(
          -Math.sin(time * 0.8 + i * 1.5),
          Math.cos(time * 0.8 + i * 1.5)
        );
      });

      // Campfire flicker
      fire.scale.y = 1 + Math.sin(time * 15) * 0.2;
      fire.scale.x = 1 + Math.cos(time * 12) * 0.1;
      fireLight.intensity = 0.4 + Math.sin(time * 10) * 0.2;

      renderer.render(scene, camera);
      sceneRef.current!.animationId = requestAnimationFrame(animate);
    };

    sceneRef.current = { scene, camera, renderer, animationId: 0 };
    animate();

    // Fly-to functionality
    if (flyToRef) {
      flyToRef.current = (target: FlyTarget) => {
        return new Promise<void>((resolve) => {
          // Simple zoom-in animation
          const startPos = camera.position.clone();
          const targetPos = new THREE.Vector3(0, 2, 2);
          let t = 0;

          const flyAnimate = () => {
            t += 0.02;
            if (t >= 1) {
              resolve();
              return;
            }
            const eased = 1 - Math.pow(1 - t, 3);
            camera.position.lerpVectors(startPos, targetPos, eased);
            camera.lookAt(0, 1, 0);
            requestAnimationFrame(flyAnimate);
          };
          flyAnimate();
        });
      };
    }

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId);
      }
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [flyToRef]);

  return <div ref={containerRef} className="scene-canvas" />;
}
