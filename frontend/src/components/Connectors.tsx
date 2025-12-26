/**
 * Connection Components
 * 
 * Render relationship lines between family members:
 * - SpouseConnector: Horizontal line between spouses
 * - ParentChildConnector: Vertical/elbow lines from parents to children
 */

import { motion } from 'framer-motion';
import type { Connection } from '../types';

interface SpouseConnectorProps {
  connection: Connection;
  isHighlighted: boolean;
}

interface ParentChildConnectorProps {
  connection: Connection;
  isHighlighted: boolean;
}

// Animation config for smooth line drawing
const pathAnimation = {
  initial: { pathLength: 0, opacity: 0 },
  animate: { pathLength: 1, opacity: 1 },
  exit: { pathLength: 0, opacity: 0 },
  transition: {
    pathLength: { type: 'spring', stiffness: 200, damping: 30 },
    opacity: { duration: 0.3 },
  },
};

/**
 * SpouseConnector renders a horizontal line with a heart symbol
 * connecting two spouses.
 */
export function SpouseConnector({ connection, isHighlighted }: SpouseConnectorProps) {
  const { from, to } = connection;
  
  // Simple horizontal line between spouses
  const midX = (from.x + to.x) / 2;
  const midY = from.y;
  
  const strokeColor = isHighlighted ? '#e9a8c9' : '#9f7aea';
  const strokeWidth = isHighlighted ? 3 : 2;
  
  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Connection line */}
      <motion.line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        {...pathAnimation}
      />
      
      {/* Heart symbol at midpoint */}
      <motion.g
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
      >
        <circle
          cx={midX}
          cy={midY}
          r={10}
          fill="#1a202c"
        />
        <text
          x={midX}
          y={midY + 4}
          textAnchor="middle"
          fontSize={12}
          fill="#e9a8c9"
        >
          ♥
        </text>
      </motion.g>
    </motion.g>
  );
}

/**
 * ParentChildConnector renders an elbow-style connection
 * from a parent (or couple) down to a child.
 */
export function ParentChildConnector({ connection, isHighlighted }: ParentChildConnectorProps) {
  const { from, to } = connection;
  
  // Create an elbow path: down from parent, horizontal to align, down to child
  const midY = from.y + (to.y - from.y) / 2;
  
  // Path: start at parent bottom, go down to midpoint, horizontal to child x, down to child top
  const path = `
    M ${from.x} ${from.y}
    L ${from.x} ${midY}
    L ${to.x} ${midY}
    L ${to.x} ${to.y}
  `;
  
  const strokeColor = isHighlighted ? '#68d391' : '#4a5568';
  const strokeWidth = isHighlighted ? 3 : 2;
  
  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Shadow path for depth */}
      <motion.path
        d={path}
        fill="none"
        stroke="rgba(0,0,0,0.2)"
        strokeWidth={strokeWidth + 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transform: 'translate(2px, 2px)' }}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      />
      
      {/* Main path */}
      <motion.path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ 
          pathLength: { duration: 0.5, ease: 'easeOut' },
          opacity: { duration: 0.3 }
        }}
      />
      
      {/* Arrow/circle at child end */}
      <motion.circle
        cx={to.x}
        cy={to.y}
        r={4}
        fill={strokeColor}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 400 }}
      />
    </motion.g>
  );
}

/**
 * ConnectionsLayer renders all connections in the tree.
 */
interface ConnectionsLayerProps {
  connections: Connection[];
  hoveredPersonId: string | null;
}

export function ConnectionsLayer({ connections, hoveredPersonId }: ConnectionsLayerProps) {
  return (
    <g className="connections-layer">
      {connections.map((connection) => {
        const isHighlighted = 
          hoveredPersonId === connection.fromId || 
          hoveredPersonId === connection.toId;
        
        if (connection.type === 'spouse') {
          return (
            <SpouseConnector
              key={connection.id}
              connection={connection}
              isHighlighted={isHighlighted}
            />
          );
        }
        
        return (
          <ParentChildConnector
            key={connection.id}
            connection={connection}
            isHighlighted={isHighlighted}
          />
        );
      })}
    </g>
  );
}

