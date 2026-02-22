/**
 * Family Tree Application
 * 
 * Main application component that orchestrates:
 * - Family tree data fetching and state management
 * - Navigation between focused persons
 * - Pan/zoom transformations
 * - CRUD modals and operations
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { TreeSVG } from './components/TreeSVG';
import { NavigationControls, ZoomControls, TreeActions, HelpOverlay } from './components/Controls';
import { PersonFormModal, DeleteConfirmModal, TreeSelectorModal, CreateTreeModal, RenameTreeModal } from './components/Modal';
import { useFamilyTree } from './hooks/useFamilyTree';
import { useNavigation } from './hooks/useNavigation';
import { useTransform } from './hooks/useTransform';
import { useAuth } from './context/AuthContext';
import type { ModalState, PersonFormData, Person } from './types';
import './styles/global.css';

export default function App() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Family tree state
  const {
    tree,
    trees,
    isLoading,
    error,
    loadTree,
    loadTrees,
    createTree,
    updateTree,
    deleteTree,
    addFirstPerson,
    addSpouse,
    addChild,
    addParent,
    updatePerson,
    deletePerson,
  } = useFamilyTree();

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

  // Modal state
  const [modal, setModal] = useState<ModalState>({ type: null, isOpen: false });
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [showTreeSelector, setShowTreeSelector] = useState(false);
  const [showHelp, setShowHelp] = useState(true);
  const [showCreateTreeModal, setShowCreateTreeModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameTreeId, setRenameTreeId] = useState<string | null>(null);
  const [renameTreeName, setRenameTreeName] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  // Load trees on mount
  useEffect(() => {
    loadTrees();
  }, [loadTrees]);

  // Initialize with first tree if available
  useEffect(() => {
    if (trees.length > 0 && !tree) {
      loadTree(trees[0]._id);
    }
  }, [trees, tree, loadTree]);

  // Initialize navigation when tree loads (only if tree has people)
  useEffect(() => {
    if (tree && tree.rootId && !focusedPersonId) {
      resetNavigation(tree.rootId);
    }
  }, [tree, focusedPersonId, resetNavigation]);

  // Check if tree is empty (has no people)
  const isTreeEmpty = tree && Object.keys(tree.people).length === 0;

  // Check if user can edit this tree
  const canEdit = tree?.canEdit ?? false;

  // Check if user can create trees (not free tier)
  const canCreateTrees = user ? user.tier !== 'free' : false;

  // Hide help after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHelp(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Get focused person data
  const focusedPerson = tree && focusedPersonId ? tree.people[focusedPersonId] : null;

  /**
   * Handle clicking on a person node - focus on them
   */
  const handlePersonClick = useCallback((personId: string) => {
    navigateTo(personId);
  }, [navigateTo]);

  /**
   * Modal handlers
   */
  const openAddSpouseModal = useCallback((personId: string) => {
    if (tree && canEdit) {
      setSelectedPerson(tree.people[personId]);
      setModal({ type: 'add-spouse', personId, isOpen: true });
    }
  }, [tree, canEdit]);

  const openAddChildModal = useCallback((personId: string) => {
    if (tree && canEdit) {
      setSelectedPerson(tree.people[personId]);
      setModal({ type: 'add-child', personId, isOpen: true });
    }
  }, [tree, canEdit]);

  const openAddParentModal = useCallback((personId: string) => {
    if (tree && canEdit) {
      setSelectedPerson(tree.people[personId]);
      setModal({ type: 'add-parent', personId, isOpen: true });
    }
  }, [tree, canEdit]);

  const openEditModal = useCallback((personId: string) => {
    if (tree && canEdit) {
      setSelectedPerson(tree.people[personId]);
      setModal({ type: 'edit-person', personId, isOpen: true });
    }
  }, [tree, canEdit]);

  const openDeleteModal = useCallback((personId: string) => {
    if (tree && canEdit) {
      setSelectedPerson(tree.people[personId]);
      setModal({ type: 'delete-person', personId, isOpen: true });
    }
  }, [tree, canEdit]);

  const openCreateTreeModal = useCallback(() => {
    setShowCreateTreeModal(true);
  }, []);

  const openAddFirstPersonModal = useCallback(() => {
    setModal({ type: 'add-first-person', isOpen: true });
  }, []);

  const openRenameTreeModal = useCallback((treeId: string, currentName: string) => {
    setRenameTreeId(treeId);
    setRenameTreeName(currentName);
    setShowRenameModal(true);
    setShowTreeSelector(false);
  }, []);

  const closeModal = useCallback(() => {
    setModal({ type: null, isOpen: false });
    setSelectedPerson(null);
  }, []);

  /**
   * CRUD operation handlers
   */
  const handleAddSpouse = useCallback(async (data: PersonFormData) => {
    if (modal.personId) {
      await addSpouse(modal.personId, data);
    }
  }, [modal.personId, addSpouse]);

  const handleAddChild = useCallback(async (data: PersonFormData) => {
    if (modal.personId) {
      await addChild(modal.personId, data);
    }
  }, [modal.personId, addChild]);

  const handleAddParent = useCallback(async (data: PersonFormData) => {
    if (modal.personId) {
      await addParent(modal.personId, data);
    }
  }, [modal.personId, addParent]);

  const handleDeleteTree = useCallback(async (treeId: string) => {
    await deleteTree(treeId);
    // If we deleted the current tree, reset navigation
    if (tree?._id === treeId) {
      resetNavigation();
    }
  }, [deleteTree, tree, resetNavigation]);

  const handleEditPerson = useCallback(async (data: PersonFormData) => {
    if (modal.personId) {
      await updatePerson(modal.personId, data);
    }
  }, [modal.personId, updatePerson]);

  const handleDeletePerson = useCallback(async () => {
    if (modal.personId && tree) {
      // If deleting focused person, navigate to root first
      if (modal.personId === focusedPersonId) {
        const newFocus = tree.rootId !== modal.personId ? tree.rootId : null;
        if (newFocus) {
          navigateTo(newFocus);
        }
      }
      await deletePerson(modal.personId);
    }
  }, [modal.personId, tree, focusedPersonId, navigateTo, deletePerson]);

  const handleCreateTree = useCallback(async (treeName: string) => {
    const treeId = await createTree(treeName);
    if (treeId) {
      await loadTrees();
      resetNavigation();
    }
  }, [createTree, loadTrees, resetNavigation]);

  const handleAddFirstPerson = useCallback(async (data: PersonFormData) => {
    const success = await addFirstPerson(data);
    if (success && tree) {
      // Navigate to the new person (they become root)
      await loadTree(tree._id);
    }
  }, [addFirstPerson, tree, loadTree]);

  const handleRenameTree = useCallback(async (newName: string) => {
    if (renameTreeId) {
      await updateTree(renameTreeId, newName);
      setRenameTreeId(null);
      setRenameTreeName('');
    }
  }, [renameTreeId, updateTree]);

  const handleSelectTree = useCallback(async (treeId: string) => {
    await loadTree(treeId);
    resetNavigation();
  }, [loadTree, resetNavigation]);

  /**
   * Zoom handlers
   */
  const handleZoomIn = useCallback(() => zoom(0.1), [zoom]);
  const handleZoomOut = useCallback(() => zoom(-0.1), [zoom]);

  /**
   * Share handler
   */
  const handleShare = useCallback(() => {
    if (tree && tree.shareToken) {
      const shareUrl = `${window.location.origin}/shared/${tree.shareToken}`;
      navigator.clipboard.writeText(shareUrl);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 3000);
    }
  }, [tree]);

  /**
   * Logout handler
   */
  const handleLogout = useCallback(() => {
    logout();
    navigate('/');
  }, [logout, navigate]);

  return (
    <div className="app-container">
      {/* Background gradient */}
      <div className="app-background" />
      
      {/* Header */}
      <header className="app-header">
        <Link to="/" className="header-link">
          <h1>🌳 Family Tree</h1>
        </Link>
        <p>Interactive Family Visualization</p>
      </header>

      {/* Top Right Controls - Share & User Menu */}
      <div className="top-right-controls">
        {/* Share Button */}
        {tree && (
          <button onClick={handleShare} className="share-btn" title="Copy share link">
            🔗 Share
          </button>
        )}

        {/* User Menu */}
        {user && (
          <div className="user-dropdown">
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="user-btn"
            >
              <span className="user-avatar">
                {user.profileImage ? (
                  <img src={user.profileImage} alt={user.username} />
                ) : (
                  user.username.charAt(0).toUpperCase()
                )}
              </span>
              <span className="user-name">{user.username}</span>
              <span className="user-tier">{user.tier}</span>
            </button>
            
            {showUserMenu && (
              <div className="user-menu">
                <div className="user-menu-header">
                  <strong>{user.username}</strong>
                  <span>{user.email}</span>
                  <span className="tier-badge">{user.tier.toUpperCase()}</span>
                </div>
                <Link to="/profile" className="user-menu-item">
                  Profile
                </Link>
                <Link to="/pricing" className="user-menu-item">
                  Upgrade Plan
                </Link>
                <button onClick={handleLogout} className="user-menu-item logout">
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Share Toast */}
      <AnimatePresence>
        {showShareToast && (
          <motion.div
            className="share-toast"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            ✓ Share link copied to clipboard!
          </motion.div>
        )}

      </AnimatePresence>

      {/* Loading state */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="loading-spinner" />
            <span>Loading...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error state */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="error-toast"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            <span>⚠️ {error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main tree visualization */}
      <div 
        ref={containerRef as React.RefObject<HTMLDivElement>}
        className="tree-container"
      >
        {tree && focusedPersonId && !isTreeEmpty && (
          <TreeSVG
            familyTree={tree}
            focusedPersonId={focusedPersonId}
            transform={transform}
            onPersonClick={handlePersonClick}
            onAddSpouse={openAddSpouseModal}
            onAddChild={openAddChildModal}
            onAddParent={openAddParentModal}
            onEditPerson={openEditModal}
            onDeletePerson={openDeleteModal}
            canEdit={canEdit}
          />
        )}
        
        {/* Empty tree state - tree exists but has no people */}
        {isTreeEmpty && !isLoading && (
          <div className="empty-state">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h2 style={{ marginBottom: '8px' }}>{tree.name}</h2>
              {canEdit ? (
                <>
                  <p style={{ color: '#64748b', marginBottom: '32px' }}>This tree is empty. Add your first family member to get started.</p>
                  
                  {/* Plus icon button */}
                  <motion.button
                    onClick={openAddFirstPersonModal}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '16px',
                      border: '2px dashed rgba(59, 130, 246, 0.5)',
                      background: 'rgba(59, 130, 246, 0.1)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                    }}
                  >
                    <span style={{ fontSize: '48px', color: '#3b82f6' }}>+</span>
                    <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 500 }}>Add Person</span>
                  </motion.button>
                </>
              ) : (
                <p style={{ color: '#64748b', marginBottom: '32px' }}>This tree is empty. You don't have permission to edit it.</p>
              )}
            </motion.div>
          </div>
        )}
        
        {/* No tree state */}
        {!tree && !isLoading && (
          <div className="empty-state">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="empty-icon">🌳</div>
              <h2>Welcome to Family Tree</h2>
              <p>Create or load a family tree to get started</p>
              <button onClick={openCreateTreeModal} className="primary-button">
                Create Your First Tree
              </button>
            </motion.div>
          </div>
        )}
      </div>

      {/* Controls */}
      {tree && (
        <>
          <NavigationControls
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            onBack={goBack}
            onForward={goForward}
            focusedPerson={focusedPerson}
            familyTree={tree}
          />
          
          <ZoomControls
            scale={transform.scale}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onReset={resetTransform}
          />
          
          <HelpOverlay isVisible={showHelp} />
        </>
      )}

      <TreeActions
        onOpenTreeSelector={() => setShowTreeSelector(true)}
        onCreateTree={openCreateTreeModal}
        hasTree={!!tree}
        canCreateTrees={canCreateTrees}
        isFreeUser={user?.tier === 'free'}
      />

      {/* Modals */}
      <PersonFormModal
        isOpen={modal.type === 'add-spouse' && modal.isOpen}
        onClose={closeModal}
        onSubmit={handleAddSpouse}
        title={`Add Spouse for ${selectedPerson?.name || ''}`}
        submitLabel="Add Spouse"
      />

      <PersonFormModal
        isOpen={modal.type === 'add-child' && modal.isOpen}
        onClose={closeModal}
        onSubmit={handleAddChild}
        title={`Add Child for ${selectedPerson?.name || ''}`}
        submitLabel="Add Child"
      />

      <PersonFormModal
        isOpen={modal.type === 'add-parent' && modal.isOpen}
        onClose={closeModal}
        onSubmit={handleAddParent}
        title={`Add Parent for ${selectedPerson?.name || ''}`}
        submitLabel="Add Parent"
      />

      <PersonFormModal
        isOpen={modal.type === 'edit-person' && modal.isOpen}
        onClose={closeModal}
        onSubmit={handleEditPerson}
        title="Edit Person"
        initialData={selectedPerson ? {
          name: selectedPerson.name,
          gender: selectedPerson.gender,
          birthDate: selectedPerson.birthDate,
          alive: selectedPerson.alive ?? true,
          imageUrl: selectedPerson.imageUrl,
        } : undefined}
        submitLabel="Save Changes"
      />

      <PersonFormModal
        isOpen={modal.type === 'add-first-person' && modal.isOpen}
        onClose={closeModal}
        onSubmit={handleAddFirstPerson}
        title="Add First Family Member"
        submitLabel="Add Person"
      />

      <DeleteConfirmModal
        isOpen={modal.type === 'delete-person' && modal.isOpen}
        onClose={closeModal}
        onConfirm={handleDeletePerson}
        personName={selectedPerson?.name || ''}
      />

      <CreateTreeModal
        isOpen={showCreateTreeModal}
        onClose={() => setShowCreateTreeModal(false)}
        onSubmit={handleCreateTree}
      />

      <RenameTreeModal
        isOpen={showRenameModal}
        onClose={() => {
          setShowRenameModal(false);
          setRenameTreeId(null);
          setRenameTreeName('');
        }}
        onSubmit={handleRenameTree}
        currentName={renameTreeName}
      />

      <TreeSelectorModal
        isOpen={showTreeSelector}
        onClose={() => setShowTreeSelector(false)}
        onSelectTree={handleSelectTree}
        onDeleteTree={handleDeleteTree}
        onRenameTree={openRenameTreeModal}
        onCreateNew={openCreateTreeModal}
        trees={trees}
        currentTreeId={tree?._id}
      />

      <style>{`
        .top-right-controls {
          position: absolute;
          top: 20px;
          right: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 200;
        }

        .share-btn {
          padding: 10px 16px;
          background: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #e2e8f0;
          font-size: 14px;
          font-family: 'Outfit', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
        }

        .share-btn:hover {
          background: rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.5);
        }

        .user-dropdown {
          position: relative;
        }

        .user-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #e2e8f0;
          cursor: pointer;
          transition: all 0.2s;
        }

        .user-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
          color: white;
          overflow: hidden;
        }

        .user-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .user-name {
          font-size: 14px;
          font-weight: 500;
        }

        .user-tier {
          padding: 2px 6px;
          background: rgba(139, 92, 246, 0.2);
          border-radius: 8px;
          font-size: 10px;
          color: #a78bfa;
          text-transform: uppercase;
        }

        .user-menu {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          background: #1e293b;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          min-width: 200px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          z-index: 100;
        }

        .user-menu-header {
          padding: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .user-menu-header strong {
          color: #f1f5f9;
        }

        .user-menu-header span {
          color: #64748b;
          font-size: 12px;
        }

        .user-menu-header .tier-badge {
          display: inline-block;
          padding: 2px 8px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-radius: 8px;
          color: white !important;
          font-size: 10px;
          margin-top: 4px;
          width: fit-content;
        }

        .user-menu-item {
          display: block;
          width: 100%;
          padding: 12px 16px;
          background: transparent;
          border: none;
          text-align: left;
          color: #94a3b8;
          font-size: 14px;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s;
        }

        .user-menu-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #f1f5f9;
        }

        .user-menu-item.logout {
          color: #ef4444;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .share-toast {
          position: fixed;
          top: 80px;
          right: 20px;
          padding: 12px 20px;
          background: rgba(34, 197, 94, 0.9);
          border-radius: 8px;
          color: white;
          font-size: 14px;
          font-weight: 500;
          z-index: 1000;
        }
      `}</style>
    </div>
  );
}

