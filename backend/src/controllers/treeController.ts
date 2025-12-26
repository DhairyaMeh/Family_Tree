import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { FamilyTreeModel } from '../models/FamilyTree.js';
import { AuthRequest, getTreeLimit } from '../middleware/auth.js';
import type {
  CreateTreeRequest,
  UpdateTreeRequest,
  AddSpouseRequest,
  AddChildRequest,
  UpdatePersonRequest,
  Person,
} from '../types/index.js';

/**
 * Check if user can edit a tree (owns it or is admin)
 */
async function canEditTree(userId: string | undefined, userTier: string | undefined, treeId: string): Promise<boolean> {
  if (!userId) return false;
  if (userTier === 'admin') return true;
  if (userTier === 'free') return false; // Free users can't edit
  
  const tree = await FamilyTreeModel.findById(treeId);
  return tree?.ownerId === userId;
}

/**
 * Check if user can create trees based on their tier
 */
async function canCreateTree(userId: string, userTier: string): Promise<{ allowed: boolean; reason?: string }> {
  if (userTier === 'free') {
    return { allowed: false, reason: 'Free tier cannot create trees. Please upgrade to Silver or Gold.' };
  }
  
  if (userTier === 'admin') {
    return { allowed: true };
  }
  
  const limit = getTreeLimit(userTier);
  const existingTrees = await FamilyTreeModel.countDocuments({ ownerId: userId });
  
  if (existingTrees >= limit) {
    return { allowed: false, reason: `You have reached your limit of ${limit} tree(s). Please upgrade to create more.` };
  }
  
  return { allowed: true };
}

/**
 * Get a family tree by ID or share token.
 * Returns the complete tree with all people and relationships.
 */
export async function getTree(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const shareToken = req.query.token as string | undefined;
    const user = req.user;
    
    // First try to find by share token
    let tree = shareToken 
      ? await FamilyTreeModel.findOne({ shareToken })
      : await FamilyTreeModel.findById(id);

    if (!tree) {
      res.status(404).json({ success: false, error: 'Tree not found' });
      return;
    }

    // Check access: user owns tree, tree is public, or valid share token
    const hasAccess = 
      (tree as any).isPublic ||
      (shareToken && (tree as any).shareToken === shareToken) ||
      (user && (tree as any).ownerId === user._id) ||
      user?.tier === 'admin';

    if (!hasAccess) {
      res.status(403).json({ success: false, error: 'You do not have access to this tree' });
      return;
    }

    // Convert Map to plain object
    const treeObj = tree.toJSON();
    
    // Include canEdit flag
    const canEdit = user && 
      ((tree as any).ownerId === user._id || user.tier === 'admin') &&
      user.tier !== 'free';

    res.json({ success: true, data: { ...treeObj, canEdit } });
  } catch (error) {
    console.error('Error fetching tree:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

/**
 * Get a family tree by share token (public endpoint).
 * Anyone with the share link can view the tree.
 */
export async function getTreeByShareToken(req: Request, res: Response): Promise<void> {
  try {
    const shareToken = req.query.token as string;
    
    if (!shareToken) {
      res.status(400).json({ success: false, error: 'Share token is required' });
      return;
    }
    
    const tree = await FamilyTreeModel.findOne({ shareToken });

    if (!tree) {
      res.status(404).json({ success: false, error: 'Shared tree not found or link is invalid' });
      return;
    }

    // Convert Map to plain object
    const treeObj = tree.toJSON();
    
    // Shared trees are always read-only for the link viewer
    res.json({ success: true, data: { ...treeObj, canEdit: false } });
  } catch (error) {
    console.error('Error fetching shared tree:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

/**
 * Get all family trees (for listing/selection).
 * Returns user's own trees + public/shared trees
 */
export async function getAllTrees(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    
    // Build query based on authentication
    let query: any;
    if (user) {
      // Logged in users see their own trees + public trees
      query = {
        $or: [
          { ownerId: user._id },
          { isPublic: true },
        ]
      };
    } else {
      // Anonymous users only see public trees
      query = { isPublic: true };
    }

    const trees = await FamilyTreeModel.find(query, { 
      _id: 1, name: 1, rootId: 1, createdAt: 1, updatedAt: 1, ownerId: 1, shareToken: 1, isPublic: 1 
    });
    
    // Get additional info for each tree
    const treesWithInfo = await Promise.all(
      trees.map(async (tree) => {
        const fullTree = await FamilyTreeModel.findById(tree._id);
        const people = fullTree?.people as Map<string, Person> | undefined;
        const peopleCount = people?.size || 0;
        return {
          _id: tree._id,
          name: (tree as any).name || 'Unnamed Tree',
          rootId: tree.rootId,
          peopleCount,
          createdAt: tree.createdAt,
          updatedAt: tree.updatedAt,
          ownerId: (tree as any).ownerId,
          shareToken: (tree as any).shareToken,
          isPublic: (tree as any).isPublic,
          isOwner: user ? (tree as any).ownerId === user._id : false,
        };
      })
    );

    res.json({ success: true, data: treesWithInfo });
  } catch (error) {
    console.error('Error fetching trees:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

/**
 * Create a new family tree.
 * Can create an empty tree (just name) or with a root person.
 */
export async function createTree(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, rootPerson } = req.body as CreateTreeRequest;
    const user = req.user;

    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // Check if user can create trees
    const { allowed, reason } = await canCreateTree(user._id, user.tier);
    if (!allowed) {
      res.status(403).json({ success: false, error: reason });
      return;
    }

    if (!name) {
      res.status(400).json({ success: false, error: 'Tree name is required' });
      return;
    }

    const treeId = uuidv4();
    const shareToken = crypto.randomBytes(16).toString('hex');

    // If root person provided, create tree with first person
    if (rootPerson?.name && rootPerson?.gender) {
      const personId = uuidv4();

      const person: Person = {
        id: personId,
        name: rootPerson.name,
        gender: rootPerson.gender,
        childrenIds: [],
        birthDate: rootPerson.birthDate,
        alive: rootPerson.alive ?? true,
      };

      const tree = new FamilyTreeModel({
        _id: treeId,
        name,
        ownerId: user._id,
        shareToken,
        people: new Map([[personId, person]]),
        rootId: personId,
      });

      await tree.save();
      res.status(201).json({ success: true, data: tree.toJSON() });
    } else {
      // Create empty tree
      const tree = new FamilyTreeModel({
        _id: treeId,
        name,
        ownerId: user._id,
        shareToken,
        people: new Map(),
        rootId: '',
      });

      await tree.save();
      res.status(201).json({ success: true, data: tree.toJSON() });
    }
  } catch (error) {
    console.error('Error creating tree:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

/**
 * Update tree details (e.g., rename).
 */
export async function updateTree(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name } = req.body as UpdateTreeRequest;
    const user = req.user;

    // Check edit permission
    if (!user || !(await canEditTree(user._id, user.tier, id))) {
      res.status(403).json({ success: false, error: 'You do not have permission to edit this tree' });
      return;
    }

    const tree = await FamilyTreeModel.findById(id);
    if (!tree) {
      res.status(404).json({ success: false, error: 'Tree not found' });
      return;
    }

    if (name !== undefined) {
      (tree as any).name = name;
    }

    await tree.save();
    res.json({ success: true, data: tree.toJSON() });
  } catch (error) {
    console.error('Error updating tree:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

/**
 * Add first person to an empty tree.
 */
export async function addFirstPerson(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const personData = req.body as AddChildRequest;
    const user = req.user;

    // Check edit permission
    if (!user || !(await canEditTree(user._id, user.tier, id))) {
      res.status(403).json({ success: false, error: 'You do not have permission to edit this tree' });
      return;
    }

    if (!personData?.name || !personData?.gender) {
      res.status(400).json({ success: false, error: 'Person name and gender are required' });
      return;
    }

    const tree = await FamilyTreeModel.findById(id);
    if (!tree) {
      res.status(404).json({ success: false, error: 'Tree not found' });
      return;
    }

    const people = tree.people as Map<string, Person>;
    
    if (people.size > 0) {
      res.status(400).json({ success: false, error: 'Tree already has people. Use add child/parent/spouse instead.' });
      return;
    }

    const personId = uuidv4();
    const person: Person = {
      id: personId,
      name: personData.name,
      gender: personData.gender,
      childrenIds: [],
      birthDate: personData.birthDate,
      alive: personData.alive ?? true,
    };

    people.set(personId, person);
    tree.rootId = personId;

    tree.markModified('people');
    await tree.save();

    res.status(201).json({ success: true, data: tree.toJSON() });
  } catch (error) {
    console.error('Error adding first person:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

/**
 * Delete an entire family tree.
 */
export async function deleteTree(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const user = req.user;

    // Check edit permission
    if (!user || !(await canEditTree(user._id, user.tier, id))) {
      res.status(403).json({ success: false, error: 'You do not have permission to delete this tree' });
      return;
    }

    const result = await FamilyTreeModel.findByIdAndDelete(id);

    if (!result) {
      res.status(404).json({ success: false, error: 'Tree not found' });
      return;
    }

    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error('Error deleting tree:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

/**
 * Add a spouse to an existing person.
 * Creates bidirectional spouse relationship.
 */
export async function addSpouse(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { treeId, personId } = req.params;
    const spouseData = req.body as AddSpouseRequest;
    const user = req.user;

    // Check edit permission
    if (!user || !(await canEditTree(user._id, user.tier, treeId))) {
      res.status(403).json({ success: false, error: 'You do not have permission to edit this tree' });
      return;
    }

    if (!spouseData?.name || !spouseData?.gender) {
      res.status(400).json({ success: false, error: 'Spouse name and gender are required' });
      return;
    }

    const tree = await FamilyTreeModel.findById(treeId);
    if (!tree) {
      res.status(404).json({ success: false, error: 'Tree not found' });
      return;
    }

    const people = tree.people as Map<string, Person>;
    const person = people.get(personId);

    if (!person) {
      res.status(404).json({ success: false, error: 'Person not found' });
      return;
    }

    if (person.spouseId) {
      res.status(400).json({ success: false, error: 'Person already has a spouse' });
      return;
    }

    const spouseId = uuidv4();
    const spouse: Person = {
      id: spouseId,
      name: spouseData.name,
      gender: spouseData.gender,
      spouseId: personId,
      childrenIds: [...person.childrenIds], // Share children with spouse
      birthDate: spouseData.birthDate,
      alive: spouseData.alive ?? true,
    };

    // Update the original person with spouse reference
    person.spouseId = spouseId;
    people.set(personId, person);
    people.set(spouseId, spouse);

    tree.markModified('people');
    await tree.save();

    res.status(201).json({ success: true, data: tree.toJSON() });
  } catch (error) {
    console.error('Error adding spouse:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

/**
 * Add a parent to an existing person (for building tree upward/ancestors).
 * Creates a new parent person and adds the existing person as their child.
 */
export async function addParent(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { treeId, personId } = req.params;
    const parentData = req.body as AddChildRequest; // Same structure as child
    const user = req.user;

    // Check edit permission
    if (!user || !(await canEditTree(user._id, user.tier, treeId))) {
      res.status(403).json({ success: false, error: 'You do not have permission to edit this tree' });
      return;
    }

    if (!parentData?.name || !parentData?.gender) {
      res.status(400).json({ success: false, error: 'Parent name and gender are required' });
      return;
    }

    const tree = await FamilyTreeModel.findById(treeId);
    if (!tree) {
      res.status(404).json({ success: false, error: 'Tree not found' });
      return;
    }

    const people = tree.people as Map<string, Person>;
    const child = people.get(personId);

    if (!child) {
      res.status(404).json({ success: false, error: 'Person not found' });
      return;
    }

    // Check if this person already has parents
    const existingParents: Person[] = [];
    for (const person of people.values()) {
      if (person.childrenIds.includes(personId)) {
        existingParents.push(person);
      }
    }

    // Allow up to 2 parents (couple)
    if (existingParents.length >= 2) {
      res.status(400).json({ success: false, error: 'Person already has two parents' });
      return;
    }

    const parentId = uuidv4();
    const parent: Person = {
      id: parentId,
      name: parentData.name,
      gender: parentData.gender,
      childrenIds: [personId],
      birthDate: parentData.birthDate,
      alive: parentData.alive ?? true,
    };

    // If there's already one parent, link them as spouses
    if (existingParents.length === 1) {
      const existingParent = existingParents[0];
      
      // Only link as spouse if the existing parent doesn't have one
      if (!existingParent.spouseId) {
        parent.spouseId = existingParent.id;
        existingParent.spouseId = parentId;
        people.set(existingParent.id, existingParent);
      }
    }

    people.set(parentId, parent);

    tree.markModified('people');
    await tree.save();

    res.status(201).json({ success: true, data: tree.toJSON() });
  } catch (error) {
    console.error('Error adding parent:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

/**
 * Add a child to a person (and their spouse if exists).
 * The child is added to both parents' childrenIds arrays.
 */
export async function addChild(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { treeId, personId } = req.params;
    const childData = req.body as AddChildRequest;
    const user = req.user;

    // Check edit permission
    if (!user || !(await canEditTree(user._id, user.tier, treeId))) {
      res.status(403).json({ success: false, error: 'You do not have permission to edit this tree' });
      return;
    }

    if (!childData?.name || !childData?.gender) {
      res.status(400).json({ success: false, error: 'Child name and gender are required' });
      return;
    }

    const tree = await FamilyTreeModel.findById(treeId);
    if (!tree) {
      res.status(404).json({ success: false, error: 'Tree not found' });
      return;
    }

    const people = tree.people as Map<string, Person>;
    const parent = people.get(personId);

    if (!parent) {
      res.status(404).json({ success: false, error: 'Parent not found' });
      return;
    }

    const childId = uuidv4();
    const child: Person = {
      id: childId,
      name: childData.name,
      gender: childData.gender,
      childrenIds: [],
      birthDate: childData.birthDate,
      alive: childData.alive ?? true,
    };

    // Add child to parent's children
    parent.childrenIds.push(childId);
    people.set(personId, parent);

    // If parent has a spouse, add child to spouse's children too
    if (parent.spouseId) {
      const spouse = people.get(parent.spouseId);
      if (spouse) {
        spouse.childrenIds.push(childId);
        people.set(parent.spouseId, spouse);
      }
    }

    people.set(childId, child);

    tree.markModified('people');
    await tree.save();

    res.status(201).json({ success: true, data: tree.toJSON() });
  } catch (error) {
    console.error('Error adding child:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

/**
 * Update a person's details.
 * Does not modify relationships (use specific endpoints for that).
 */
export async function updatePerson(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { treeId, personId } = req.params;
    const updates = req.body as UpdatePersonRequest;
    const user = req.user;

    // Check edit permission
    if (!user || !(await canEditTree(user._id, user.tier, treeId))) {
      res.status(403).json({ success: false, error: 'You do not have permission to edit this tree' });
      return;
    }

    const tree = await FamilyTreeModel.findById(treeId);
    if (!tree) {
      res.status(404).json({ success: false, error: 'Tree not found' });
      return;
    }

    const people = tree.people as Map<string, Person>;
    const person = people.get(personId);

    if (!person) {
      res.status(404).json({ success: false, error: 'Person not found' });
      return;
    }

    // Apply updates
    if (updates.name !== undefined) person.name = updates.name;
    if (updates.gender !== undefined) person.gender = updates.gender;
    if (updates.birthDate !== undefined) person.birthDate = updates.birthDate;
    if (updates.alive !== undefined) person.alive = updates.alive;
    if (updates.imageUrl !== undefined) person.imageUrl = updates.imageUrl;

    people.set(personId, person);

    tree.markModified('people');
    await tree.save();

    res.json({ success: true, data: tree.toJSON() });
  } catch (error) {
    console.error('Error updating person:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

/**
 * Delete a person from the tree.
 * Handles relationship cleanup:
 * - Removes spouse reference from partner
 * - Removes from parent's childrenIds
 * - Optionally handles orphaned children
 */
export async function deletePerson(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { treeId, personId } = req.params;
    const user = req.user;

    // Check edit permission
    if (!user || !(await canEditTree(user._id, user.tier, treeId))) {
      res.status(403).json({ success: false, error: 'You do not have permission to edit this tree' });
      return;
    }

    const tree = await FamilyTreeModel.findById(treeId);
    if (!tree) {
      res.status(404).json({ success: false, error: 'Tree not found' });
      return;
    }

    const people = tree.people as Map<string, Person>;
    const person = people.get(personId);

    if (!person) {
      res.status(404).json({ success: false, error: 'Person not found' });
      return;
    }

    // Cannot delete root if it's the only person
    if (tree.rootId === personId && people.size === 1) {
      res.status(400).json({ success: false, error: 'Cannot delete the only person in the tree' });
      return;
    }

    // Remove spouse reference from partner
    if (person.spouseId) {
      const spouse = people.get(person.spouseId);
      if (spouse) {
        spouse.spouseId = undefined;
        people.set(person.spouseId, spouse);
      }
    }

    // Find and update parents (remove from their childrenIds)
    for (const [id, p] of people) {
      if (p.childrenIds.includes(personId)) {
        p.childrenIds = p.childrenIds.filter((cid) => cid !== personId);
        people.set(id, p);
      }
    }

    // Handle children - transfer to spouse or make them independent
    if (person.childrenIds.length > 0 && !person.spouseId) {
      // If no spouse, children become independent (orphaned in tree context)
      // They remain in the tree but have no parent reference
    }

    // Update root if we're deleting the root person
    if (tree.rootId === personId) {
      // Find a new root - prefer spouse, then first child, then first remaining person
      if (person.spouseId) {
        tree.rootId = person.spouseId;
      } else if (person.childrenIds.length > 0) {
        tree.rootId = person.childrenIds[0];
      } else {
        // Find first remaining person
        const remainingIds = Array.from(people.keys()).filter((id) => id !== personId);
        if (remainingIds.length > 0) {
          tree.rootId = remainingIds[0];
        }
      }
    }

    // Delete the person
    people.delete(personId);

    tree.markModified('people');
    await tree.save();

    res.json({ success: true, data: tree.toJSON() });
  } catch (error) {
    console.error('Error deleting person:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

