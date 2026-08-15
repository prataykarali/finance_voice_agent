'use client';

import React, { useEffect, useRef } from 'react';

export type AgentUIState = 'ready' | 'connecting' | 'thinking' | 'listening' | 'speaking' | 'ended';

interface ParticleSwarmCanvasProps {
  agentState: AgentUIState;
  className?: string;
}

/**
 * Lightweight CSS-only particle background that replaces the Three.js version.
 * Uses a 2D canvas with simple dot particles — saves ~150 MB in bundle size
 * by eliminating the `three` dependency.
 */
export function ParticleSwarmCanvas({ agentState, className }: ParticleSwarmCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<AgentUIState>(agentState);

  useEffect(() => {
    stateRef.current = agentState;
  }, [agentState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const COUNT = 400;
    let animationFrameId = 0;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      hue: number;
      alpha: number;
    }

    const particles: Particle[] = [];
    const resize = () => {
      canvas.width = canvas.clientWidth * Math.min(window.devicePixelRatio, 2);
      canvas.height = canvas.clientHeight * Math.min(window.devicePixelRatio, 2);
    };
    resize();

    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 0.5,
        hue: 155 + Math.random() * 30,
        alpha: Math.random() * 0.6 + 0.2,
      });
    }

    let time = 0;

    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      if (!ctx || !canvas) return;

      time += 0.016;
      const state = stateRef.current;

      let speed = 1;
      let baseHue = 155;
      if (state === 'connecting') {
        speed = 3;
        baseHue = 200;
      } else if (state === 'thinking') {
        speed = 2;
        baseHue = 180;
      } else if (state === 'listening') {
        speed = 1.5;
        baseHue = 160;
      } else if (state === 'speaking') {
        speed = 4;
        baseHue = 140;
      } else if (state === 'ended') {
        speed = 0.3;
        baseHue = 170;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < COUNT; i++) {
        const p = particles[i];
        p.x += p.vx * speed;
        p.y += p.vy * speed;

        // Subtle swirl
        p.vx += Math.sin(time + i * 0.01) * 0.01;
        p.vy += Math.cos(time + i * 0.01) * 0.01;

        // Damping
        p.vx *= 0.99;
        p.vy *= 0.99;

        // Wrap around
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const hue = baseHue + (p.hue - 155);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${p.alpha})`;
        ctx.fill();
      }
    }

    animate();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className || ''}`}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
