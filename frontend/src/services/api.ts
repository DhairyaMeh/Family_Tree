/**
 * API service for communicating with the family tree backend.
 * Handles all HTTP requests and response parsing.
 */

import type { FamilyTree, TreeSummary, ApiResponse, PersonFormData } from '../types';

const API_BASE = '/api';

/**
 * Get auth token from localStorage
 */
function getAuthToken(): string | null {
  const authData = localStorage.getItem('auth');
  if (authData) {
    try {
      const { token } = JSON.parse(authData);
      return token;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Generic fetch wrapper with error handling.
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
  requiresAuth: boolean = false
): Promise<ApiResponse<T>> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else if (requiresAuth) {
      return { success: false, error: 'Authentication required' };
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers,
      ...options,
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Request failed' };
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Get all available family trees.
 */
export async function getAllTrees(): Promise<ApiResponse<TreeSummary[]>> {
  return fetchApi<TreeSummary[]>('/trees');
}

/**
 * Get a specific family tree by ID.
 */
export async function getTree(treeId: string): Promise<ApiResponse<FamilyTree>> {
  return fetchApi<FamilyTree>(`/tree/${treeId}`);
}

/**
 * Create a new family tree.
 * Can create empty tree (just name) or with first person.
 * Requires authentication (Silver/Gold/Admin tier).
 */
export async function createTree(
  name: string,
  rootPerson?: PersonFormData
): Promise<ApiResponse<FamilyTree>> {
  return fetchApi<FamilyTree>('/tree', {
    method: 'POST',
    body: JSON.stringify({ name, rootPerson }),
  }, true);
}

/**
 * Update a tree (e.g., rename).
 * Requires authentication and ownership.
 */
export async function updateTree(
  treeId: string,
  updates: { name?: string }
): Promise<ApiResponse<FamilyTree>> {
  return fetchApi<FamilyTree>(`/tree/${treeId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }, true);
}

/**
 * Delete a family tree.
 * Requires authentication and ownership.
 */
export async function deleteTree(treeId: string): Promise<ApiResponse<{ deleted: boolean }>> {
  return fetchApi<{ deleted: boolean }>(`/tree/${treeId}`, {
    method: 'DELETE',
  }, true);
}

/**
 * Add first person to an empty tree.
 * Requires authentication and ownership.
 */
export async function addFirstPerson(
  treeId: string,
  personData: PersonFormData
): Promise<ApiResponse<FamilyTree>> {
  return fetchApi<FamilyTree>(`/tree/${treeId}/first-person`, {
    method: 'POST',
    body: JSON.stringify(personData),
  }, true);
}

/**
 * Add a spouse to a person.
 * Requires authentication and ownership.
 */
export async function addSpouse(
  treeId: string,
  personId: string,
  spouseData: PersonFormData
): Promise<ApiResponse<FamilyTree>> {
  return fetchApi<FamilyTree>(`/tree/${treeId}/person/${personId}/spouse`, {
    method: 'POST',
    body: JSON.stringify(spouseData),
  }, true);
}

/**
 * Add a child to a person.
 * Requires authentication and ownership.
 */
export async function addChild(
  treeId: string,
  personId: string,
  childData: PersonFormData
): Promise<ApiResponse<FamilyTree>> {
  return fetchApi<FamilyTree>(`/tree/${treeId}/person/${personId}/child`, {
    method: 'POST',
    body: JSON.stringify(childData),
  }, true);
}

/**
 * Add a parent (ancestor) to a person.
 * Requires authentication and ownership.
 */
export async function addParent(
  treeId: string,
  personId: string,
  parentData: PersonFormData
): Promise<ApiResponse<FamilyTree>> {
  return fetchApi<FamilyTree>(`/tree/${treeId}/person/${personId}/parent`, {
    method: 'POST',
    body: JSON.stringify(parentData),
  }, true);
}

/**
 * Update a person's details.
 * Requires authentication and ownership.
 */
export async function updatePerson(
  treeId: string,
  personId: string,
  updates: Partial<PersonFormData>
): Promise<ApiResponse<FamilyTree>> {
  return fetchApi<FamilyTree>(`/tree/${treeId}/person/${personId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }, true);
}

/**
 * Delete a person from the tree.
 * Requires authentication and ownership.
 */
export async function deletePerson(
  treeId: string,
  personId: string
): Promise<ApiResponse<FamilyTree>> {
  return fetchApi<FamilyTree>(`/tree/${treeId}/person/${personId}`, {
    method: 'DELETE',
  }, true);
}

