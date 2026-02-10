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
  tier: number; // 1: Major Capital, 2: Strategic Hub, 3: Minor City/Tactical Node
  type: string;
}

const CONNECTION_STYLES: Record<string, { color: string, dash: string, speed: string, thickness: number, label: string }> = {
  [ConnectionType.PROXY_WAR]: { color: '#f59e0b', dash: '4,4', speed: '2s', thickness: 1.5, label: 'Proxy Intervention' },
  [ConnectionType.ARMS_FLOW]: { color: '#06b6d4', dash: '10,5', speed: '1.5s', thickness: 1.2, label: 'Logistics / Arms Flow' },
  [ConnectionType.ALLIANCE]: { color: '#10b981', dash: '0', speed: '3s', thickness: 2, label: 'Strategic Alliance' },
  [ConnectionType.CYBER]: { color: '#a855f7', dash: '2,1', speed: '0.5s', thickness: 1, label: 'Cyber Operation' },
  [ConnectionType.SPILLOVER]: { color: '#ef4444', dash: '15,3', speed: '4s', thickness: 2.5, label: 'Regional Spillover' },
};

const DEFAULT_STYLE = { color: '#ffffff', dash: '0', speed: '3s', thickness: 1 };

const SEVERITY_INDEX: Record<string, number> = {
  'UKR': 96, 'RUS': 88, 'SDN': 92, 'PSE': 98, 'ISR': 94,
  'YEM': 82, 'MMR': 85, 'ETH': 78, 'SYR': 89, 'AFG': 75,
  'COD': 81, 'TWN': 68, 'IRN': 65, 'USA': 20, 'CHN': 45
};

const ASSETS: MapAsset[] = [
  { name: "Kabul", coords: [69.2075, 34.5553], tier: 1, type: "Capital" },
  { name: "Tirana", coords: [19.8187, 41.3275], tier: 1, type: "Capital" },
  { name: "Algiers", coords: [3.0588, 36.7538], tier: 1, type: "Capital" },
  { name: "Andorra la Vella", coords: [1.5218, 42.5063], tier: 1, type: "Capital" },
  { name: "Luanda", coords: [13.2344, -8.8383], tier: 1, type: "Capital" },
  { name: "Buenos Aires", coords: [-58.3816, -34.6037], tier: 1, type: "Capital" },
  { name: "Yerevan", coords: [44.5152, 40.1872], tier: 1, type: "Capital" },
  { name: "Canberra", coords: [149.1300, -35.2809], tier: 1, type: "Capital" },
  { name: "Vienna", coords: [16.3738, 48.2082], tier: 1, type: "Capital" },
  { name: "Baku", coords: [49.8671, 40.4093], tier: 1, type: "Capital" },
  { name: "Nassau", coords: [-77.3554, 25.0443], tier: 1, type: "Capital" },
  { name: "Manama", coords: [50.5860, 26.2285], tier: 1, type: "Capital" },
  { name: "Dhaka", coords: [90.4125, 23.8103], tier: 1, type: "Capital" },
  { name: "Bridgetown", coords: [-59.6167, 13.0975], tier: 1, type: "Capital" },
  { name: "Minsk", coords: [27.5615, 53.9045], tier: 1, type: "Capital" },
  { name: "Brussels", coords: [4.3517, 50.8503], tier: 1, type: "Capital" },
  { name: "Belmopan", coords: [-88.7713, 17.2510], tier: 1, type: "Capital" },
  { name: "Porto-Novo", coords: [2.6289, 6.4969], tier: 1, type: "Capital" },
  { name: "Thimphu", coords: [89.6390, 27.4728], tier: 1, type: "Capital" },
  { name: "La Paz", coords: [-68.1193, -16.4897], tier: 1, type: "Capital" },
  { name: "Sarajevo", coords: [18.4131, 43.8563], tier: 1, type: "Capital" },
  { name: "Gaborone", coords: [25.9231, -24.6282], tier: 1, type: "Capital" },
  { name: "Brasília", coords: [-47.8825, -15.7939], tier: 1, type: "Capital" },
  { name: "Sofia", coords: [23.3219, 42.6977], tier: 1, type: "Capital" },
  { name: "Ouagadougou", coords: [-1.5197, 12.3714], tier: 1, type: "Capital" },
  { name: "Gitega", coords: [29.9246, -3.4264], tier: 1, type: "Capital" },
  { name: "Phnom Penh", coords: [104.9282, 11.5564], tier: 1, type: "Capital" },
  { name: "Yaoundé", coords: [11.5021, 3.8480], tier: 1, type: "Capital" },
  { name: "Ottawa", coords: [-75.6972, 45.4215], tier: 1, type: "Capital" },
  { name: "Praia", coords: [-23.5087, 14.9330], tier: 1, type: "Capital" },
  { name: "Bangui", coords: [18.5582, 4.3947], tier: 1, type: "Capital" },
  { name: "N'Djamena", coords: [15.0557, 12.1348], tier: 1, type: "Capital" },
  { name: "Santiago", coords: [-70.6693, -33.4489], tier: 1, type: "Capital" },
  { name: "Beijing", coords: [116.4074, 39.9042], tier: 1, type: "Capital" },
  { name: "Bogotá", coords: [-74.0721, 4.7110], tier: 1, type: "Capital" },
  { name: "Moroni", coords: [43.2551, -11.7172], tier: 1, type: "Capital" },
  { name: "San José", coords: [-84.0907, 9.9281], tier: 1, type: "Capital" },
  { name: "Zagreb", coords: [15.9819, 45.8150], tier: 1, type: "Capital" },
  { name: "Havana", coords: [-82.3666, 23.1136], tier: 1, type: "Capital" },
  { name: "Nicosia", coords: [33.3823, 35.1856], tier: 1, type: "Capital" },
  { name: "Prague", coords: [14.4378, 50.0755], tier: 1, type: "Capital" },
  { name: "Copenhagen", coords: [12.5683, 55.6761], tier: 1, type: "Capital" },
  { name: "Djibouti", coords: [43.1456, 11.8251], tier: 1, type: "Capital" },
  { name: "Roseau", coords: [-61.3794, 15.3092], tier: 1, type: "Capital" },
  { name: "Santo Domingo", coords: [-69.9312, 18.4861], tier: 1, type: "Capital" },
  { name: "Quito", coords: [-78.4678, -0.1807], tier: 1, type: "Capital" },
  { name: "Cairo", coords: [31.2357, 30.0444], tier: 1, type: "Capital" },
  { name: "San Salvador", coords: [-89.2182, 13.6929], tier: 1, type: "Capital" },
  { name: "Malabo", coords: [8.7832, 3.7504], tier: 1, type: "Capital" },
  { name: "Asmara", coords: [38.9251, 15.3229], tier: 1, type: "Capital" },
  { name: "Tallinn", coords: [24.7536, 59.4370], tier: 1, type: "Capital" },
  { name: "Kyiv", coords: [30.5234, 50.4501], tier: 1, type: "Capital" },
  { name: "London", coords: [-0.1276, 51.5074], tier: 1, type: "Capital" },
  { name: "Washington D.C.", coords: [-77.0369, 38.9072], tier: 1, type: "Capital" },
  { name: "Sana'a", coords: [44.2075, 15.3694], tier: 1, type: "Capital" },
];

const MapContainer: React.FC<MapContainerProps> = ({ onCountryClick, onConnectionClick, connections, showConnections }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [hoveredConnection, setHoveredConnection] = useState<Connection | null>(null);
  const [hoveredCity, setHoveredCity] = useState<MapAsset | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  
  const [activeFilters, setActiveFilters] = useState<Set<ConnectionType>>(new Set(Object.values(ConnectionType)));
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const centroids = useRef<Record<string, [number, number]>>({});

  const toggleFilter = (type: ConnectionType) => {
    const newFilters = new Set(activeFilters);
    if (newFilters.has(type)) {
      newFilters.delete(type);
    } else {
      newFilters.add(type);
    }
    setActiveFilters(newFilters);
  };

  const getCountryFill = (id: string, isHovered: boolean = false) => {
    if (isHovered) return '#334155';
    
    if (showHeatmap) {
      const score = SEVERITY_INDEX[id] || 0;
      if (score === 0) return '#0f172a';
      return d3.interpolateRgb('#0f172a', '#7f1d1d')(score / 100);
    }

    const hotspots = ['UKR', 'SDN', 'COD', 'MMR', 'YEM', 'SYR', 'AFG', 'ETH', 'PSE', 'ISR', 'RUS', 'TWN'];
    return hotspots.includes(id) ? '#1e1b4b' : '#0f172a';
  };

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
    svg.selectAll('g').remove();
    const g = svg.append('g');
    gRef.current = g;

    svg.insert("rect", "g")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#020617")
      .style("pointer-events", "all");

    const defs = svg.append('defs');
    
    const thermalGradient = defs.append('radialGradient')
      .attr('id', 'thermal-glow')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');
    thermalGradient.append('stop').attr('offset', '0%').attr('stop-color', '#ef4444').attr('stop-opacity', '0.4');
    thermalGradient.append('stop').attr('offset', '100%').attr('stop-color', '#ef4444').attr('stop-opacity', '0');

    Object.entries(CONNECTION_STYLES).forEach(([type, style]) => {
      defs.append('marker')
        .attr('id', `arrowhead-${type}`)
        .attr('viewBox', '0 0 10 10')
        .attr('refX', 8).attr('refY', 5)
        .attr('markerWidth', 4).attr('markerHeight', 4)
        .attr('orient', 'auto-start-reverse')
        .append('path').attr('d', 'M 0 0 L 10 5 L 0 10 z').attr('fill', style.color);
    });

    Promise.all([
      d3.json('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson'),
      d3.json('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_1_states_provinces.geojson')
    ]).then(([worldData, stateData]: [any, any]) => {
      const heatmapLayer = g.append('g').attr('class', 'heatmap-glow-layer').style('pointer-events', 'none');

      const countryPaths = g.append('g').attr('class', 'countries');
      countryPaths.selectAll('path')
        .data(worldData.features)
        .enter()
        .append('path')
        .attr('d', path as any)
        .attr('fill', (d: any) => getCountryFill(d.id))
        .attr('stroke', '#1e293b')
        .attr('stroke-width', 0.5)
        .style('cursor', 'pointer')
        .on('mouseover', (event, d: any) => {
          d3.select(event.currentTarget).raise().transition().duration(150)
            .attr('fill', getCountryFill(d.id, true))
            .attr('stroke', '#00ffff').attr('stroke-width', 1.5 / zoomScale);
          setHoveredCountry(d.properties.name);
        })
        .on('mouseout', (event, d: any) => {
          d3.select(event.currentTarget).transition().duration(150)
            .attr('fill', getCountryFill(d.id))
            .attr('stroke', '#1e293b').attr('stroke-width', 0.5 / zoomScale);
          setHoveredCountry(null);
        })
        .on('click', (event, d: any) => onCountryClick(d.id, d.properties.name));

      worldData.features.forEach((d: any) => {
        const c = path.centroid(d);
        if (!isNaN(c[0])) centroids.current[d.id] = c as [number, number];
        
        if (SEVERITY_INDEX[d.id] > 70) {
          heatmapLayer.append('circle')
            .attr('class', `glow-${d.id}`)
            .attr('cx', c[0])
            .attr('cy', c[1])
            .attr('r', 20)
            .attr('fill', 'url(#thermal-glow)')
            .attr('opacity', 0);
        }
      });

      const statePaths = g.append('g').attr('class', 'states').style('pointer-events', 'none');
      statePaths.selectAll('path')
        .data(stateData.features)
        .enter()
        .append('path')
        .attr('d', path as any)
        .attr('fill', 'none')
        .attr('stroke', '#475569')
        .attr('stroke-width', 0.2)
        .attr('opacity', 0);

      const assetLayer = g.append('g').attr('class', 'assets');
      const assets = assetLayer.selectAll('.asset-node')
        .data(ASSETS)
        .enter()
        .append('g')
        .attr('class', 'asset-node')
        .style('cursor', 'crosshair')
        .on('mouseover', (event, d) => {
          setHoveredCity(d);
          const node = d3.select(event.currentTarget);
          if (d.tier === 1) {
            node.select('rect').transition().duration(200).attr('width', 8 / zoomScale).attr('height', 8 / zoomScale).attr('x', -4 / zoomScale).attr('y', -4 / zoomScale).attr('fill', '#00ffff');
          } else if (d.tier === 2) {
            node.select('rect').transition().duration(200).attr('width', 6 / zoomScale).attr('height', 6 / zoomScale).attr('x', -3 / zoomScale).attr('y', -3 / zoomScale).attr('fill', '#00ffff');
          } else {
            node.select('circle').transition().duration(200).attr('r', 4 / zoomScale).attr('fill', '#00ffff');
          }
          node.select('text').transition().duration(200).attr('fill', '#00ffff').attr('font-weight', 'bold');
        })
        .on('mouseout', (event, d) => {
          setHoveredCity(null);
          const node = d3.select(event.currentTarget);
          if (d.tier === 1) {
            node.select('rect').transition().duration(200).attr('width', 5 / zoomScale).attr('height', 5 / zoomScale).attr('x', -2.5 / zoomScale).attr('y', -2.5 / zoomScale).attr('fill', '#ffffff');
          } else if (d.tier === 2) {
            node.select('rect').transition().duration(200).attr('width', 4 / zoomScale).attr('height', 4 / zoomScale).attr('x', -2 / zoomScale).attr('y', -2 / zoomScale).attr('fill', '#06b6d4');
          } else {
            node.select('circle').transition().duration(200).attr('r', 1.5 / zoomScale).attr('fill', '#94a3b8');
          }
          node.select('text').transition().duration(200).attr('fill', '#fff').attr('font-weight', 'normal');
        });

      ASSETS.forEach((d, i) => {
        const [x, y] = projection(d.coords as [number, number])!;
        const group = d3.select(assets.nodes()[i]).attr('transform', `translate(${x},${y})`);
        if (d.tier === 1) {
          group.append('rect').attr('width', 5 / zoomScale).attr('height', 5 / zoomScale).attr('x', -2.5 / zoomScale).attr('y', -2.5 / zoomScale).attr('fill', '#ffffff').attr('transform', 'rotate(45)').attr('stroke', '#020617').attr('stroke-width', 0.5 / zoomScale);
        } else if (d.tier === 2) {
          group.append('rect').attr('width', 4 / zoomScale).attr('height', 4 / zoomScale).attr('x', -2 / zoomScale).attr('y', -2 / zoomScale).attr('fill', '#06b6d4').attr('stroke', '#020617').attr('stroke-width', 0.5 / zoomScale);
        } else {
          group.append('circle').attr('r', 1.5 / zoomScale).attr('fill', '#94a3b8').attr('stroke', '#020617').attr('stroke-width', 0.5 / zoomScale);
        }
      });

      assets.append('text').attr('x', 6 / zoomScale).attr('y', 2 / zoomScale).text(d => d.name).attr('fill', '#fff').attr('font-size', d => (d.tier === 1 ? 6 : d.tier === 2 ? 5 : 4) / zoomScale).attr('font-family', 'JetBrains Mono').attr('pointer-events', 'none').style('text-shadow', '0px 0px 2px rgba(0,0,0,0.8)');
      g.selectAll('.asset-node').style('opacity', 0);
    });

    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([1, 100]).on('zoom', (event) => {
        const { k, x, y } = event.transform;
        g.attr('transform', event.transform);
        setZoomScale(k);
        g.selectAll('.countries path').attr('stroke-width', 0.5 / k);
        g.selectAll('.states path').attr('stroke-width', 0.2 / k).attr('opacity', k > 4 ? 0.4 : 0);
        g.selectAll('.connection-line').attr('stroke-width', (d: any) => (CONNECTION_STYLES[d?.type]?.thickness || 1) / k);
        g.selectAll('.asset-node').style('opacity', (d: any) => {
          if (k > 20) return 1;
          if (k > 8 && d.tier <= 2) return Math.min(1, (k - 8) / 4);
          if (k > 2.5 && d.tier === 1) return Math.min(1, (k - 2.5) / 2);
          return 0;
        });
        g.selectAll('.asset-node').each(function(d: any) {
          const node = d3.select(this);
          if (d.tier === 1) { node.select('rect').attr('width', 5 / k).attr('height', 5 / k).attr('x', -2.5 / k).attr('y', -2.5 / k).attr('stroke-width', 0.5 / k); }
          else if (d.tier === 2) { node.select('rect').attr('width', 4 / k).attr('height', 4 / k).attr('x', -2 / k).attr('y', -2 / k).attr('stroke-width', 0.5 / k); }
          else { node.select('circle').attr('r', 1.5 / k).attr('stroke-width', 0.5 / k); }
          node.select('text').attr('font-size', (d.tier === 1 ? 6 : d.tier === 2 ? 5 : 4) / k).attr('x', 6 / k).attr('y', 2 / k);
        });
        g.selectAll('.heatmap-glow-layer circle').attr('r', 30 / k);
        if (k > 40) {
          g.selectAll('.tactical-grid').remove();
          const grid = g.append('g').attr('class', 'tactical-grid').attr('opacity', 0.4);
          const step = 0.02;
          const center = projection.invert!([width/2 - x, height/2 - y]);
          for (let i = -15; i <= 15; i++) {
             grid.append('line').attr('x1', projection([center[0] - 0.5, center[1] + i*step])![0]).attr('y1', projection([center[0] - 0.5, center[1] + i*step])![1]).attr('x2', projection([center[0] + 0.5, center[1] + i*step])![0]).attr('y2', projection([center[0] + 0.5, center[1] + i*step])![1]).attr('stroke', '#00ffff').attr('stroke-width', 0.005 / k);
             grid.append('line').attr('x1', projection([center[0] + i*step, center[1] - 0.5])![0]).attr('y1', projection([center[0] + i*step, center[1] - 0.5])![1]).attr('x2', projection([center[0] + i*step, center[1] + 0.5])![0]).attr('y2', projection([center[0] + i*step, center[1] + 0.5])![1]).attr('stroke', '#00ffff').attr('stroke-width', 0.005 / k);
          }
        } else { g.selectAll('.tactical-grid').remove(); }
      });
    svg.call(zoom);
    return () => { svg.selectAll('*').remove(); };
  }, [onCountryClick, showHeatmap]);

  useEffect(() => {
    if (!gRef.current) return;
    gRef.current.selectAll('.countries path').transition().duration(800).attr('fill', (d: any) => getCountryFill(d.id));
    gRef.current.selectAll('.heatmap-glow-layer circle').transition().duration(800).attr('opacity', showHeatmap ? 1 : 0);
  }, [showHeatmap]);

  useEffect(() => {
    if (!gRef.current || !showConnections) {
      d3.select('.connections-layer').remove();
      return;
    }
    d3.select('.connections-layer').remove();
    const connectionsLayer = gRef.current.append('g').attr('class', 'connections-layer');
    const filteredConnections = connections.filter(c => activeFilters.has(c.type));
    filteredConnections.forEach((conn) => {
      const source = centroids.current[conn.source];
      const target = centroids.current[conn.target];
      if (source && target) {
        const dx = target[0] - source[0];
        const dy = target[1] - source[1];
        const dr = Math.sqrt(dx * dx + dy * dy);
        const pathData = `M${source[0]},${source[1]}A${dr},${dr} 0 0,1 ${target[0]},${target[1]}`;
        const style = CONNECTION_STYLES[conn.type] || DEFAULT_STYLE;
        const group = connectionsLayer.append('g').datum(conn).attr('class', 'connection-group').style('cursor', 'pointer').on('mouseover', () => setHoveredConnection(conn)).on('mouseout', () => setHoveredConnection(null)).on('click', () => onConnectionClick(conn));
        const line = group.append('path').attr('class', 'connection-line').attr('d', pathData).attr('fill', 'none').attr('stroke', style.color).attr('stroke-width', style.thickness / zoomScale).attr('opacity', 0.6).attr('stroke-dasharray', style.dash).attr('marker-end', `url(#arrowhead-${conn.type})`);
        if (style.dash !== '0') {
          line.append('animate').attr('attributeName', 'stroke-dashoffset').attr('from', '100').attr('to', '0').attr('dur', style.speed).attr('repeatCount', 'indefinite');
        } else {
          line.append('animate').attr('attributeName', 'opacity').attr('values', '0.3;0.8;0.3').attr('dur', '3s').attr('repeatCount', 'indefinite');
        }
      }
    });
  }, [connections, showConnections, zoomScale, onConnectionClick, activeFilters]);

  return (
    <div className="relative w-full h-full bg-[#020617] overflow-hidden">
      <svg ref={svgRef} className="map-container" />
      
      {/* Tactical HUD Controls */}
      <div className="absolute bottom-8 right-8 flex gap-3 z-40">
        <button 
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`w-12 h-12 glass rounded-full flex items-center justify-center border transition-all shadow-2xl group ${showHeatmap ? 'border-red-500 text-red-500 bg-red-950/20' : 'border-white/10 text-slate-400 hover:border-red-500/50'}`}
          title="Heatmap Mode"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.99 7.99 0 0120 13a7.99 7.99 0 01-2.343 5.657z" />
          </svg>
        </button>

        <div className="relative">
          <button 
            onClick={() => { setIsFilterOpen(!isFilterOpen); setIsLegendOpen(false); }}
            className={`w-12 h-12 glass rounded-full flex items-center justify-center border transition-all shadow-2xl group ${isFilterOpen ? 'border-sky-500 text-sky-400 bg-sky-950/20' : 'border-white/10 text-slate-400 hover:border-sky-500/50'}`}
            title="Signal Filters"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
          {isFilterOpen && (
            <div className="absolute bottom-16 right-0 w-64 glass p-6 rounded-2xl border border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 backdrop-blur-3xl">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-400 mb-5 pb-2 border-b border-white/5 flex justify-between">Signal Filters</h3>
              <div className="space-y-4">
                {Object.values(ConnectionType).map((type) => (
                  <label key={type} className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: CONNECTION_STYLES[type].color, opacity: activeFilters.has(type) ? 1 : 0.2 }}></div>
                      <span className={`text-[10px] transition-colors ${activeFilters.has(type) ? 'text-slate-200' : 'text-slate-600'}`}>{type.replace('_', ' ')}</span>
                    </div>
                    <input type="checkbox" className="sr-only" checked={activeFilters.has(type)} onChange={() => toggleFilter(type)} />
                    <div className={`w-8 h-4 rounded-full transition-colors ${activeFilters.has(type) ? 'bg-sky-600/50' : 'bg-slate-800'}`}></div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={() => { setIsLegendOpen(!isLegendOpen); setIsFilterOpen(false); }}
          className={`w-12 h-12 glass rounded-full flex items-center justify-center border transition-all shadow-2xl group ${isLegendOpen ? 'border-sky-500 text-sky-400 bg-sky-950/20' : 'border-white/10 text-slate-400 hover:border-sky-500/50'}`}
          title="Legend"
        >
          <svg className={`w-5 h-5 transition-transform duration-300 ${isLegendOpen ? 'rotate-180 text-sky-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {/* Comprehensive Collapsible Legend */}
      {isLegendOpen && (
        <div className="absolute bottom-24 right-8 w-72 glass p-6 rounded-2xl border border-white/10 shadow-2xl z-40 animate-in fade-in slide-in-from-bottom-4 duration-300 backdrop-blur-3xl max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-white/5">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-400">Map Symbology</h3>
             <span className="text-[8px] text-slate-500 mono uppercase tracking-widest">v4.9.0</span>
          </div>

          <div className="space-y-8">
            {/* Country Fill Explanation */}
            <div>
              <p className="text-[8px] text-slate-500 uppercase mono mb-3 tracking-widest">Regional Severity Index</p>
              {showHeatmap ? (
                <div className="space-y-3">
                  <div className="h-2 w-full rounded bg-gradient-to-r from-[#0f172a] via-[#4c1d1d] to-[#ef4444]"></div>
                  <div className="flex justify-between text-[8px] text-slate-500 mono uppercase">
                    <span>Low Exposure</span>
                    <span>Intense Conflict</span>
                  </div>
                  <div className="p-3 bg-red-950/10 border border-red-500/20 rounded-lg flex items-center gap-3">
                     <div className="w-3 h-3 rounded-full bg-red-500 blur-[2px] animate-pulse"></div>
                     <p className="text-[9px] text-slate-300 leading-tight">Kinetic Energy Hotspots: Detected ongoing armed hostilities.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded bg-[#1e1b4b] border border-sky-800 shadow-lg shadow-sky-900/20"></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-200 font-bold uppercase tracking-tight">Kinetic Hotspot</span>
                      <span className="text-[8px] text-slate-500 mono uppercase">Active high-intensity conflict</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded bg-[#0f172a] border border-slate-800"></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-200 font-bold uppercase tracking-tight">Operational Grid</span>
                      <span className="text-[8px] text-slate-500 mono uppercase">Stable / Low-level monitoring</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Strategic Assets Explanation */}
            <div>
              <p className="text-[8px] text-slate-500 uppercase mono mb-3 tracking-widest">Strategic Asset Hierarchy</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-white rotate-45 border border-slate-400 flex items-center justify-center">
                    <div className="w-1 h-1 bg-black rounded-full"></div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-200 font-bold uppercase">Tier 1 Command Hub</span>
                    <span className="text-[8px] text-slate-500 mono uppercase">Primary Sovereign Capitals</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 bg-sky-500 border border-sky-400 flex items-center justify-center"></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-200 font-bold uppercase">Tier 2 Strategic Hub</span>
                    <span className="text-[8px] text-slate-500 mono uppercase">Logistics & Regional Centers</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-500 border border-slate-400 ml-0.5"></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-200 font-bold uppercase">Tier 3 Tactical Node</span>
                    <span className="text-[8px] text-slate-500 mono uppercase">Localized Operational Points</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Transnational Signal Styles */}
            <div>
              <p className="text-[8px] text-slate-500 uppercase mono mb-3 tracking-widest">Transnational Signals</p>
              <div className="space-y-3">
                {Object.entries(CONNECTION_STYLES).map(([type, style]) => (
                  <div key={type} className="flex items-center gap-3">
                    <div className="w-8 flex items-center justify-center">
                      <div className={`w-full h-0.5 ${style.dash !== '0' ? 'border-t border-dashed' : ''}`} style={{ backgroundColor: style.dash === '0' ? style.color : 'transparent', borderColor: style.color }}></div>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[10px] text-slate-200 font-bold uppercase tracking-tight">{style.label}</span>
                       <span className="text-[8px] text-slate-500 mono uppercase">{type.toLowerCase().replace('_', ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-4 border-t border-white/5 flex flex-col gap-2">
             <div className="flex items-center justify-between text-[8px] text-slate-600 mono uppercase">
                <span>Signal Frequency</span>
                <span>4.4 - 12.0 GHz</span>
             </div>
             <div className="flex items-center justify-between text-[8px] text-slate-600 mono uppercase">
                <span>Data Integrity</span>
                <span className="text-emerald-500">OPTIMAL</span>
             </div>
          </div>
        </div>
      )}
      
      {/* City/Asset Tooltip */}
      {hoveredCity && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full mb-8 glass p-4 rounded-2xl border border-sky-500/40 shadow-2xl pointer-events-none z-50 min-w-[180px] animate-in fade-in slide-in-from-bottom-2">
          <p className="text-[9px] font-black uppercase tracking-widest text-sky-500 mb-1">Entity Identified</p>
          <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
            <span className="text-sm font-black text-white uppercase italic">{hoveredCity.name}</span>
            <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold border ${hoveredCity.tier === 1 ? 'border-white text-white' : 'border-slate-500 text-slate-400'}`}>T{hoveredCity.tier}</span>
          </div>
          <div className="space-y-1">
             <div className="flex justify-between text-[9px]"><span className="text-slate-500 uppercase">Class:</span><span className="text-slate-200 mono">{hoveredCity.type}</span></div>
             <div className="flex justify-between text-[9px]"><span className="text-slate-500 uppercase">Coords:</span><span className="text-slate-200 mono">{hoveredCity.coords[1].toFixed(2)}N, {hoveredCity.coords[0].toFixed(2)}E</span></div>
          </div>
        </div>
      )}

      {/* Connection Tooltip */}
      {hoveredConnection && !hoveredCity && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full mb-8 glass p-4 rounded-2xl border border-white/20 shadow-2xl pointer-events-none z-50 max-w-xs animate-in fade-in slide-in-from-bottom-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Signal Decrypted</p>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CONNECTION_STYLES[hoveredConnection.type]?.color || '#fff' }}></div>
            <span className="text-xs font-black text-white uppercase tracking-tighter">{hoveredConnection.type.replace('_', ' ')}</span>
          </div>
          <p className="text-[10px] text-slate-300 mt-2 leading-relaxed mono italic">"{hoveredConnection.description}"</p>
        </div>
      )}

      {/* Area Status Bar */}
      <div className="absolute bottom-8 left-8 glass p-5 rounded-2xl border border-white/10 pointer-events-none select-none">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase mono tracking-[0.3em]">Operational Area</span>
          <span className="text-2xl font-black tracking-tighter text-white uppercase italic">{hoveredCountry || 'Global Grid'}</span>
          <div className="mt-2 flex items-center gap-3">
             <div className="flex flex-col"><span className="text-[8px] text-slate-600 uppercase mono">Zoom</span><span className="text-[10px] text-sky-400 mono">{(zoomScale * 12.5).toFixed(0)}km Res</span></div>
             <div className="w-px h-6 bg-white/10"></div>
             <div className="flex flex-col"><span className="text-[8px] text-slate-600 uppercase mono">Detail</span><span className="text-[10px] text-emerald-400 mono">{zoomScale > 40 ? 'Hyper-Tactical Grid' : zoomScale > 8 ? 'Tactical Hub Recon' : 'Strategic Overview'}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapContainer;