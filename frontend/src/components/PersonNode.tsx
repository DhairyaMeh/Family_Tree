/**
 * PersonNode Component
 * 
 * Renders an individual person as an SVG group with:
 * - Dynamic width based on name length
 * - Rectangular card background
 * - Name and details
 * - Gender indicator
 * - Alive/deceased status
 * - Hover and focus states
 * - Dynamic action buttons (only shows available options)
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { LayoutNode, Person } from '../types';

interface PersonNodeProps {
  node: LayoutNode;
  isHovered: boolean;
  hasParents: boolean;
  onHover: (personId: string | null) => void;
  onClick: (personId: string) => void;
  onAddSpouse: (personId: string) => void;
  onAddChild: (personId: string) => void;
  onAddParent: (personId: string) => void;
  onEdit: (personId: string) => void;
  onDelete: (personId: string) => void;
}

// Spring animation config for Workday-like smooth motion
const springConfig = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
  mass: 1,
};

// Action button configuration
interface ActionButton {
  id: string;
  emoji: string;
  color: string;
  title: string;
  onClick: (e: React.MouseEvent) => void;
}

export function PersonNode({
  node,
  isHovered,
  hasParents,
  onHover,
  onClick,
  onAddSpouse,
  onAddChild,
  onAddParent,
  onEdit,
  onDelete,
}: PersonNodeProps) {
  const [showActions, setShowActions] = useState(false);
  const { person, x, y, width, height, isFocused } = node;
  
  // Calculate card position (centered on x, y)
  const cardX = x - width / 2;
  const cardY = y - height / 2;
  
  // Build dynamic action buttons based on what's available
  const actionButtons = useMemo((): ActionButton[] => {
    const buttons: ActionButton[] = [];
    
    // Add parent button - only if person doesn't have parents
    if (!hasParents) {
      buttons.push({
        id: 'add-parent',
        emoji: '👴',
        color: '#f6ad55',
        title: 'Add Parent (Ancestor)',
        onClick: (e) => {
          e.stopPropagation();
          onAddParent(person.id);
        },
      });
    }
    
    // Add spouse button - only if person doesn't have a spouse
    if (!person.spouseId) {
      buttons.push({
        id: 'add-spouse',
        emoji: '💍',
        color: '#b794f4',
        title: 'Add Spouse',
        onClick: (e) => {
          e.stopPropagation();
          onAddSpouse(person.id);
        },
      });
    }
    
    // Add child button - always available
    buttons.push({
      id: 'add-child',
      emoji: '👶',
      color: '#48bb78',
      title: 'Add Child',
      onClick: (e) => {
        e.stopPropagation();
        onAddChild(person.id);
      },
    });
    
    // Edit button - always available
    buttons.push({
      id: 'edit',
      emoji: '✏️',
      color: '#4299e1',
      title: 'Edit',
      onClick: (e) => {
        e.stopPropagation();
        onEdit(person.id);
      },
    });
    
    // Delete button - always available
    buttons.push({
      id: 'delete',
      emoji: '🗑',
      color: '#fc8181',
      title: 'Delete',
      onClick: (e) => {
        e.stopPropagation();
        onDelete(person.id);
      },
    });
    
    return buttons;
  }, [hasParents, person.id, person.spouseId, onAddParent, onAddSpouse, onAddChild, onEdit, onDelete]);
  
  // Calculate action bar width based on number of buttons
  const buttonWidth = 22;
  const buttonPadding = 8;
  const actionBarWidth = actionButtons.length * buttonWidth + buttonPadding * 2;
  
  // Color scheme based on gender and state
  const getColors = (person: Person, isFocused: boolean, isHovered: boolean) => {
    const baseColors = person.gender === 'male'
      ? { bg: '#1a365d', border: '#2c5282', text: '#e2e8f0', accent: '#4299e1' }
      : { bg: '#553c5e', border: '#744a7f', text: '#faf5ff', accent: '#b794f4' };
    
    if (isFocused) {
      return {
        ...baseColors,
        bg: person.gender === 'male' ? '#2c5282' : '#744a7f',
        border: person.gender === 'male' ? '#4299e1' : '#b794f4',
        glow: person.gender === 'male' ? 'rgba(66, 153, 225, 0.4)' : 'rgba(183, 148, 244, 0.4)',
      };
    }
    
    if (isHovered) {
      return {
        ...baseColors,
        border: baseColors.accent,
      };
    }
    
    return baseColors;
  };
  
  const colors = getColors(person, isFocused, isHovered);
  
  // Status indicator
  const statusColor = person.alive !== false ? '#48bb78' : '#a0aec0';
  
  // Get initials for avatar
  const initials = person.name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  
  // Calculate text truncation based on width
  const maxNameChars = Math.floor((width - 80) / 8);
  const displayName = person.name.length > maxNameChars 
    ? person.name.slice(0, maxNameChars - 2) + '...' 
    : person.name;

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        x: cardX,
        y: cardY,
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={springConfig}
      onMouseEnter={() => {
        onHover(person.id);
        setShowActions(true);
      }}
      onMouseLeave={() => {
        onHover(null);
        setShowActions(false);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(person.id);
      }}
      style={{ cursor: 'pointer' }}
      layoutId={`person-${person.id}`}
    >
      {/* Card shadow */}
      <motion.rect
        x={3}
        y={3}
        width={width}
        height={height}
        rx={12}
        fill="rgba(0,0,0,0.2)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />
      
      {/* Glow effect for focused node */}
      {isFocused && (
        <motion.rect
          x={-4}
          y={-4}
          width={width + 8}
          height={height + 8}
          rx={14}
          fill="none"
          stroke={colors.glow}
          strokeWidth={6}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      
      {/* Main card background */}
      <motion.rect
        x={0}
        y={0}
        width={width}
        height={height}
        rx={12}
        fill={colors.bg}
        stroke={colors.border}
        strokeWidth={isFocused ? 3 : 2}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      />
      
      {/* Avatar circle with initials */}
      <circle
        cx={32}
        cy={height / 2}
        r={22}
        fill={colors.accent}
        opacity={0.3}
      />
      <text
        x={32}
        y={height / 2 + 5}
        textAnchor="middle"
        fill={colors.text}
        fontSize={13}
        fontWeight={600}
        fontFamily="Outfit, sans-serif"
      >
        {initials}
      </text>
      
      {/* Status indicator dot */}
      <circle
        cx={48}
        cy={height / 2 - 16}
        r={4}
        fill={statusColor}
      />
      
      {/* Name */}
      <text
        x={62}
        y={height / 2 - 6}
        fill={colors.text}
        fontSize={13}
        fontWeight={600}
        fontFamily="Outfit, sans-serif"
      >
        {displayName}
      </text>
      
      {/* Birth year */}
      {person.birthYear && (
        <text
          x={62}
          y={height / 2 + 12}
          fill={colors.text}
          fontSize={10}
          opacity={0.7}
          fontFamily="Crimson Pro, serif"
          fontStyle="italic"
        >
          b. {person.birthYear}
        </text>
      )}
      
      {/* Gender icon */}
      <text
        x={width - 20}
        y={height / 2 + 4}
        fill={colors.accent}
        fontSize={14}
        fontFamily="system-ui"
      >
        {person.gender === 'male' ? '♂' : '♀'}
      </text>
      
      {/* Dynamic action buttons - shown on hover */}
      {showActions && (
        <motion.g
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* Action button background - dynamic width */}
          <rect
            x={width - actionBarWidth}
            y={-30}
            width={actionBarWidth}
            height={26}
            rx={6}
            fill="rgba(0,0,0,0.85)"
          />
          
          {/* Render only available action buttons */}
          {actionButtons.map((button, index) => (
            <g
              key={button.id}
              onClick={button.onClick}
              style={{ cursor: 'pointer' }}
            >
              <title>{button.title}</title>
              <text
                x={width - actionBarWidth + buttonPadding + index * buttonWidth + buttonWidth / 2 - 6}
                y={-12}
                fill={button.color}
                fontSize={13}
              >
                {button.emoji}
              </text>
            </g>
          ))}
        </motion.g>
      )}
    </motion.g>
  );
}
