import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { FamilyTreeModel } from '../models/FamilyTree.js';
import type {
  CreateTreeRequest,
  UpdateTreeRequest,
  AddSpouseRequest,
  AddChildRequest,
  UpdatePersonRequest,
  Person,
} from '../types/index.js';

/**
 * Get a family tree by ID.
 * Returns the complete tree with all people and relationships.
 */
export async function getTree(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tree = await FamilyTreeModel.findById(id);

    if (!tree) {
      res.status(404).json({ success: false, error: 'Tree not found' });
      return;
    }

    // Convert Map to plain object
    const treeObj = tree.toJSON();
    res.json({ success: true, data: treeObj });
  } catch (error) {
    console.error('Error fetching tree:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

/**
 * Get all family trees (for listing/selection).
 */
export async function getAllTrees(req: Request, res: Response): Promise<void> {
  try {
    const trees = await FamilyTreeModel.find({}, { _id: 1, name: 1, rootId: 1, createdAt: 1, updatedAt: 1 });
    
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
export async function createTree(req: Request, res: Response): Promise<void> {
  try {
    const { name, rootPerson } = req.body as CreateTreeRequest;

    if (!name) {
      res.status(400).json({ success: false, error: 'Tree name is required' });
      return;
    }

    const treeId = uuidv4();

    // If root person provided, create tree with first person
    if (rootPerson?.name && rootPerson?.gender) {
      const personId = uuidv4();

      const person: Person = {
        id: personId,
        name: rootPerson.name,
        gender: rootPerson.gender,
        childrenIds: [],
        birthYear: rootPerson.birthYear,
        alive: rootPerson.alive ?? true,
      };

      const tree = new FamilyTreeModel({
        _id: treeId,
        name,
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
export async function updateTree(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name } = req.body as UpdateTreeRequest;

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
export async function addFirstPerson(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const personData = req.body as AddChildRequest;

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
      birthYear: personData.birthYear,
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
export async function deleteTree(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
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
export async function addSpouse(req: Request, res: Response): Promise<void> {
  try {
    const { treeId, personId } = req.params;
    const spouseData = req.body as AddSpouseRequest;

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
      birthYear: spouseData.birthYear,
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
export async function addParent(req: Request, res: Response): Promise<void> {
  try {
    const { treeId, personId } = req.params;
    const parentData = req.body as AddChildRequest; // Same structure as child

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
      birthYear: parentData.birthYear,
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
export async function addChild(req: Request, res: Response): Promise<void> {
  try {
    const { treeId, personId } = req.params;
    const childData = req.body as AddChildRequest;

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
      birthYear: childData.birthYear,
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
export async function updatePerson(req: Request, res: Response): Promise<void> {
  try {
    const { treeId, personId } = req.params;
    const updates = req.body as UpdatePersonRequest;

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
    if (updates.birthYear !== undefined) person.birthYear = updates.birthYear;
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
export async function deletePerson(req: Request, res: Response): Promise<void> {
  try {
    const { treeId, personId } = req.params;

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

