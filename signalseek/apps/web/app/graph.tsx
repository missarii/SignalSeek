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
        elements: [
          ...nodes.map((n) => ({ data: { id: n.id, label: n.label, type: n.type } })),
          ...edges.map((e) => ({ data: { id: e.id, source: e.from, target: e.to, label: e.label } })),
        ],
        style: [
          { selector: 'node', style: { label: 'data(label)', 'background-color': '#6366f1', color: '#e2e8f0', 'font-size': 10 } },
          { selector: 'edge', style: { label: 'data(label)', 'line-color': '#475569', color: '#94a3b8', 'font-size': 8, 'curve-style': 'bezier' } },
        ],
        layout: { name: 'cose' },
      });
    })();
    return () => { cancelled = true; try { cy?.destroy(); } catch {} };
  }, [nodes, edges]);
  if (nodes.length === 0) {
    return <p className="text-sm text-slate-500">No entities yet — run an investigation to populate the evidence-backed graph.</p>;
  }
  return <div ref={ref} className="h-96 rounded bg-slate-950 border border-slate-800" />;
}
