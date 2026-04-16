"use client";

import { useState, useCallback, useEffect } from "react";
import { Wand2, Copy, Download, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  NodeTypes,
  ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";

// Custom node component for better styling
const CustomNode = ({ data }: { data: { label: string } }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-purple-300">
    <div className="font-semibold text-gray-800">{data.label}</div>
  </div>
);

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

interface MindMapNode {
  id: string;
  label: string;
  level: number;
}

interface MindMapEdge {
  source: string;
  target: string;
}

interface MindMapData {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
}

interface TransformArtifacts {
  cheat_sheet: string | null;
  mind_map: MindMapData | null;
}

interface TransformNotesProps {
  noteContent: string;
  onClose?: () => void;
  title?: string;
}

export function TransformNotes({
  noteContent,
  onClose,
  title = "Transform Notes",
}: TransformNotesProps) {
  const [isTransforming, setIsTransforming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [artifacts, setArtifacts] = useState<TransformArtifacts | null>(null);
  const [copied, setCopied] = useState<"cheat_sheet" | "mind_map" | null>(null);
  const [activeTab, setActiveTab] = useState<"cheat_sheet" | "mind_map">(
    "cheat_sheet",
  );

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance | null>(
    null,
  );

  // Validate mind map data
  const validateMindMap = useCallback(
    (mindMap: unknown): mindMap is MindMapData => {
      if (!mindMap || typeof mindMap !== "object") return false;
      const map = mindMap as Record<string, unknown>;
      if (!Array.isArray(map.nodes) || !Array.isArray(map.edges)) return false;

      // Validate nodes
      for (const node of map.nodes as unknown[]) {
        const n = node as Record<string, unknown>;
        if (!n.id || !n.label || typeof n.level !== "number") return false;
      }

      // Validate edges
      for (const edge of map.edges as unknown[]) {
        const e = edge as Record<string, unknown>;
        if (!e.source || !e.target) return false;
      }

      return true;
    },
    [],
  );

  // Tree layout function for positioning nodes
  const calculateNodePositions = useCallback((mindMapNodes: MindMapNode[]) => {
    const positions: { [key: string]: { x: number; y: number } } = {};
    const levelNodes: { [key: number]: MindMapNode[] } = {};

    // Group nodes by level
    mindMapNodes.forEach((node) => {
      if (!levelNodes[node.level]) levelNodes[node.level] = [];
      levelNodes[node.level].push(node);
    });

    // Calculate positions for each level
    const levels = Object.keys(levelNodes)
      .map(Number)
      .sort((a, b) => a - b);
    const nodeWidth = 200;
    const levelSpacing = 150;

    levels.forEach((level) => {
      const nodesAtLevel = levelNodes[level];
      const levelWidth = nodesAtLevel.length * nodeWidth;
      const startX = -levelWidth / 2;
      const y = level * levelSpacing;

      nodesAtLevel.forEach((node, index) => {
        positions[node.id] = {
          x: startX + index * nodeWidth + nodeWidth / 2,
          y: y,
        };
      });
    });

    return positions;
  }, []);

  // Create React Flow nodes and edges with proper layout
  const createFlowElements = useCallback(
    (mindMap: MindMapData) => {
      if (!mindMap) return { nodes: [], edges: [] };

      const positions = calculateNodePositions(mindMap.nodes);

      const flowNodes: Node[] = mindMap.nodes.map((node) => ({
        id: node.id,
        type: "custom",
        position: positions[node.id] || { x: 0, y: 0 },
        data: { label: node.label },
        style: {
          background: node.level === 0 ? "#7c3aed" : "#374151",
          color: node.level === 0 ? "#ffffff" : "#e5e7eb",
          border: "2px solid #a855f7",
          borderRadius: "8px",
          padding: "8px 12px",
          fontSize: node.level === 0 ? "14px" : "12px",
          fontWeight: node.level === 0 ? "bold" : "normal",
        },
      }));

      const flowEdges: Edge[] = mindMap.edges.map((edge, index) => ({
        id: `edge-${index}`,
        source: edge.source,
        target: edge.target,
        type: "smoothstep",
        style: { stroke: "#a855f7", strokeWidth: 2 },
        animated: false,
      }));

      return { nodes: flowNodes, edges: flowEdges };
    },
    [calculateNodePositions],
  );

  // Update React Flow state when mind map data changes
  useEffect(() => {
    if (artifacts?.mind_map) {
      const { nodes: flowNodes, edges: flowEdges } = createFlowElements(
        artifacts.mind_map,
      );
      setNodes(flowNodes);
      setEdges(flowEdges);
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [artifacts?.mind_map, createFlowElements, setNodes, setEdges]);

  // Trigger fitView when nodes are loaded
  useEffect(() => {
    if (flowInstance && nodes.length > 0 && activeTab === "mind_map") {
      setTimeout(() => {
        flowInstance.fitView({ padding: 0.2, includeHiddenNodes: false });
      }, 100);
    }
  }, [nodes, flowInstance, activeTab]);

  const handleTransform = async () => {
    setIsTransforming(true);
    setError(null);

    try {
      const response = await fetch("/api/transform-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteContent }),
      });

      if (response.status === 429) {
        setError("Service is rate limited. Please try again in a moment.");
        return;
      }

      if (!response.ok) {
        try {
          const errorData = await response.json();
          setError(
            errorData.detail?.message || `Error: ${response.statusText}`,
          );
        } catch {
          // If response body is not JSON (e.g., HTML error page)
          setError(`Error: ${response.status} ${response.statusText}`);
        }
        return;
      }

      const data = await response.json();
      if (data.success) {
        // Validate mind map data
        if (
          data.artifacts.mind_map &&
          !validateMindMap(data.artifacts.mind_map)
        ) {
          console.warn("Invalid mind map data received, using fallback");
          data.artifacts.mind_map = null;
        }
        setArtifacts(data.artifacts);
      } else {
        setError("Failed to transform notes");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to transform notes",
      );
    } finally {
      setIsTransforming(false);
    }
  };

  const handleCopy = (
    text: string | object,
    type: "cheat_sheet" | "mind_map",
  ) => {
    navigator.clipboard.writeText(
      type === "mind_map" ? JSON.stringify(text, null, 2) : (text as string),
    );
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = (
    text: string | object,
    type: "cheat_sheet" | "mind_map",
  ) => {
    const content =
      type === "mind_map" ? JSON.stringify(text, null, 2) : (text as string);
    const filename =
      type === "cheat_sheet" ? "cheat-sheet.md" : "mind-map.json";
    const blob = new Blob([content], {
      type: type === "cheat_sheet" ? "text/markdown" : "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // React Flow callbacks
  const onInit = useCallback((reactFlowInstance: ReactFlowInstance) => {
    setFlowInstance(reactFlowInstance);
    // Fit view on initialization with some delay to ensure nodes are rendered
    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2, includeHiddenNodes: false });
    }, 200);
  }, []);

  if (!artifacts) {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <Wand2 size={32} className="text-purple-400" />
        <h3 className="text-lg font-semibold text-gray-200">{title}</h3>
        <p className="text-center text-sm text-gray-400 max-w-md">
          Transform your study notes into specialized formats:
          <br /> Cheat Sheet + Interactive Mind Map
        </p>
        {error && (
          <div className="w-full max-w-md rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          </div>
        )}
        <button
          onClick={handleTransform}
          disabled={isTransforming}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 font-semibold transition ${
            isTransforming
              ? "cursor-not-allowed bg-gray-700 text-gray-500"
              : "bg-purple-600 text-white hover:bg-purple-700"
          }`}
        >
          {isTransforming ? "Transforming..." : "Transform Notes"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700">
        <button
          onClick={() => setActiveTab("cheat_sheet")}
          disabled={!artifacts.cheat_sheet}
          className={`px-4 py-2 font-semibold transition ${
            activeTab === "cheat_sheet"
              ? "border-b-2 border-purple-400 text-purple-300"
              : "text-gray-400 hover:text-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
          }`}
        >
          Cheat Sheet
        </button>
        <button
          onClick={() => setActiveTab("mind_map")}
          disabled={!artifacts.mind_map}
          className={`px-4 py-2 font-semibold transition ${
            activeTab === "mind_map"
              ? "border-b-2 border-purple-400 text-purple-300"
              : "text-gray-400 hover:text-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
          }`}
        >
          Mind Map
        </button>
      </div>

      {/* Content Area */}
      <div className="max-h-96 overflow-hidden rounded-lg border border-gray-700 bg-gray-800/30">
        {activeTab === "cheat_sheet" && artifacts.cheat_sheet ? (
          <div className="h-full overflow-y-auto p-4">
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ ...props }) => (
                    <h1
                      className="mt-6 mb-4 text-2xl font-bold text-purple-300"
                      {...props}
                    />
                  ),
                  h2: ({ ...props }) => (
                    <h2
                      className="mt-4 mb-2 text-lg font-bold text-purple-300"
                      {...props}
                    />
                  ),
                  h3: ({ ...props }) => (
                    <h3
                      className="mt-3 mb-1 text-base font-semibold text-purple-200"
                      {...props}
                    />
                  ),
                  p: ({ ...props }) => (
                    <p className="mb-2 text-gray-300" {...props} />
                  ),
                  ul: ({ ...props }) => (
                    <ul
                      className="mb-2 list-inside list-disc space-y-1 text-gray-300"
                      {...props}
                    />
                  ),
                  li: ({ ...props }) => (
                    <li className="text-sm text-gray-300" {...props} />
                  ),
                  code: ({ ...props }) => (
                    <code
                      className="rounded bg-gray-900 px-1 py-0.5 font-mono text-sm text-purple-200"
                      {...props}
                    />
                  ),
                }}
              >
                {artifacts.cheat_sheet}
              </ReactMarkdown>
            </div>
          </div>
        ) : activeTab === "mind_map" && artifacts.mind_map ? (
          <div className="relative w-full h-96">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onInit={onInit}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.2, includeHiddenNodes: false }}
              className="bg-gray-900"
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={true}
              minZoom={0.1}
              maxZoom={2}
            >
              <Controls
                className="bg-gray-800 border-gray-600"
                showZoom={true}
                showFitView={true}
                showInteractive={false}
              />
              <Background color="#374151" gap={20} />
            </ReactFlow>
            <div className="absolute top-2 right-2 bg-gray-800 rounded-lg p-2 text-xs text-gray-400">
              {nodes.length} nodes • {edges.length} connections
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>No content available</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            const content =
              activeTab === "cheat_sheet"
                ? artifacts.cheat_sheet
                : artifacts.mind_map;
            if (content) {
              handleCopy(content, activeTab);
            }
          }}
          className="flex items-center gap-2 rounded-lg bg-gray-700 px-3 py-2 text-sm hover:bg-gray-600 transition"
        >
          <Copy size={16} />
          {copied === activeTab ? "Copied!" : "Copy"}
        </button>
        <button
          onClick={() => {
            const content =
              activeTab === "cheat_sheet"
                ? artifacts.cheat_sheet
                : artifacts.mind_map;
            if (content) {
              handleDownload(content, activeTab);
            }
          }}
          className="flex items-center gap-2 rounded-lg bg-gray-700 px-3 py-2 text-sm hover:bg-gray-600 transition"
        >
          <Download size={16} />
          Download
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto rounded-lg bg-gray-700 px-3 py-2 text-sm hover:bg-gray-600 transition"
          >
            Close
          </button>
        )}
      </div>

      {/* Transform Again Button */}
      <button
        onClick={handleTransform}
        disabled={isTransforming}
        className={`w-full rounded-lg px-4 py-2 font-semibold transition ${
          isTransforming
            ? "cursor-not-allowed bg-gray-700 text-gray-500"
            : "bg-purple-600 text-white hover:bg-purple-700"
        }`}
      >
        {isTransforming ? "Transforming..." : "Transform Again"}
      </button>
    </div>
  );
}
