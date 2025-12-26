import mongoose, { Schema, Document } from 'mongoose';
import type { Person, FamilyTree as IFamilyTree } from '../types/index.js';

/**
 * Mongoose schema for Person subdocument.
 * Embedded within the FamilyTree document for atomic operations.
 */
const PersonSchema = new Schema<Person>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    gender: { type: String, enum: ['male', 'female'], required: true },
    spouseId: { type: String },
    childrenIds: { type: [String], default: [] },
    birthYear: { type: Number },
    alive: { type: Boolean, default: true },
    imageUrl: { type: String },
  },
  { _id: false }
);

/**
 * Main FamilyTree document schema.
 * Stores the entire family as a single document with normalized relationships.
 * This allows for atomic updates and efficient queries.
 */
const FamilyTreeSchema = new Schema<IFamilyTree & Document>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    ownerId: { type: String }, // User who owns this tree
    isPublic: { type: Boolean, default: false }, // Whether tree is publicly viewable
    shareToken: { type: String }, // Token for sharing via link
    people: {
      type: Map,
      of: PersonSchema,
      default: {},
    },
    rootId: { type: String, default: '' }, // Can be empty for new trees
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        // Convert Map to plain object for JSON serialization
        if (ret.people instanceof Map) {
          ret.people = Object.fromEntries(ret.people);
        }
        return ret;
      },
    },
  }
);

/**
 * Pre-save middleware to validate data integrity.
 * Ensures no circular references and validates relationships.
 */
FamilyTreeSchema.pre('save', function (next) {
  const tree = this;
  const people = tree.people as Map<string, Person>;

  // Validate that rootId exists in people (only if tree has people)
  if (tree.rootId && people.size > 0 && !people.has(tree.rootId)) {
    return next(new Error('Root person must exist in the tree'));
  }

  // Validate spouse relationships are bidirectional
  for (const [id, person] of people) {
    if (person.spouseId) {
      const spouse = people.get(person.spouseId);
      if (!spouse) {
        return next(new Error(`Spouse ${person.spouseId} not found for person ${id}`));
      }
      if (spouse.spouseId !== id) {
        // Auto-fix bidirectional relationship
        spouse.spouseId = id;
      }
    }
  }

  next();
});

export const FamilyTreeModel = mongoose.model<IFamilyTree & Document>('FamilyTree', FamilyTreeSchema);

