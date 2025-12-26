/**
 * API service for communicating with the family tree backend.
 * Handles all HTTP requests and response parsing.
 */

import type { FamilyTree, TreeSummary, ApiResponse, PersonFormData } from '../types';

const API_BASE = '/api';

/**
 * Generic fetch wrapper with error handling.
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
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
 */
export async function createTree(
  name: string,
  rootPerson?: PersonFormData
): Promise<ApiResponse<FamilyTree>> {
  return fetchApi<FamilyTree>('/tree', {
    method: 'POST',
    body: JSON.stringify({ name, rootPerson }),
  });
}

/**
 * Update a tree (e.g., rename).
 */
export async function updateTree(
  treeId: string,
  updates: { name?: string }
): Promise<ApiResponse<FamilyTree>> {
  return fetchApi<FamilyTree>(`/tree/${treeId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

/**
 * Delete a family tree.
 */
export async function deleteTree(treeId: string): Promise<ApiResponse<{ deleted: boolean }>> {
  return fetchApi<{ deleted: boolean }>(`/tree/${treeId}`, {
    method: 'DELETE',
  });
}

/**
 * Add first person to an empty tree.
 */
export async function addFirstPerson(
  treeId: string,
  personData: PersonFormData
): Promise<ApiResponse<FamilyTree>> {
  return fetchApi<FamilyTree>(`/tree/${treeId}/first-person`, {
    method: 'POST',
    body: JSON.stringify(personData),
  });
}

/**
 * Add a spouse to a person.
 */
export async function addSpouse(
  treeId: string,
  personId: string,
  spouseData: PersonFormData
): Promise<ApiResponse<FamilyTree>> {
  return fetchApi<FamilyTree>(`/tree/${treeId}/person/${personId}/spouse`, {
    method: 'POST',
    body: JSON.stringify(spouseData),
  });
}

/**
 * Add a child to a person.
 */
export async function addChild(
  treeId: string,
  personId: string,
  childData: PersonFormData
): Promise<ApiResponse<FamilyTree>> {
  return fetchApi<FamilyTree>(`/tree/${treeId}/person/${personId}/child`, {
    method: 'POST',
    body: JSON.stringify(childData),
  });
}

/**
 * Add a parent (ancestor) to a person.
 */
export async function addParent(
  treeId: string,
  personId: string,
  parentData: PersonFormData
): Promise<ApiResponse<FamilyTree>> {
  return fetchApi<FamilyTree>(`/tree/${treeId}/person/${personId}/parent`, {
    method: 'POST',
    body: JSON.stringify(parentData),
  });
}

/**
 * Update a person's details.
 */
export async function updatePerson(
  treeId: string,
  personId: string,
  updates: Partial<PersonFormData>
): Promise<ApiResponse<FamilyTree>> {
  return fetchApi<FamilyTree>(`/tree/${treeId}/person/${personId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

/**
 * Delete a person from the tree.
 */
export async function deletePerson(
  treeId: string,
  personId: string
): Promise<ApiResponse<FamilyTree>> {
  return fetchApi<FamilyTree>(`/tree/${treeId}/person/${personId}`, {
    method: 'DELETE',
  });
}

