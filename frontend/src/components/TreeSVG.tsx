/**
 * TreeSVG Component
 * 
 * Main SVG container that renders the family tree:
 * - Handles pan and zoom via transform
 * - Renders connections layer (lines between family members)
 * - Renders person nodes
 * - Manages hover state for highlighting relationships
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PersonNode } from './PersonNode';
import { ConnectionsLayer } from './Connectors';
import { computeLayout } from '../utils/layoutEngine';
import type { FamilyTree, TransformState } from '../types';

interface TreeSVGProps {
  familyTree: FamilyTree;
  focusedPersonId: string;
  transform: TransformState;
  onPersonClick: (personId: string) => void;
  onAddSpouse: (personId: string) => void;
  onAddChild: (personId: string) => void;
  onAddParent: (personId: string) => void;
  onEditPerson: (personId: string) => void;
  onDeletePerson: (personId: string) => void;
}

/**
 * Check if a person has parents in the tree.
 */
function personHasParents(personId: string, people: Record<string, { childrenIds: string[] }>): boolean {
  for (const person of Object.values(people)) {
    if (person.childrenIds.includes(personId)) {
      return true;
    }
  }
  return false;
}

export function TreeSVG({
  familyTree,
  focusedPersonId,
  transform,
  onPersonClick,
  onAddSpouse,
  onAddChild,
  onAddParent,
  onEditPerson,
  onDeletePerson,
}: TreeSVGProps) {
  const [hoveredPersonId, setHoveredPersonId] = useState<string | null>(null);
  
  // Compute layout based on focused person
  const layout = useMemo(() => {
    return computeLayout(focusedPersonId, familyTree);
  }, [focusedPersonId, familyTree]);

  // Calculate SVG viewBox with padding
  const viewBoxPadding = 200;
  const viewBox = useMemo(() => {
    const { bounds } = layout;
    return `${bounds.minX - viewBoxPadding} ${bounds.minY - viewBoxPadding} ${bounds.width + viewBoxPadding * 2} ${bounds.height + viewBoxPadding * 2}`;
  }, [layout]);

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      style={{ overflow: 'visible' }}
    >
      {/* Background pattern */}
      <defs>
        <pattern
          id="grid-pattern"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="20" cy="20" r="1" fill="rgba(255,255,255,0.05)" />
        </pattern>
        
        {/* Gradient for background depth */}
        <radialGradient id="bg-gradient" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="rgba(66, 153, 225, 0.05)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      
      {/* Background */}
      <rect
        x={layout.bounds.minX - 1000}
        y={layout.bounds.minY - 1000}
        width={layout.bounds.width + 2000}
        height={layout.bounds.height + 2000}
        fill="url(#grid-pattern)"
      />
      <rect
        x={layout.bounds.minX - 500}
        y={layout.bounds.minY - 500}
        width={layout.bounds.width + 1000}
        height={layout.bounds.height + 1000}
        fill="url(#bg-gradient)"
      />
      
      {/* Main transform group for pan/zoom */}
      <motion.g
        animate={{
          x: transform.x,
          y: transform.y,
          scale: transform.scale,
        }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 30,
        }}
        style={{ transformOrigin: 'center center' }}
      >
        {/* Connections layer (rendered behind nodes) */}
        <ConnectionsLayer
          connections={layout.connections}
          hoveredPersonId={hoveredPersonId}
        />
        
        {/* Person nodes */}
        <AnimatePresence mode="popLayout">
          {layout.nodes.map((node) => (
            <PersonNode
              key={node.person.id}
              node={node}
              isHovered={hoveredPersonId === node.person.id}
              hasParents={personHasParents(node.person.id, familyTree.people)}
              onHover={setHoveredPersonId}
              onClick={onPersonClick}
              onAddSpouse={onAddSpouse}
              onAddChild={onAddChild}
              onAddParent={onAddParent}
              onEdit={onEditPerson}
              onDelete={onDeletePerson}
            />
          ))}
        </AnimatePresence>
      </motion.g>
    </svg>
  );
}

