import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Connection, ConnectionType } from '../types';

interface MapContainerProps {
  onCountryClick: (code: string, name: string) => void;
  onConnectionClick: (conn: Connection) => void;
  connections: Connection[];
  showConnections: boolean;
}

interface MapAsset {
  name: string;
  coords: [number, number];
  tier: number;
  type: string;
}

const CONNECTION_STYLES: Record<string, { color: string, dash: string, speed: string, thickness: number }> = {
  [ConnectionType.PROXY_WAR]: { color: '#f59e0b', dash: '4,4', speed: '2s', thickness: 1.5 },
  [ConnectionType.ARMS_FLOW]: { color: '#06b6d4', dash: '10,5', speed: '1.5s', thickness: 1.2 },
  [ConnectionType.ALLIANCE]: { color: '#10b981', dash: '0', speed: '3s', thickness: 2 },
  [ConnectionType.CYBER]: { color: '#a855f7', dash: '2,1', speed: '0.5s', thickness: 1 },
  [ConnectionType.SPILLOVER]: { color: '#ef4444', dash: '15,3', speed: '4s', thickness: 2.5 },
};

const DEFAULT_STYLE = { color: '#ffffff', dash: '0', speed: '3s', thickness: 1 };

// Tiered Strategic Asset Database
const ASSETS: MapAsset[] = [
  { name: "Kyiv", coords: [30.5234, 50.4501], tier: 1, type: "Capital" },
  { name: "Kharkiv", coords: [36.2304, 49.9935], tier: 2, type: "Operational Hub" },
  { name: "Mariupol", coords: [37.5413, 47.0971], tier: 3, type: "Port Asset" },
  { name: "Khartoum", coords: [32.5599, 15.5007], tier: 1, type: "Capital" },
  { name: "Sana'a", coords: [44.2075, 15.3694], tier: 1, type: "Capital" },
  { name: "Aden", coords: [45.0359, 12.7855], tier: 2, type: "Strategic Port" },
  { name: "Tel Aviv", coords: [34.7818, 32.0853], tier: 1, type: "Capital" },
  { name: "Gaza City", coords: [34.4668, 31.5016], tier: 2, type: "Frontline Node" },
  { name: "Moscow", coords: [37.6173, 55.7558], tier: 1, type: "Capital" },
  { name: "St. Petersburg", coords: [30.3351, 59.9343], tier: 2, type: "Logistics Hub" },
  { name: "Beijing", coords: [116.4074, 39.9042], tier: 1, type: "Capital" },
  { name: "Taipei", coords: [121.5654, 25.0330], tier: 1, type: "Capital" },
  { name: "Washington D.C.", coords: [-77.0369, 38.9072], tier: 1, type: "Capital" },
  { name: "London", coords: [-0.1276, 51.5072], tier: 1, type: "Capital" },
  { name: "Tehran", coords: [51.3890, 35.6892], tier: 1, type: "Capital" },
  { name: "Seoul", coords: [126.9780, 37.5665], tier: 1, type: "Capital" },
];

const MapContainer: React.FC<MapContainerProps> = ({ onCountryClick, onConnectionClick, connections, showConnections }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [hoveredConnection, setHoveredConnection] = useState<Connection | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const centroids = useRef<Record<string, [number, number]>>({});

  useEffect(() => {
    if (!svgRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const projection = d3.geoMercator()
      .scale(width / 6.5)
      .translate([width / 2.1, height / 1.5]);

    const path = d3.geoPath().projection(projection);
    const g = svg.append('g');
    gRef.current = g;

    // Background rect for zoom/pan capture
    svg.insert("rect", "g")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#020617")
      .style("pointer-events", "all");

    // Markers for connection directionality
    const defs = svg.append('defs');
    Object.entries(CONNECTION_STYLES).forEach(([type, style]) => {
      defs.append('marker')
        .attr('id', `arrowhead-${type}`)
        .attr('viewBox', '0 0 10 10')
        .attr('refX', 8).attr('refY', 5)
        .attr('markerWidth', 4).attr('markerHeight', 4)
        .attr('orient', 'auto-start-reverse')
        .append('path').attr('d', 'M 0 0 L 10 5 L 0 10 z').attr('fill', style.color);
    });

    // Load World GeoJSON
    d3.json('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson').then((data: any) => {
      const countryPaths = g.append('g').attr('class', 'countries');
      
      countryPaths.selectAll('path')
        .data(data.features)
        .enter()
        .append('path')
        .attr('d', path as any)
        .attr('fill', (d: any) => {
          const hotspots = ['UKR', 'SDN', 'COD', 'MMR', 'YEM', 'SYR', 'AFG', 'ETH', 'PSE', 'ISR', 'RUS', 'TWN'];
          return hotspots.includes(d.id) ? '#1e1b4b' : '#0f172a';
        })
        .attr('stroke', '#1e293b')
        .attr('stroke-width', 0.5)
        .style('cursor', 'pointer')
        .on('mouseover', (event, d: any) => {
          d3.select(event.currentTarget)
            .raise()
            .transition()
            .duration(150)
            .attr('fill', '#334155')
            .attr('stroke', '#00ffff')
            .attr('stroke-width', 1.5 / zoomScale);
          setHoveredCountry(d.properties.name);
        })
        .on('mouseout', (event, d: any) => {
          d3.select(event.currentTarget)
            .transition()
            .duration(150)
            .attr('fill', (d: any) => {
              const hotspots = ['UKR', 'SDN', 'COD', 'MMR', 'YEM', 'SYR', 'AFG', 'ETH', 'PSE', 'ISR', 'RUS', 'TWN'];
              return hotspots.includes(d.id) ? '#1e1b4b' : '#0f172a';
            })
            .attr('stroke', '#1e293b')
            .attr('stroke-width', 0.5 / zoomScale);
          setHoveredCountry(null);
        })
        .on('click', (event, d: any) => onCountryClick(d.id, d.properties.name));

      data.features.forEach((d: any) => {
        const c = path.centroid(d);
        if (!isNaN(c[0])) centroids.current[d.id] = c as [number, number];
      });

      // Asset Layer (Cities/Bases)
      const assetLayer = g.append('g').attr('class', 'assets');
      const assets = assetLayer.selectAll('.asset-node').data(ASSETS).enter().append('g').attr('class', 'asset-node');
      
      assets.append('circle')
        .attr('cx', d => projection(d.coords as [number, number])![0])
        .attr('cy', d => projection(d.coords as [number, number])![1])
        .attr('r', d => d.tier === 1 ? 2.5 : 1.5)
        .attr('fill', d => d.tier === 1 ? '#fff' : '#94a3b8')
        .attr('stroke', '#020617')
        .attr('stroke-width', 0.5);

      assets.append('text')
        .attr('x', d => projection(d.coords as [number, number])![0] + 5)
        .attr('y', d => projection(d.coords as [number, number])![1] + 2)
        .text(d => d.name)
        .attr('fill', '#fff')
        .attr('font-size', '5px')
        .attr('font-family', 'JetBrains Mono')
        .attr('pointer-events', 'none');
      
      // Initial visibility
      g.selectAll('.asset-node').style('opacity', 0);
    });

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 60])
      .on('zoom', (event) => {
        const { k, x, y } = event.transform;
        g.attr('transform', event.transform);
        setZoomScale(k);
        
        g.selectAll('.countries path').attr('stroke-width', 0.5 / k);
        g.selectAll('.connection-line').attr('stroke-width', (d: any) => {
            const style = d ? CONNECTION_STYLES[d.type] : null;
            return (style?.thickness || 1) / k;
        });
        
        // Tiered asset visibility
        g.selectAll('.asset-node').style('opacity', (d: any) => {
          if (k > 20) return 1;
          if (k > 8 && d.tier <= 2) return 1;
          if (k > 3 && d.tier === 1) return 1;
          return 0;
        });

        g.selectAll<SVGTextElement, MapAsset>('.asset-node text').attr('font-size', d => (d.tier === 1 ? 6 : 4) / k);

        // Simulated high-fidelity tactical grid
        if (k > 30) {
          g.selectAll('.tactical-grid').remove();
          const grid = g.append('g').attr('class', 'tactical-grid').attr('opacity', 0.3);
          const step = 0.05; // Tight grid
          const center = projection.invert!([width/2 - x, height/2 - y]);
          for (let i = -10; i <= 10; i++) {
             grid.append('line')
               .attr('x1', projection([center[0] + i*step, center[1] - 0.5])![0])
               .attr('y1', projection([center[0] + i*step, center[1] - 0.5])![1])
               .attr('x2', projection([center[0] + i*step, center[1] + 0.5])![0])
               .attr('y2', projection([center[0] + i*step, center[1] + 0.5])![1])
               .attr('stroke', '#00ffff').attr('stroke-width', 0.01 / k);
             grid.append('line')
               .attr('x1', projection([center[0] - 0.5, center[1] + i*step])![0])
               .attr('y1', projection([center[0] - 0.5, center[1] + i*step])![1])
               .attr('x2', projection([center[0] + 0.5, center[1] + i*step])![0])
               .attr('y2', projection([center[0] + 0.5, center[1] + i*step])![1])
               .attr('stroke', '#00ffff').attr('stroke-width', 0.01 / k);
          }
        } else {
          g.selectAll('.tactical-grid').remove();
        }
      });

    svg.call(zoom);

    return () => {
      svg.selectAll('*').remove();
    };
  }, [onCountryClick]);

  useEffect(() => {
    if (!gRef.current || !showConnections) {
      d3.select('.connections-layer').remove();
      return;
    }

    d3.select('.connections-layer').remove();
    const connectionsLayer = gRef.current.append('g').attr('class', 'connections-layer');

    connections.forEach((conn) => {
      const source = centroids.current[conn.source];
      const target = centroids.current[conn.target];

      if (source && target) {
        const dx = target[0] - source[0];
        const dy = target[1] - source[1];
        const dr = Math.sqrt(dx * dx + dy * dy);
        const pathData = `M${source[0]},${source[1]}A${dr},${dr} 0 0,1 ${target[0]},${target[1]}`;
        const style = CONNECTION_STYLES[conn.type] || DEFAULT_STYLE;

        const group = connectionsLayer.append('g')
          .datum(conn)
          .attr('class', 'connection-group')
          .style('cursor', 'pointer')
          .on('mouseover', () => setHoveredConnection(conn))
          .on('mouseout', () => setHoveredConnection(null))
          .on('click', () => onConnectionClick(conn));

        const line = group.append('path')
          .attr('class', 'connection-line')
          .attr('d', pathData)
          .attr('fill', 'none')
          .attr('stroke', style.color)
          .attr('stroke-width', style.thickness / zoomScale)
          .attr('opacity', 0.6)
          .attr('stroke-dasharray', style.dash)
          .attr('marker-end', `url(#arrowhead-${conn.type})`);

        if (style.dash !== '0') {
          line.append('animate')
            .attr('attributeName', 'stroke-dashoffset')
            .attr('from', '100')
            .attr('to', '0')
            .attr('dur', style.speed)
            .attr('repeatCount', 'indefinite');
        } else {
          line.append('animate')
            .attr('attributeName', 'opacity')
            .attr('values', '0.3;0.8;0.3')
            .attr('dur', '3s')
            .attr('repeatCount', 'indefinite');
        }
      }
    });
  }, [connections, showConnections, zoomScale, onConnectionClick]);

  return (
    <div className="relative w-full h-full bg-[#020617] overflow-hidden">
      <svg ref={svgRef} className="map-container" />
      
      {hoveredConnection && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full mb-8 glass p-4 rounded-2xl border border-white/20 shadow-2xl pointer-events-none z-50 max-w-xs animate-in fade-in slide-in-from-bottom-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Signal Decrypted</p>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CONNECTION_STYLES[hoveredConnection.type]?.color || '#fff' }}></div>
            <span className="text-xs font-black text-white uppercase tracking-tighter">{hoveredConnection.type.replace('_', ' ')}</span>
          </div>
          <p className="text-[10px] text-slate-300 mt-2 leading-relaxed mono italic">"{hoveredConnection.description}"</p>
        </div>
      )}

      <div className="absolute bottom-8 left-8 glass p-5 rounded-2xl border border-white/10 pointer-events-none select-none">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase mono tracking-[0.3em]">Operational Area</span>
          <span className="text-2xl font-black tracking-tighter text-white uppercase italic">{hoveredCountry || 'Global Grid'}</span>
          <div className="mt-2 flex items-center gap-3">
             <div className="flex flex-col">
                <span className="text-[8px] text-slate-600 uppercase mono">Zoom</span>
                <span className="text-[10px] text-sky-400 mono">{(zoomScale * 12.5).toFixed(0)}km Res</span>
             </div>
             <div className="w-px h-6 bg-white/10"></div>
             <div className="flex flex-col">
                <span className="text-[8px] text-slate-600 uppercase mono">Detail</span>
                <span className="text-[10px] text-emerald-400 mono">
                  {zoomScale > 30 ? 'Precision Mapping' : zoomScale > 15 ? 'Strategic Grid' : 'Strategic Overview'}
                </span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapContainer;
