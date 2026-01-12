/**
 * Custom hook for managing family tree state.
 * Handles data fetching, CRUD operations, and optimistic updates.
 */

import { useState, useCallback } from 'react';
import type { FamilyTree, PersonFormData, TreeSummary } from '../types';
import * as api from '../services/api';

export interface UseFamilyTreeReturn {
  // State
  tree: FamilyTree | null;
  trees: TreeSummary[];
  isLoading: boolean;
  error: string | null;
  
  // Operations
  loadTree: (treeId: string) => Promise<void>;
  loadTrees: () => Promise<void>;
  createTree: (name: string, rootPerson?: PersonFormData) => Promise<string | null>;
  updateTree: (treeId: string, name: string) => Promise<boolean>;
  deleteTree: (treeId: string) => Promise<boolean>;
  addFirstPerson: (person: PersonFormData) => Promise<boolean>;
  addSpouse: (personId: string, spouse: PersonFormData) => Promise<boolean>;
  addChild: (personId: string, child: PersonFormData) => Promise<boolean>;
  addParent: (personId: string, parent: PersonFormData) => Promise<boolean>;
  updatePerson: (personId: string, updates: Partial<PersonFormData>) => Promise<boolean>;
  deletePerson: (personId: string) => Promise<boolean>;
  
  // Setters
  setTree: (tree: FamilyTree | null) => void;
}

export function useFamilyTree(): UseFamilyTreeReturn {
  const [tree, setTree] = useState<FamilyTree | null>(null);
  const [trees, setTrees] = useState<TreeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load all available trees.
   */
  const loadTrees = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    const response = await api.getAllTrees();
    
    if (response.success && response.data) {
      setTrees(response.data);
    } else {
      setError(response.error || 'Failed to load trees');
    }
    
    setIsLoading(false);
  }, []);

  /**
   * Load a specific tree by ID.
   */
  const loadTree = useCallback(async (treeId: string) => {
    setIsLoading(true);
    setError(null);
    
    const response = await api.getTree(treeId);
    
    if (response.success && response.data) {
      setTree(response.data);
    } else {
      setError(response.error || 'Failed to load tree');
    }
    
    setIsLoading(false);
  }, []);

  /**
   * Create a new tree (optionally with a root person).
   */
  const createTree = useCallback(async (name: string, rootPerson?: PersonFormData): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    
    const response = await api.createTree(name, rootPerson);
    
    if (response.success && response.data) {
      // User created this tree, so they can edit it
      setTree({ ...response.data, canEdit: true });
      setIsLoading(false);
      return response.data._id;
    } else {
      setError(response.error || 'Failed to create tree');
      setIsLoading(false);
      return null;
    }
  }, []);

  /**
   * Update tree (e.g., rename).
   */
  const updateTree = useCallback(async (treeId: string, name: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    const response = await api.updateTree(treeId, { name });
    
    if (response.success && response.data) {
      // If this is the current tree, update it
      if (tree?._id === treeId) {
        setTree(response.data);
      }
      // Reload trees list
      await loadTrees();
      setIsLoading(false);
      return true;
    } else {
      setError(response.error || 'Failed to update tree');
      setIsLoading(false);
      return false;
    }
  }, [tree, loadTrees]);

  /**
   * Delete a tree.
   */
  const deleteTree = useCallback(async (treeId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    const response = await api.deleteTree(treeId);
    
    if (response.success) {
      // If we deleted the current tree, clear it
      if (tree?._id === treeId) {
        setTree(null);
      }
      // Reload trees list
      await loadTrees();
      setIsLoading(false);
      return true;
    } else {
      setError(response.error || 'Failed to delete tree');
      setIsLoading(false);
      return false;
    }
  }, [tree, loadTrees]);

  /**
   * Add first person to an empty tree.
   */
  const addFirstPerson = useCallback(async (person: PersonFormData): Promise<boolean> => {
    if (!tree) return false;
    
    setIsLoading(true);
    setError(null);
    
    const response = await api.addFirstPerson(tree._id, person);
    
    if (response.success && response.data) {
      // Preserve canEdit from current tree state (user was editing, so they can still edit)
      setTree({ ...response.data, canEdit: tree.canEdit ?? response.data.canEdit });
      setIsLoading(false);
      return true;
    } else {
      setError(response.error || 'Failed to add person');
      setIsLoading(false);
      return false;
    }
  }, [tree]);

  /**
   * Add a spouse to an existing person.
   */
  const addSpouse = useCallback(async (
    personId: string,
    spouse: PersonFormData
  ): Promise<boolean> => {
    if (!tree) return false;
    
    setIsLoading(true);
    setError(null);
    
    const response = await api.addSpouse(tree._id, personId, spouse);
    
    if (response.success && response.data) {
      // Preserve canEdit from current tree state
      setTree({ ...response.data, canEdit: tree.canEdit ?? response.data.canEdit });
      setIsLoading(false);
      return true;
    } else {
      setError(response.error || 'Failed to add spouse');
      setIsLoading(false);
      return false;
    }
  }, [tree]);

  /**
   * Add a child to an existing person.
   */
  const addChild = useCallback(async (
    personId: string,
    child: PersonFormData
  ): Promise<boolean> => {
    if (!tree) return false;
    
    setIsLoading(true);
    setError(null);
    
    const response = await api.addChild(tree._id, personId, child);
    
    if (response.success && response.data) {
      // Preserve canEdit from current tree state
      setTree({ ...response.data, canEdit: tree.canEdit ?? response.data.canEdit });
      setIsLoading(false);
      return true;
    } else {
      setError(response.error || 'Failed to add child');
      setIsLoading(false);
      return false;
    }
  }, [tree]);

  /**
   * Add a parent (ancestor) to an existing person.
   */
  const addParent = useCallback(async (
    personId: string,
    parent: PersonFormData
  ): Promise<boolean> => {
    if (!tree) return false;
    
    setIsLoading(true);
    setError(null);
    
    const response = await api.addParent(tree._id, personId, parent);
    
    if (response.success && response.data) {
      // Preserve canEdit from current tree state
      setTree({ ...response.data, canEdit: tree.canEdit ?? response.data.canEdit });
      setIsLoading(false);
      return true;
    } else {
      setError(response.error || 'Failed to add parent');
      setIsLoading(false);
      return false;
    }
  }, [tree]);

  /**
   * Update a person's details.
   */
  const updatePerson = useCallback(async (
    personId: string,
    updates: Partial<PersonFormData>
  ): Promise<boolean> => {
    if (!tree) return false;
    
    setIsLoading(true);
    setError(null);
    
    const response = await api.updatePerson(tree._id, personId, updates);
    
    if (response.success && response.data) {
      // Preserve canEdit from current tree state
      setTree({ ...response.data, canEdit: tree.canEdit ?? response.data.canEdit });
      setIsLoading(false);
      return true;
    } else {
      setError(response.error || 'Failed to update person');
      setIsLoading(false);
      return false;
    }
  }, [tree]);

  /**
   * Delete a person from the tree.
   */
  const deletePerson = useCallback(async (personId: string): Promise<boolean> => {
    if (!tree) return false;
    
    setIsLoading(true);
    setError(null);
    
    const response = await api.deletePerson(tree._id, personId);
    
    if (response.success && response.data) {
      // Preserve canEdit from current tree state
      setTree({ ...response.data, canEdit: tree.canEdit ?? response.data.canEdit });
      setIsLoading(false);
      return true;
    } else {
      setError(response.error || 'Failed to delete person');
      setIsLoading(false);
      return false;
    }
  }, [tree]);

  return {
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
    setTree,
  };
}

