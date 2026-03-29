"use client";

import { useMemo } from "react";

interface MindMapViewProps {
    content: string;
}

interface MindMapNode {
    id: string;
    text: string;
    children: MindMapNode[];
    level: number;
}

export function MindMapView({ content }: MindMapViewProps) {
    const mindMapData = useMemo(() => parseMindMap(content), [content]);

    return (
        <div
            id="mindmap-container"
            className="w-full h-full overflow-auto bg-gray-900 p-6"
        >
            <div className="min-h-full flex items-center justify-center">
                <MindMapRenderer data={mindMapData} />
            </div>
        </div>
    );
}

/**
 * Parse markdown content into a tree structure for mind map visualization
 * Headings represent nodes, with hierarchy determined by heading level
 */
function parseMindMap(content: string): MindMapNode {
    const lines = content.split("\n");
    const root: MindMapNode = {
        id: "root",
        text: "Main Topic",
        children: [],
        level: 0,
    };

    let currentParent = root;
    const levelStack: MindMapNode[] = [root];

    let nodeId = 1;

    for (const line of lines) {
        const headingMatch = line.match(/^(#+)\s+(.+)$/);
        if (!headingMatch) continue;

        const level = headingMatch[1].length;
        const text = headingMatch[2].trim();

        const newNode: MindMapNode = {
            id: `node-${nodeId++}`,
            text,
            children: [],
            level,
        };

        // Find the correct parent based on heading level
        while (levelStack.length > level) {
            levelStack.pop();
        }

        currentParent = levelStack[levelStack.length - 1];
        currentParent.children.push(newNode);
        levelStack.push(newNode);
    }

    return root;
}

interface MindMapRendererProps {
    data: MindMapNode;
    x?: number;
    y?: number;
    offsetX?: number;
}

/**
 * Recursive mind map renderer using SVG and DOM elements
 * Creates a visual tree structure of the content
 */
function MindMapRenderer({
    data,
    x = 0,
    y = 0,
}: MindMapRendererProps) {
    const nodeWidth = 160;
    const nodeHeight = 60;
    const levelHeight = 120;
    const horizontalSpacing = 200;

    // Calculate positions for children
    const childPositions = data.children.map((_, index) => {
        const totalChildren = data.children.length;
        const startX = x - (totalChildren * horizontalSpacing) / 2;
        return {
            x: startX + index * horizontalSpacing,
            y: y + levelHeight,
        };
    });

    return (
        <svg
            className="w-full h-full min-w-max min-h-max"
            style={{ minWidth: "800px", minHeight: "600px" }}
        >
            {/* Draw connections to children */}
            {data.children.map((_, index) => (
                <line
                    key={`line-${index}`}
                    x1={x}
                    y1={y + nodeHeight / 2}
                    x2={childPositions[index]?.x || 0}
                    y2={childPositions[index]?.y || 0}
                    stroke="#60a5fa"
                    strokeWidth="2"
                    opacity="0.6"
                />
            ))}

            {/* Render current node */}
            <g>
                <rect
                    x={x - nodeWidth / 2}
                    y={y}
                    width={nodeWidth}
                    height={nodeHeight}
                    rx="8"
                    fill={
                        data.level === 0
                            ? "#2563eb"
                            : data.level === 1
                                ? "#3b82f6"
                                : data.level === 2
                                    ? "#60a5fa"
                                    : "#93c5fd"
                    }
                    stroke="#fff"
                    strokeWidth="2"
                />
                <text
                    x={x}
                    y={y + nodeHeight / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#fff"
                    fontSize="12"
                    fontWeight="bold"
                    className="pointer-events-none select-none"
                    style={{
                        wordWrap: "break-word",
                        maxWidth: nodeWidth - 10,
                        whiteSpace: "pre-wrap",
                    }}
                >
                    {/* Split text into multiple lines if needed */}
                    {data.text.length > 20
                        ? data.text.substring(0, 18) + "..."
                        : data.text}
                </text>
            </g>

            {/* Render children recursively */}
            {data.children.map((child, index) => (
                <MindMapRenderer
                    key={child.id}
                    data={child}
                    x={childPositions[index]?.x || 0}
                    y={childPositions[index]?.y || 0}
                />
            ))}
        </svg>
    );
}

/**
 * Placeholder component showing mind map capabilities
 * In a production app, you would integrate with:
 * - react-flow-renderer for interactive node graphs
 * - mermaid for diagram rendering
 * - cytoscape.js for network visualization
 */
