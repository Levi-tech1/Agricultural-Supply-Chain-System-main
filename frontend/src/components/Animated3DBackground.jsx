import { useMemo } from "react";
import styles from "./Animated3DBackground.module.css";

const PARTICLE_COUNT = 60;

export default function Animated3DBackground() {
  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 10 + Math.random() * 12,
        size: 3 + Math.random() * 3,
      })),
    []
  );

  return (
    <div className={styles.background}>
      <div className={styles.gradient} />
      <div className={styles.particles}>
        {particles.map((p) => (
          <div
            key={p.id}
            className={styles.particle}
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              width: `${p.size}px`,
              height: `${p.size}px`,
            }}
          />
        ))}
      </div>
      <div className={styles.shapes}>
        <div className={styles.shape1} />
        <div className={styles.shape2} />
        <div className={styles.shape3} />
      </div>
      <div className={styles.orbits}>
        <div
          className={styles.orbit}
          style={{
            width: 180,
            height: 180,
            top: "30%",
            left: "75%",
            animationDuration: "25s",
          }}
        >
          <span className={styles.orbitDot} />
        </div>
        <div
          className={styles.orbit}
          style={{
            width: 120,
            height: 120,
            bottom: "25%",
            left: "15%",
            animationDuration: "18s",
            animationDirection: "reverse",
          }}
        >
          <span className={styles.orbitDot} />
        </div>
      </div>
    </div>
  );
}
