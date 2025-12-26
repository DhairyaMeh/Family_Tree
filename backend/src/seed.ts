import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { FamilyTreeModel } from './models/FamilyTree.js';
import { UserModel } from './models/User.js';
import type { Person } from './types/index.js';

/**
 * Seed script to populate the database with:
 * - Admin user (unlimited access)
 * - Demo user (gold tier for testing)
 * - Silver and Gold test users
 * - Sample family tree
 */

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/familytree';

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await FamilyTreeModel.deleteMany({});
    await UserModel.deleteMany({});
    console.log('Cleared existing data');

    // Create Admin User
    const adminId = uuidv4();
    const adminUser = new UserModel({
      _id: adminId,
      username: 'admin',
      email: 'admin@familytree.com',
      password: 'admin123', // Will be hashed by pre-save hook
      tier: 'admin',
      isEmailVerified: true,
    });
    await adminUser.save();
    console.log('Created admin user (username: admin, password: admin123)');

    // Create Demo User (Gold tier)
    const demoId = uuidv4();
    const demoUser = new UserModel({
      _id: demoId,
      username: 'demo',
      email: 'demo@familytree.com',
      password: 'demo123',
      tier: 'gold',
      isEmailVerified: true,
    });
    await demoUser.save();
    console.log('Created demo user (username: demo, password: demo123)');

    // Create Silver Test User
    const silverId = uuidv4();
    const silverUser = new UserModel({
      _id: silverId,
      username: 'silver_test',
      email: 'silver@familytree.com',
      password: 'silver123',
      tier: 'silver',
      isEmailVerified: true,
    });
    await silverUser.save();
    console.log('Created silver test user (username: silver_test, password: silver123)');

    // Create Gold Test User
    const goldId = uuidv4();
    const goldUser = new UserModel({
      _id: goldId,
      username: 'gold_test',
      email: 'gold@familytree.com',
      password: 'gold123',
      tier: 'gold',
      isEmailVerified: true,
    });
    await goldUser.save();
    console.log('Created gold test user (username: gold_test, password: gold123)');

    // Create IDs for all family members
    const ids = {
      grandpaHenry: uuidv4(),
      grandmaEleanor: uuidv4(),
      grandpaRobert: uuidv4(),
      grandmaMartha: uuidv4(),
      fatherJohn: uuidv4(),
      motherMary: uuidv4(),
      uncleJames: uuidv4(),
      auntSarah: uuidv4(),
      auntElizabeth: uuidv4(),
      uncleWilliam: uuidv4(),
      childEmma: uuidv4(),
      childOliver: uuidv4(),
      childSophia: uuidv4(),
      cousinLiam: uuidv4(),
      cousinAva: uuidv4(),
      cousinNoah: uuidv4(),
      grandchildIsabella: uuidv4(),
      grandchildEthan: uuidv4(),
    };

    const people: Record<string, Person> = {
      [ids.grandpaHenry]: {
        id: ids.grandpaHenry,
        name: 'Henry Thompson',
        gender: 'male',
        spouseId: ids.grandmaEleanor,
        childrenIds: [ids.fatherJohn, ids.uncleJames],
        birthYear: 1940,
        alive: false,
      },
      [ids.grandmaEleanor]: {
        id: ids.grandmaEleanor,
        name: 'Eleanor Thompson',
        gender: 'female',
        spouseId: ids.grandpaHenry,
        childrenIds: [ids.fatherJohn, ids.uncleJames],
        birthYear: 1942,
        alive: true,
      },
      [ids.grandpaRobert]: {
        id: ids.grandpaRobert,
        name: 'Robert Williams',
        gender: 'male',
        spouseId: ids.grandmaMartha,
        childrenIds: [ids.motherMary, ids.auntElizabeth],
        birthYear: 1938,
        alive: false,
      },
      [ids.grandmaMartha]: {
        id: ids.grandmaMartha,
        name: 'Martha Williams',
        gender: 'female',
        spouseId: ids.grandpaRobert,
        childrenIds: [ids.motherMary, ids.auntElizabeth],
        birthYear: 1941,
        alive: true,
      },
      [ids.fatherJohn]: {
        id: ids.fatherJohn,
        name: 'John Thompson',
        gender: 'male',
        spouseId: ids.motherMary,
        childrenIds: [ids.childEmma, ids.childOliver, ids.childSophia],
        birthYear: 1965,
        alive: true,
      },
      [ids.motherMary]: {
        id: ids.motherMary,
        name: 'Mary Thompson',
        gender: 'female',
        spouseId: ids.fatherJohn,
        childrenIds: [ids.childEmma, ids.childOliver, ids.childSophia],
        birthYear: 1968,
        alive: true,
      },
      [ids.uncleJames]: {
        id: ids.uncleJames,
        name: 'James Thompson',
        gender: 'male',
        spouseId: ids.auntSarah,
        childrenIds: [ids.cousinLiam, ids.cousinAva],
        birthYear: 1967,
        alive: true,
      },
      [ids.auntSarah]: {
        id: ids.auntSarah,
        name: 'Sarah Thompson',
        gender: 'female',
        spouseId: ids.uncleJames,
        childrenIds: [ids.cousinLiam, ids.cousinAva],
        birthYear: 1970,
        alive: true,
      },
      [ids.auntElizabeth]: {
        id: ids.auntElizabeth,
        name: 'Elizabeth Anderson',
        gender: 'female',
        spouseId: ids.uncleWilliam,
        childrenIds: [ids.cousinNoah],
        birthYear: 1972,
        alive: true,
      },
      [ids.uncleWilliam]: {
        id: ids.uncleWilliam,
        name: 'William Anderson',
        gender: 'male',
        spouseId: ids.auntElizabeth,
        childrenIds: [ids.cousinNoah],
        birthYear: 1969,
        alive: true,
      },
      [ids.childEmma]: {
        id: ids.childEmma,
        name: 'Emma Thompson',
        gender: 'female',
        childrenIds: [ids.grandchildIsabella, ids.grandchildEthan],
        birthYear: 1990,
        alive: true,
      },
      [ids.childOliver]: {
        id: ids.childOliver,
        name: 'Oliver Thompson',
        gender: 'male',
        childrenIds: [],
        birthYear: 1993,
        alive: true,
      },
      [ids.childSophia]: {
        id: ids.childSophia,
        name: 'Sophia Thompson',
        gender: 'female',
        childrenIds: [],
        birthYear: 1996,
        alive: true,
      },
      [ids.cousinLiam]: {
        id: ids.cousinLiam,
        name: 'Liam Thompson',
        gender: 'male',
        childrenIds: [],
        birthYear: 1995,
        alive: true,
      },
      [ids.cousinAva]: {
        id: ids.cousinAva,
        name: 'Ava Thompson',
        gender: 'female',
        childrenIds: [],
        birthYear: 1998,
        alive: true,
      },
      [ids.cousinNoah]: {
        id: ids.cousinNoah,
        name: 'Noah Anderson',
        gender: 'male',
        childrenIds: [],
        birthYear: 1997,
        alive: true,
      },
      [ids.grandchildIsabella]: {
        id: ids.grandchildIsabella,
        name: 'Isabella Martinez',
        gender: 'female',
        childrenIds: [],
        birthYear: 2015,
        alive: true,
      },
      [ids.grandchildEthan]: {
        id: ids.grandchildEthan,
        name: 'Ethan Martinez',
        gender: 'male',
        childrenIds: [],
        birthYear: 2018,
        alive: true,
      },
    };

    const treeId = uuidv4();
    const shareToken = crypto.randomBytes(16).toString('hex');
    
    const tree = new FamilyTreeModel({
      _id: treeId,
      name: 'Thompson Family Tree',
      ownerId: demoId, // Demo user owns this tree
      isPublic: true, // Make it public for demo
      shareToken,
      people: new Map(Object.entries(people)),
      rootId: ids.fatherJohn,
    });

    await tree.save();
    console.log('Created family tree with ID:', treeId);
    console.log('Share token:', shareToken);
    console.log(`Added ${Object.keys(people).length} family members`);

    console.log('\n=== Seed Complete ===');
    console.log('\n📋 Login Credentials:');
    console.log('   Admin:  username=admin, password=admin123 (unlimited trees)');
    console.log('   Demo:   username=demo, password=demo123 (gold tier - 5 trees)');
    console.log('   Silver: username=silver_test, password=silver123 (silver tier - 1 tree)');
    console.log('   Gold:   username=gold_test, password=gold123 (gold tier - 5 trees)');

  } catch (error) {
    console.error('Seed failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

seed();
