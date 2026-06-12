'use client';
import { useEffect, useRef } from 'react';

export function GraphView({ nodes, edges }: { nodes: { id: string; label: string; type: string }[]; edges: { id: string; from: string; to: string; label: string }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cy: any;
    let cancelled = false;
    (async () => {
      if (!ref.current) return;
      if (nodes.length === 0) return;
      const cytoscape = (await import('cytoscape')).default;
      if (cancelled || !ref.current) return;
      cy = cytoscape({
        container: ref.current,
