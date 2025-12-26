/**
 * Control Components
 * 
 * UI controls for:
 * - Navigation (back/forward, breadcrumb)
 * - Zoom controls
 * - Tree actions
 */

import { motion } from 'framer-motion';
import type { Person, FamilyTree } from '../types';

interface NavigationControlsProps {
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  focusedPerson: Person | null;
  familyTree: FamilyTree | null;
}

const buttonStyle: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: '8px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(255, 255, 255, 0.05)',
  color: '#e2e8f0',
  fontSize: '14px',
  fontFamily: 'Outfit, sans-serif',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'all 0.2s',
};

const disabledStyle: React.CSSProperties = {
  ...buttonStyle,
  opacity: 0.4,
  cursor: 'not-allowed',
};

export function NavigationControls({
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  focusedPerson,
}: NavigationControlsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 20px',
        background: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        zIndex: 100,
      }}
    >
      {/* Back button */}
      <button
        onClick={onBack}
        disabled={!canGoBack}
        style={canGoBack ? buttonStyle : disabledStyle}
        title="Go back"
      >
        ←
      </button>
      
      {/* Current person indicator */}
      {focusedPerson && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '0 16px',
        }}>
          <span style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: focusedPerson.gender === 'male' ? '#3b82f6' : '#a855f7',
          }} />
          <span style={{
            color: '#f1f5f9',
            fontSize: '16px',
            fontWeight: 500,
            fontFamily: 'Outfit, sans-serif',
          }}>
            {focusedPerson.name}
          </span>
          {focusedPerson.birthDate && (
            <span style={{
              color: '#64748b',
              fontSize: '14px',
              fontFamily: 'Crimson Pro, serif',
              fontStyle: 'italic',
            }}>
              (b. {new Date(focusedPerson.birthDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
            </span>
          )}
        </div>
      )}
      
      {/* Forward button */}
      <button
        onClick={onForward}
        disabled={!canGoForward}
        style={canGoForward ? buttonStyle : disabledStyle}
        title="Go forward"
      >
        →
      </button>
    </motion.div>
  );
}

interface ZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export function ZoomControls({
  scale,
  onZoomIn,
  onZoomOut,
  onReset,
}: ZoomControlsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px',
        background: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        zIndex: 100,
      }}
    >
      <button
        onClick={onZoomIn}
        style={buttonStyle}
        title="Zoom in"
      >
        +
      </button>
      
      <div style={{
        textAlign: 'center',
        color: '#64748b',
        fontSize: '12px',
        fontFamily: 'Outfit, sans-serif',
        padding: '4px 0',
      }}>
        {Math.round(scale * 100)}%
      </div>
      
      <button
        onClick={onZoomOut}
        style={buttonStyle}
        title="Zoom out"
      >
        −
      </button>
      
      <button
        onClick={onReset}
        style={{
          ...buttonStyle,
          fontSize: '12px',
          padding: '8px',
        }}
        title="Reset view"
      >
        ⟲
      </button>
    </motion.div>
  );
}

interface TreeActionsProps {
  onOpenTreeSelector: () => void;
  onCreateTree: () => void;
  hasTree: boolean;
}

export function TreeActions({
  onOpenTreeSelector,
  onCreateTree,
  hasTree,
}: TreeActionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        display: 'flex',
        gap: '12px',
        zIndex: 100,
      }}
    >
      <button
        onClick={onOpenTreeSelector}
        style={{
          ...buttonStyle,
          background: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(10px)',
        }}
      >
        📁 {hasTree ? 'Switch Tree' : 'Load Tree'}
      </button>
      
      <button
        onClick={onCreateTree}
        style={{
          ...buttonStyle,
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          border: 'none',
        }}
      >
        + New Tree
      </button>
    </motion.div>
  );
}

interface HelpOverlayProps {
  isVisible: boolean;
}

export function HelpOverlay({ isVisible }: HelpOverlayProps) {
  if (!isVisible) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'absolute',
        top: '80px',
        left: '20px',
        padding: '16px 20px',
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        zIndex: 100,
        maxWidth: '280px',
      }}
    >
      <h3 style={{
        color: '#f1f5f9',
        fontSize: '14px',
        fontWeight: 600,
        fontFamily: 'Outfit, sans-serif',
        marginBottom: '12px',
      }}>
        Quick Tips
      </h3>
      <ul style={{
        color: '#94a3b8',
        fontSize: '13px',
        fontFamily: 'Crimson Pro, serif',
        lineHeight: 1.6,
        paddingLeft: '16px',
        margin: 0,
      }}>
        <li>Click a person to focus on them</li>
        <li>Hover to see action buttons</li>
        <li>Drag to pan the view</li>
        <li>Scroll to zoom in/out</li>
        <li>Use ← → to navigate history</li>
      </ul>
    </motion.div>
  );
}

