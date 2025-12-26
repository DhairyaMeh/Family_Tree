/**
 * Layout Engine for Family Tree Visualization
 * 
 * Features:
 * - Dynamic node widths based on name length
 * - Only shows direct lineage (ancestors + descendants, no siblings)
 * - Limited to 4 layers above and 4 layers below focused person
 * - Spouses positioned side-by-side
 * - Children centered below parents
 */

import type { Person, FamilyTree, LayoutNode, Connection, LayoutResult } from '../types';

// Layout configuration
const CONFIG = {
  MIN_NODE_WIDTH: 140,       // Minimum node width
  MAX_NODE_WIDTH: 220,       // Maximum node width
  NODE_HEIGHT: 90,
  CHAR_WIDTH: 8,             // Approximate width per character
  PADDING: 60,               // Padding inside node for text
  HORIZONTAL_GAP: 60,        // Gap between siblings
  VERTICAL_GAP: 130,         // Gap between generations
  SPOUSE_GAP: 20,            // Gap between spouses
  MAX_LAYERS_UP: 4,          // Maximum ancestor layers
  MAX_LAYERS_DOWN: 4,        // Maximum descendant layers
};

/**
 * Calculate dynamic node width based on name length.
 */
function calculateNodeWidth(name: string): number {
  const textWidth = name.length * CONFIG.CHAR_WIDTH + CONFIG.PADDING;
  return Math.max(CONFIG.MIN_NODE_WIDTH, Math.min(CONFIG.MAX_NODE_WIDTH, textWidth));
}

/**
 * Calculate width for a couple (two people side by side).
 */
function calculateCoupleWidth(person: Person, spouse: Person | null): number {
  const personWidth = calculateNodeWidth(person.name);
  if (spouse) {
    const spouseWidth = calculateNodeWidth(spouse.name);
    return personWidth + spouseWidth + CONFIG.SPOUSE_GAP;
  }
  return personWidth;
}

/**
 * Find parents of a person in the family tree.
 * Returns an array of parent persons (could be 0, 1, or 2).
 */
function findParents(personId: string, people: Record<string, Person>): Person[] {
  const parents: Person[] = [];
  
  for (const person of Object.values(people)) {
    if (person.childrenIds.includes(personId)) {
      // Avoid adding both spouses as separate parents
      if (!parents.some(p => p.spouseId === person.id)) {
        parents.push(person);
      }
    }
  }
  
  return parents;
}

/**
 * Get the spouse of a person if they have one.
 */
function getSpouse(person: Person, people: Record<string, Person>): Person | null {
  if (person.spouseId && people[person.spouseId]) {
    return people[person.spouseId];
  }
  return null;
}

/**
 * Calculate the width needed for a subtree (person + all descendants).
 */
function calculateSubtreeWidth(
  personId: string,
  people: Record<string, Person>,
  maxDepth: number,
  currentDepth: number = 0,
  visited: Set<string> = new Set()
): number {
  if (currentDepth > maxDepth) return 0;
  if (visited.has(personId)) return 0;
  visited.add(personId);

  const person = people[personId];
  if (!person) return 0;

  const spouse = getSpouse(person, people);
  if (spouse) {
    visited.add(spouse.id);
  }

  // Base width for this couple
  const coupleWidth = calculateCoupleWidth(person, spouse);

  // If no children or at max depth, return couple width
  if (person.childrenIds.length === 0 || currentDepth >= maxDepth) {
    return coupleWidth;
  }

  // Calculate total width needed for all children
  let childrenWidth = 0;
  const validChildren = person.childrenIds.filter(id => people[id] && !visited.has(id));
  
  for (let i = 0; i < validChildren.length; i++) {
    const childId = validChildren[i];
    const childVisited = new Set(visited);
    childrenWidth += calculateSubtreeWidth(childId, people, maxDepth, currentDepth + 1, childVisited);
    if (i < validChildren.length - 1) {
      childrenWidth += CONFIG.HORIZONTAL_GAP;
    }
  }

  return Math.max(coupleWidth, childrenWidth);
}

/**
 * Main layout computation function.
 * Only shows direct lineage: ancestors above, descendants below.
 * Limited to 4 layers in each direction.
 */
export function computeLayout(
  focusedPersonId: string,
  familyTree: FamilyTree
): LayoutResult {
  const { people } = familyTree;
  const nodes: LayoutNode[] = [];
  const connections: Connection[] = [];
  const positioned = new Set<string>();
  
  const focusedPerson = people[focusedPersonId];
  if (!focusedPerson) {
    return {
      nodes: [],
      connections: [],
      bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 },
      focusedNode: null,
    };
  }

  /**
   * Create a LayoutNode for a person at the given position.
   */
  function createNode(
    person: Person,
    x: number,
    y: number,
    generation: number,
    context: { isSpouse: boolean; isChild: boolean; isParent: boolean }
  ): LayoutNode {
    const width = calculateNodeWidth(person.name);
    return {
      person,
      x,
      y,
      width,
      height: CONFIG.NODE_HEIGHT,
      isSpouse: context.isSpouse,
      isChild: context.isChild,
      isParent: context.isParent,
      isFocused: person.id === focusedPersonId,
      generation,
    };
  }

  /**
   * Position a couple (person + optional spouse) at the given center position.
   */
  function positionCouple(
    person: Person,
    centerX: number,
    centerY: number,
    generation: number,
    context: { isChild: boolean; isParent: boolean }
  ): { leftX: number; rightX: number; centerX: number } {
    const spouse = getSpouse(person, people);
    const personWidth = calculateNodeWidth(person.name);
    
    if (spouse && !positioned.has(spouse.id)) {
      const spouseWidth = calculateNodeWidth(spouse.name);
      const totalWidth = personWidth + spouseWidth + CONFIG.SPOUSE_GAP;
      
      // Determine left/right positioning based on gender
      const maleOnLeft = person.gender === 'male';
      const leftPerson = maleOnLeft ? person : spouse;
      const rightPerson = maleOnLeft ? spouse : person;
      const leftWidth = calculateNodeWidth(leftPerson.name);
      const rightWidth = calculateNodeWidth(rightPerson.name);
      
      const leftX = centerX - totalWidth / 2 + leftWidth / 2;
      const rightX = centerX + totalWidth / 2 - rightWidth / 2;
      
      if (!positioned.has(leftPerson.id)) {
        nodes.push(createNode(leftPerson, leftX, centerY, generation, {
          isSpouse: leftPerson.id !== focusedPersonId,
          isChild: context.isChild,
          isParent: context.isParent,
        }));
        positioned.add(leftPerson.id);
      }
      
      if (!positioned.has(rightPerson.id)) {
        nodes.push(createNode(rightPerson, rightX, centerY, generation, {
          isSpouse: rightPerson.id !== focusedPersonId,
          isChild: context.isChild,
          isParent: context.isParent,
        }));
        positioned.add(rightPerson.id);
      }
      
      // Add spouse connection
      connections.push({
        id: `spouse-${leftPerson.id}-${rightPerson.id}`,
        type: 'spouse',
        from: { x: leftX + leftWidth / 2, y: centerY },
        to: { x: rightX - rightWidth / 2, y: centerY },
        fromId: leftPerson.id,
        toId: rightPerson.id,
      });
      
      return { leftX: leftX - leftWidth / 2, rightX: rightX + rightWidth / 2, centerX };
    } else {
      // Single person
      if (!positioned.has(person.id)) {
        nodes.push(createNode(person, centerX, centerY, generation, {
          isSpouse: false,
          isChild: context.isChild,
          isParent: context.isParent,
        }));
        positioned.add(person.id);
      }
      return { 
        leftX: centerX - personWidth / 2, 
        rightX: centerX + personWidth / 2, 
        centerX 
      };
    }
  }

  /**
   * Position children below their parents (only direct descendants).
   */
  function positionDescendants(
    parentPerson: Person,
    parentCenterX: number,
    parentY: number,
    generation: number,
    depth: number
  ): void {
    if (depth >= CONFIG.MAX_LAYERS_DOWN) return;
    
    const children = parentPerson.childrenIds
      .map(id => people[id])
      .filter(Boolean)
      .filter(c => !positioned.has(c.id));
    
    if (children.length === 0) return;
    
    const childY = parentY + CONFIG.VERTICAL_GAP + CONFIG.NODE_HEIGHT;
    
    // Calculate widths for each child's subtree
    const childWidths = children.map(child => {
      const childVisited = new Set(positioned);
      return calculateSubtreeWidth(
        child.id, 
        people, 
        CONFIG.MAX_LAYERS_DOWN - depth - 1, 
        0, 
        childVisited
      );
    });
    
    // Ensure minimum width per child
    const adjustedWidths = childWidths.map((w, i) => {
      const child = children[i];
      const spouse = getSpouse(child, people);
      const minWidth = calculateCoupleWidth(child, spouse);
      return Math.max(w, minWidth);
    });
    
    const totalWidth = adjustedWidths.reduce((sum, w) => sum + w, 0) +
      (children.length - 1) * CONFIG.HORIZONTAL_GAP;
    
    let currentX = parentCenterX - totalWidth / 2;
    
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const childWidth = adjustedWidths[i];
      const childCenterX = currentX + childWidth / 2;
      
      const result = positionCouple(child, childCenterX, childY, generation + 1, {
        isChild: true,
        isParent: false,
      });
      
      // Add parent-child connection
      const childNode = nodes.find(n => n.person.id === child.id);
      if (childNode) {
        connections.push({
          id: `parent-child-${parentPerson.id}-${child.id}`,
          type: 'parent-child',
          from: { x: parentCenterX, y: parentY + CONFIG.NODE_HEIGHT / 2 },
          to: { x: childNode.x, y: childY - CONFIG.NODE_HEIGHT / 2 },
          fromId: parentPerson.id,
          toId: child.id,
        });
      }
      
      // Recursively position grandchildren
      positionDescendants(child, result.centerX, childY, generation + 1, depth + 1);
      
      currentX += childWidth + CONFIG.HORIZONTAL_GAP;
    }
  }

  /**
   * Position ancestors above the focused person (direct lineage only, no siblings).
   */
  function positionAncestors(
    personId: string,
    personCenterX: number,
    personY: number,
    generation: number,
    depth: number
  ): void {
    if (depth >= CONFIG.MAX_LAYERS_UP) return;
    
    const parents = findParents(personId, people).filter(p => !positioned.has(p.id));
    
    if (parents.length === 0) return;
    
    const parentY = personY - CONFIG.VERTICAL_GAP - CONFIG.NODE_HEIGHT;
    const parent = parents[0]; // Get the first parent (couple will be positioned together)
    
    const result = positionCouple(parent, personCenterX, parentY, generation - 1, {
      isChild: false,
      isParent: true,
    });
    
    // Find the child node to connect to
    const childNode = nodes.find(n => n.person.id === personId);
    if (childNode) {
      connections.push({
        id: `parent-child-${parent.id}-${personId}`,
        type: 'parent-child',
        from: { x: result.centerX, y: parentY + CONFIG.NODE_HEIGHT / 2 },
        to: { x: childNode.x, y: personY - CONFIG.NODE_HEIGHT / 2 },
        fromId: parent.id,
        toId: personId,
      });
    }
    
    // NOTE: We do NOT position siblings here - only direct lineage
    
    // Recursively position grandparents
    positionAncestors(parent.id, result.centerX, parentY, generation - 1, depth + 1);
  }

  // Start layout from focused person
  const focusedGeneration = 0;
  const focusedY = 0;
  const focusedX = 0;

  // Position focused person and their spouse
  const result = positionCouple(focusedPerson, focusedX, focusedY, focusedGeneration, {
    isChild: false,
    isParent: false,
  });
  
  // Position descendants below (up to 4 layers)
  positionDescendants(focusedPerson, result.centerX, focusedY, focusedGeneration, 0);
  
  // Position ancestors above (up to 4 layers, no siblings)
  positionAncestors(focusedPersonId, result.centerX, focusedY, focusedGeneration, 0);

  // Calculate bounds with dynamic widths
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  
  for (const node of nodes) {
    const halfWidth = node.width / 2;
    const halfHeight = node.height / 2;
    minX = Math.min(minX, node.x - halfWidth);
    maxX = Math.max(maxX, node.x + halfWidth);
    minY = Math.min(minY, node.y - halfHeight);
    maxY = Math.max(maxY, node.y + halfHeight);
  }
  
  // Handle empty case
  if (!isFinite(minX)) {
    minX = maxX = minY = maxY = 0;
  }

  const focusedNode = nodes.find(n => n.isFocused) || null;

  return {
    nodes,
    connections,
    bounds: {
      minX,
      maxX,
      minY,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    },
    focusedNode,
  };
}

/**
 * Re-export config for use in components.
 */
export const LAYOUT_CONFIG = {
  ...CONFIG,
  NODE_WIDTH: CONFIG.MIN_NODE_WIDTH, // Default for backwards compatibility
};

/**
 * Export function to calculate node width for use in components.
 */
export { calculateNodeWidth };
