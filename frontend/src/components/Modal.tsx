/**
 * Modal Components for CRUD Operations
 * 
 * Includes:
 * - PersonFormModal: Add spouse, add child, edit person
 * - DeleteConfirmModal: Confirm deletion
 * - CreateTreeModal: Create new family tree
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Gender, PersonFormData, Person } from '../types';

// Animation variants for modal
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30 }
  },
  exit: { 
    opacity: 0, 
    scale: 0.9, 
    y: 20,
    transition: { duration: 0.2 }
  },
};

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/**
 * Base modal wrapper with overlay and animation
 */
function BaseModal({ isOpen, onClose, title, children }: BaseModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <motion.div
            className="modal-content"
            variants={modalVariants}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
              borderRadius: '16px',
              padding: '32px',
              minWidth: '400px',
              maxWidth: '500px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <h2 style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '24px',
              fontWeight: 600,
              color: '#f1f5f9',
              marginBottom: '24px',
              textAlign: 'center',
            }}>
              {title}
            </h2>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Shared styles
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '8px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(255, 255, 255, 0.05)',
  color: '#f1f5f9',
  fontSize: '14px',
  fontFamily: 'Outfit, sans-serif',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '8px',
  color: '#94a3b8',
  fontSize: '13px',
  fontFamily: 'Outfit, sans-serif',
  fontWeight: 500,
};

const buttonStyle: React.CSSProperties = {
  padding: '12px 24px',
  borderRadius: '8px',
  border: 'none',
  fontSize: '14px',
  fontWeight: 600,
  fontFamily: 'Outfit, sans-serif',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

interface PersonFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PersonFormData) => void;
  title: string;
  initialData?: Partial<PersonFormData>;
  submitLabel?: string;
}

/**
 * Form modal for adding/editing a person
 */
export function PersonFormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  initialData,
  submitLabel = 'Save',
}: PersonFormModalProps) {
  const [formData, setFormData] = useState<PersonFormData>({
    name: '',
    gender: 'male',
    birthYear: undefined,
    alive: true,
    ...initialData,
  });
  
  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        gender: 'male',
        birthYear: undefined,
        alive: true,
        ...initialData,
      });
    }
  }, [isOpen, initialData]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSubmit(formData);
      onClose();
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit}>
        {/* Name input */}
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter full name"
            required
            style={inputStyle}
            autoFocus
          />
        </div>
        
        {/* Gender selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Gender *</label>
          <div style={{ display: 'flex', gap: '12px' }}>
            {(['male', 'female'] as Gender[]).map((gender) => (
              <button
                key={gender}
                type="button"
                onClick={() => setFormData({ ...formData, gender })}
                style={{
                  ...buttonStyle,
                  flex: 1,
                  background: formData.gender === gender
                    ? gender === 'male' ? '#2563eb' : '#9333ea'
                    : 'rgba(255, 255, 255, 0.05)',
                  color: formData.gender === gender ? '#fff' : '#94a3b8',
                  border: `1px solid ${formData.gender === gender 
                    ? gender === 'male' ? '#3b82f6' : '#a855f7'
                    : 'rgba(255, 255, 255, 0.1)'}`,
                }}
              >
                {gender === 'male' ? '♂ Male' : '♀ Female'}
              </button>
            ))}
          </div>
        </div>
        
        {/* Birth year input */}
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Birth Year</label>
          <input
            type="number"
            value={formData.birthYear || ''}
            onChange={(e) => setFormData({ 
              ...formData, 
              birthYear: e.target.value ? parseInt(e.target.value) : undefined 
            })}
            placeholder="e.g., 1985"
            min={1800}
            max={new Date().getFullYear()}
            style={inputStyle}
          />
        </div>
        
        {/* Alive status */}
        <div style={{ marginBottom: '28px' }}>
          <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.alive}
              onChange={(e) => setFormData({ ...formData, alive: e.target.checked })}
              style={{ width: '18px', height: '18px', accentColor: '#10b981' }}
            />
            <span>Currently alive</span>
          </label>
        </div>
        
        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              ...buttonStyle,
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#94a3b8',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              ...buttonStyle,
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              color: '#fff',
            }}
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  personName: string;
}

/**
 * Confirmation modal for deleting a person
 */
export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  personName,
}: DeleteConfirmModalProps) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Confirm Deletion">
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: '28px',
        }}>
          ⚠️
        </div>
        
        <p style={{
          color: '#e2e8f0',
          fontSize: '16px',
          fontFamily: 'Outfit, sans-serif',
          marginBottom: '8px',
        }}>
          Are you sure you want to delete
        </p>
        <p style={{
          color: '#f1f5f9',
          fontSize: '20px',
          fontWeight: 600,
          fontFamily: 'Outfit, sans-serif',
          marginBottom: '24px',
        }}>
          {personName}?
        </p>
        <p style={{
          color: '#94a3b8',
          fontSize: '14px',
          fontFamily: 'Crimson Pro, serif',
          fontStyle: 'italic',
          marginBottom: '28px',
        }}>
          This action cannot be undone. The person will be removed from the family tree.
        </p>
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={onClose}
            style={{
              ...buttonStyle,
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#94a3b8',
              minWidth: '100px',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{
              ...buttonStyle,
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#fff',
              minWidth: '100px',
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

interface CreateTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (treeName: string) => void;
}

/**
 * Modal for creating a new tree with a name
 */
export function CreateTreeModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateTreeModalProps) {
  const [treeName, setTreeName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTreeName('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (treeName.trim()) {
      onSubmit(treeName.trim());
      onClose();
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Create New Family Tree">
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>Tree Name *</label>
          <input
            type="text"
            value={treeName}
            onChange={(e) => setTreeName(e.target.value)}
            placeholder="e.g., Johnson Family Tree"
            required
            style={inputStyle}
            autoFocus
          />
          <p style={{
            color: '#64748b',
            fontSize: '12px',
            fontFamily: 'Crimson Pro, serif',
            fontStyle: 'italic',
            marginTop: '8px',
          }}>
            You can add family members after creating the tree
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              ...buttonStyle,
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#94a3b8',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              ...buttonStyle,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
            }}
          >
            Create Tree
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

interface RenameTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newName: string) => void;
  currentName: string;
}

/**
 * Modal for renaming a tree
 */
export function RenameTreeModal({
  isOpen,
  onClose,
  onSubmit,
  currentName,
}: RenameTreeModalProps) {
  const [treeName, setTreeName] = useState(currentName);

  useEffect(() => {
    if (isOpen) {
      setTreeName(currentName);
    }
  }, [isOpen, currentName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (treeName.trim() && treeName.trim() !== currentName) {
      onSubmit(treeName.trim());
      onClose();
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Rename Tree">
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>Tree Name *</label>
          <input
            type="text"
            value={treeName}
            onChange={(e) => setTreeName(e.target.value)}
            placeholder="Enter tree name"
            required
            style={inputStyle}
            autoFocus
          />
        </div>
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              ...buttonStyle,
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#94a3b8',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              ...buttonStyle,
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              color: '#fff',
            }}
          >
            Save
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

interface TreeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTree: (treeId: string) => void;
  onDeleteTree: (treeId: string) => void;
  onRenameTree: (treeId: string, currentName: string) => void;
  onCreateNew: () => void;
  trees: Array<{ _id: string; name: string; peopleCount: number; updatedAt: string }>;
  currentTreeId?: string;
}

/**
 * Modal for selecting an existing tree or creating a new one
 */
export function TreeSelectorModal({
  isOpen,
  onClose,
  onSelectTree,
  onDeleteTree,
  onRenameTree,
  onCreateNew,
  trees,
  currentTreeId,
}: TreeSelectorModalProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, treeId: string) => {
    e.stopPropagation();
    setConfirmDelete(treeId);
  };

  const handleConfirmDelete = (treeId: string) => {
    onDeleteTree(treeId);
    setConfirmDelete(null);
  };

  const handleRenameClick = (e: React.MouseEvent, treeId: string, currentName: string) => {
    e.stopPropagation();
    onRenameTree(treeId, currentName);
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Family Trees">
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {trees.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            {trees.map((tree) => (
              <div
                key={tree._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <button
                  onClick={() => {
                    onSelectTree(tree._id);
                    onClose();
                  }}
                  style={{
                    ...buttonStyle,
                    flex: 1,
                    background: tree._id === currentTreeId 
                      ? 'rgba(59, 130, 246, 0.2)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    color: '#f1f5f9',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: tree._id === currentTreeId 
                      ? '1px solid rgba(59, 130, 246, 0.5)' 
                      : '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: 600 }}>
                      {tree.name}
                      {tree._id === currentTreeId && (
                        <span style={{ 
                          marginLeft: '8px', 
                          fontSize: '10px', 
                          color: '#3b82f6',
                          fontWeight: 400,
                        }}>
                          (current)
                        </span>
                      )}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      {tree.peopleCount} {tree.peopleCount === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    {new Date(tree.updatedAt).toLocaleDateString()}
                  </span>
                </button>
                
                {/* Edit button */}
                <button
                  onClick={(e) => handleRenameClick(e, tree._id, tree.name)}
                  style={{
                    ...buttonStyle,
                    padding: '8px 12px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    color: '#3b82f6',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    fontSize: '14px',
                  }}
                  title="Rename tree"
                >
                  ✏️
                </button>
                
                {/* Delete button */}
                {confirmDelete === tree._id ? (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => handleConfirmDelete(tree._id)}
                      style={{
                        ...buttonStyle,
                        padding: '8px 12px',
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      title="Confirm delete"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      style={{
                        ...buttonStyle,
                        padding: '8px 12px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: '#94a3b8',
                        fontSize: '12px',
                      }}
                      title="Cancel"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => handleDeleteClick(e, tree._id)}
                    style={{
                      ...buttonStyle,
                      padding: '8px 12px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      fontSize: '14px',
                    }}
                    title="Delete tree"
                  >
                    🗑
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{
            color: '#94a3b8',
            textAlign: 'center',
            fontFamily: 'Crimson Pro, serif',
            fontStyle: 'italic',
            marginBottom: '20px',
          }}>
            No family trees found. Create your first one!
          </p>
        )}
        
        <button
          onClick={() => {
            onCreateNew();
            onClose();
          }}
          style={{
            ...buttonStyle,
            width: '100%',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff',
          }}
        >
          + Create New Family Tree
        </button>
      </div>
    </BaseModal>
  );
}

