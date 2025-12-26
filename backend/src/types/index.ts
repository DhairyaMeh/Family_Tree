/**
 * Core type definitions for the Family Tree application.
 * These types define the data model used throughout the backend.
 */

export type Gender = 'male' | 'female';

/**
 * Person represents an individual in the family tree.
 * Uses a normalized structure where relationships are stored as IDs.
 */
export interface Person {
  id: string;
  name: string;
  gender: Gender;
  spouseId?: string;
  childrenIds: string[];
  birthYear?: number;
  alive?: boolean;
  imageUrl?: string;
}

/**
 * FamilyTree represents the entire family graph.
 * Stored as a single MongoDB document for atomic operations.
 */
export interface FamilyTree {
  _id: string;
  name: string;
  people: Record<string, Person>;
  rootId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * API request/response types
 */
export interface CreatePersonRequest {
  name: string;
  gender: Gender;
  birthYear?: number;
  alive?: boolean;
  parentId?: string;
  spouseId?: string;
  treeId: string;
}

export interface UpdatePersonRequest {
  name?: string;
  gender?: Gender;
  birthYear?: number;
  alive?: boolean;
  imageUrl?: string;
}

export interface CreateTreeRequest {
  name: string;
  rootPerson?: {
    name: string;
    gender: Gender;
    birthYear?: number;
    alive?: boolean;
  };
}

export interface UpdateTreeRequest {
  name?: string;
}

export interface AddSpouseRequest {
  name: string;
  gender: Gender;
  birthYear?: number;
  alive?: boolean;
}

export interface AddChildRequest {
  name: string;
  gender: Gender;
  birthYear?: number;
  alive?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Auth request/response types
 */
export interface SignupRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface GoogleAuthRequest {
  credential: string;
}

