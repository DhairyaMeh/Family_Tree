/**
 * SharedTree - View a tree shared via link
 * This component loads a tree by its share token and displays it in read-only mode
 * If the user owns the tree, they can edit it
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TreeSVG } from '../components/TreeSVG';
import { NavigationControls, ZoomControls } from '../components/Controls';
import { useNavigation } from '../hooks/useNavigation';
import { useTransform } from '../hooks/useTransform';
import { useAuth } from '../context/AuthContext';
import type { FamilyTree, Person } from '../types';

const API_BASE = '/api';

export default function SharedTree() {
  const { token } = useParams<{ token: string }>();
  const { user, token: authToken } = useAuth();
  const [tree, setTree] = useState<FamilyTree | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  // Navigation state
  const {
    focusedPersonId,
    navigateTo,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
    resetNavigation,
  } = useNavigation();

  // Transform state for pan/zoom
  const {
    transform,
    containerRef,
    zoom,
    reset: resetTransform,
  } = useTransform({ x: 0, y: 0, scale: 0.8 });

  // Load tree by share token
  useEffect(() => {
    async function loadSharedTree() {
      if (!token) {
        setError('No share token provided');
        setIsLoading(false);
        return;
      }

      try {
        // Include auth token if user is logged in to check ownership
        const headers: Record<string, string> = {};
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(`${API_BASE}/tree/shared?token=${token}`, { headers });
        const data = await response.json();

        if (data.success && data.data) {
          setTree(data.data);
          
          // Check if current user owns this tree
          if (user && data.data.ownerId === user._id) {
            setIsOwner(true);
          }
          
          if (data.data.rootId) {
            resetNavigation(data.data.rootId);
          }
        } else {
          setError(data.error || 'Tree not found or access denied');
        }
      } catch (err) {
        setError('Failed to load shared tree');
      } finally {
        setIsLoading(false);
      }
    }

    loadSharedTree();
  }, [token, resetNavigation, authToken, user]);

  // Handle clicking on a person node - focus on them
  const handlePersonClick = useCallback((personId: string) => {
    navigateTo(personId);
  }, [navigateTo]);

  // Get focused person data
  const focusedPerson = tree && focusedPersonId ? tree.people[focusedPersonId] : null;

  // Check if person has parents
  const personHasParents = useCallback((personId: string): boolean => {
    if (!tree) return false;
    return Object.values(tree.people).some(
      (p: Person) => p.childrenIds?.includes(personId)
    );
  }, [tree]);

  // Dummy handlers for TreeSVG (read-only mode)
  const noOp = () => {};

  if (isLoading) {
    return (
      <div className="shared-tree-page">
        <div className="loading-state">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ fontSize: '48px' }}
          >
            🌳
          </motion.div>
          <p>Loading shared tree...</p>
        </div>
        <style>{sharedTreeStyles}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shared-tree-page">
        <div className="error-state">
          <span style={{ fontSize: '64px', marginBottom: '20px' }}>🔒</span>
          <h2>Access Denied</h2>
          <p>{error}</p>
          <Link to="/" className="btn-home">Go to Home</Link>
        </div>
        <style>{sharedTreeStyles}</style>
      </div>
    );
  }

  if (!tree) {
    return (
      <div className="shared-tree-page">
        <div className="error-state">
          <span style={{ fontSize: '64px', marginBottom: '20px' }}>🌲</span>
          <h2>Tree Not Found</h2>
          <p>This shared tree doesn't exist or has been deleted.</p>
          <Link to="/" className="btn-home">Go to Home</Link>
        </div>
        <style>{sharedTreeStyles}</style>
      </div>
    );
  }

  return (
    <div className="shared-tree-page" ref={containerRef}>
      {/* Header */}
      <header className="shared-header">
        <div className="header-left">
          <Link to="/" className="logo">🌳 Family Tree</Link>
          {isOwner ? (
            <span className="owner-badge">✏️ Your Tree</span>
          ) : (
            <span className="shared-badge">👁️ Shared View</span>
          )}
        </div>
        <div className="header-center">
          <h1>{tree.name}</h1>
        </div>
        <div className="header-right">
          {user ? (
            // User is logged in
            isOwner ? (
              <Link to="/tree" className="btn-edit">Open in Editor</Link>
            ) : (
              <Link to="/tree" className="btn-my-trees">My Trees</Link>
            )
          ) : (
            // User is not logged in - show signup CTA
            <Link to="/signup" className="btn-signup">Create Your Own Tree</Link>
          )}
        </div>
      </header>

      {/* Tree Container */}
      <div className="tree-container">
        {tree && focusedPersonId && (
          <TreeSVG
            familyTree={tree}
            focusedPersonId={focusedPersonId}
            transform={transform}
            onPersonClick={handlePersonClick}
            onAddSpouse={noOp}
            onAddChild={noOp}
            onAddParent={noOp}
            onEditPerson={noOp}
            onDeletePerson={noOp}
            canEdit={false}
          />
        )}
      </div>

      {/* Navigation Controls */}
      {focusedPerson && (
        <NavigationControls
          focusedPerson={focusedPerson}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          onGoBack={goBack}
          onGoForward={goForward}
        />
      )}

      {/* Zoom Controls */}
      <ZoomControls
        onZoomIn={() => zoom(0.2)}
        onZoomOut={() => zoom(-0.2)}
        onReset={resetTransform}
      />

      {/* Info Banner - Different content based on user state */}
      <div className="info-banner">
        {isOwner ? (
          <>
            <span>✏️ This is your tree</span>
            <span>•</span>
            <Link to="/tree">Open in full editor</Link>
          </>
        ) : user ? (
          <>
            <span>👁️ View Only</span>
            <span>•</span>
            <span>Shared by another user</span>
          </>
        ) : (
          <>
            <span>👁️ View Only</span>
            <span>•</span>
            <span>Want to create your own family tree?</span>
            <Link to="/signup">Sign up free</Link>
          </>
        )}
      </div>

      <style>{sharedTreeStyles}</style>
    </div>
  );
}

const sharedTreeStyles = `
  .shared-tree-page {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
    color: #f1f5f9;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .loading-state,
  .error-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: #94a3b8;
  }

  .error-state h2 {
    color: #f1f5f9;
    margin: 0 0 12px;
  }

  .error-state p {
    margin: 0 0 24px;
    max-width: 400px;
  }

  .btn-home {
    padding: 12px 24px;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    border-radius: 8px;
    color: white;
    text-decoration: none;
    font-weight: 600;
    transition: transform 0.2s;
  }

  .btn-home:hover {
    transform: translateY(-2px);
  }

  .shared-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    background: rgba(15, 23, 42, 0.9);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    z-index: 100;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .logo {
    font-size: 20px;
    font-weight: 600;
    color: #f1f5f9;
    text-decoration: none;
  }

  .shared-badge {
    padding: 6px 12px;
    background: rgba(59, 130, 246, 0.2);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 20px;
    font-size: 12px;
    color: #60a5fa;
  }

  .owner-badge {
    padding: 6px 12px;
    background: rgba(16, 185, 129, 0.2);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 20px;
    font-size: 12px;
    color: #34d399;
  }

  .header-center h1 {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
    color: #f1f5f9;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .btn-signup {
    padding: 10px 20px;
    background: linear-gradient(135deg, #10b981, #059669);
    border-radius: 8px;
    color: white;
    text-decoration: none;
    font-size: 14px;
    font-weight: 600;
    transition: transform 0.2s;
  }

  .btn-signup:hover {
    transform: translateY(-2px);
  }

  .btn-edit {
    padding: 10px 20px;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    border-radius: 8px;
    color: white;
    text-decoration: none;
    font-size: 14px;
    font-weight: 600;
    transition: transform 0.2s;
  }

  .btn-edit:hover {
    transform: translateY(-2px);
  }

  .btn-my-trees {
    padding: 10px 20px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: #f1f5f9;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
  }

  .btn-my-trees:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .tree-container {
    flex: 1;
    position: relative;
    overflow: hidden;
  }

  .info-banner {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 24px;
    background: rgba(15, 23, 42, 0.9);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 30px;
    font-size: 14px;
    color: #94a3b8;
    z-index: 100;
  }

  .info-banner a {
    color: #3b82f6;
    text-decoration: none;
    font-weight: 600;
  }

  .info-banner a:hover {
    text-decoration: underline;
  }
`;

