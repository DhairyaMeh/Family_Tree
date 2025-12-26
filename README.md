# Family Tree - Interactive Visualization

A production-ready, enterprise-grade family tree web application with smooth animations and full CRUD capabilities. Inspired by the Workday org chart experience.

![Family Tree Preview](https://via.placeholder.com/800x400?text=Family+Tree+Visualization)

## Features

### Visualization
- **Focus-based navigation**: Click any person to center the view on them
- **Smooth animations**: Framer Motion-powered transitions similar to Workday
- **Spouses side-by-side**: Horizontal positioning with heart connector
- **Children centered below**: Hierarchical layout with elbow connectors
- **Pan & Zoom**: Mouse drag and wheel/pinch zoom support
- **Navigation history**: Back/forward buttons with full history stack

### Editing
- **Add spouse**: Ring button on unmarried persons
- **Add child**: Child button on any person
- **Edit person**: Modify name, gender, birth year, alive status
- **Delete person**: Safe deletion with relationship cleanup

### Data
- **MongoDB persistence**: All changes saved to database
- **Normalized graph structure**: Efficient relationship management
- **Multi-tree support**: Create and switch between family trees

## Tech Stack

### Frontend
- React 18 + TypeScript
- SVG rendering (no canvas)
- D3.js for layout calculations only
- Framer Motion for animations
- Vite for development/build

### Backend
- Node.js + Express
- MongoDB with Mongoose
- REST API
- UUID-based IDs
- CORS enabled

## Project Structure

```
FamilyTree/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # API routes
│   │   ├── types/           # TypeScript types
│   │   ├── index.ts         # Server entry
│   │   └── seed.ts          # Sample data seeder
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── TreeSVG.tsx
│   │   │   ├── PersonNode.tsx
│   │   │   ├── Connectors.tsx
│   │   │   ├── Controls.tsx
│   │   │   └── Modal.tsx
│   │   ├── hooks/           # Custom React hooks
│   │   │   ├── useFamilyTree.ts
│   │   │   ├── useNavigation.ts
│   │   │   └── useTransform.ts
│   │   ├── services/        # API client
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Layout engine
│   │   ├── styles/          # CSS
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
└── README.md
```

## Data Model

### Person
```typescript
interface Person {
  id: string;              // UUID
  name: string;
  gender: "male" | "female";
  spouseId?: string;       // Reference to spouse
  childrenIds: string[];   // References to children
  birthYear?: number;
  alive?: boolean;
}
```

### FamilyTree
```typescript
interface FamilyTree {
  _id: string;                      // UUID
  people: Record<string, Person>;   // Map of all persons
  rootId: string;                   // Default focused person
  createdAt: Date;
  updatedAt: Date;
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trees` | List all trees |
| GET | `/api/tree/:id` | Get tree by ID |
| POST | `/api/tree` | Create new tree |
| DELETE | `/api/tree/:id` | Delete tree |
| PUT | `/api/tree/:treeId/person/:personId` | Update person |
| DELETE | `/api/tree/:treeId/person/:personId` | Delete person |
| POST | `/api/tree/:treeId/person/:personId/spouse` | Add spouse |
| POST | `/api/tree/:treeId/person/:personId/child` | Add child |

## Layout Algorithm

The layout engine computes positions relative to a focused person:

1. **Focused person** placed at center (0, 0)
2. **Spouse** placed horizontally adjacent
3. **Children** centered below the couple
4. **Parents** centered above
5. **Siblings** positioned to the side
6. **Recursive** for extended family

Key features:
- No static root anchoring
- Positions interpolate smoothly on focus change
- Handles single parents, widowed spouses
- Scales to large families and deep generations

## Running Locally

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### 1. Start MongoDB
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or start local MongoDB
mongod --dbpath /path/to/data
```

### 2. Setup Backend
```bash
cd backend
npm install

# Seed sample data (optional but recommended)
npm run seed

# Start development server
npm run dev
```

Backend runs at `http://localhost:3001`

### 3. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

### 4. Open in Browser
Navigate to `http://localhost:5173`

## Environment Variables

### Backend
Create `backend/.env`:
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/familytree
NODE_ENV=development
```

## Usage Tips

- **Click** any person to focus the tree on them
- **Hover** over a person to see action buttons
- **Drag** to pan the view
- **Scroll** (or pinch) to zoom
- **← →** buttons navigate history
- **💍** adds spouse, **👶** adds child, **✏️** edits, **🗑** deletes

## Architecture Highlights

### Layout Engine
- Pure coordinate calculation using D3's hierarchy concepts
- Returns `LayoutNode[]` with x, y positions
- Handles edge cases: single parents, large families, deep trees

### Animation System
- All transitions use Framer Motion spring physics
- `layoutId` for shared element transitions
- Smooth interpolation between old and new positions

### State Management
- `useFamilyTree` hook for data fetching and CRUD
- `useNavigation` hook for focus history
- `useTransform` hook for pan/zoom

## License

MIT

