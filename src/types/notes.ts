export type NoteType = 'note' | 'list';

export type NoteColor =
  | 'default'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'teal'
  | 'blue'
  | 'purple';

export type ItemActor = {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
};

export type CollaboratorProfile = {
  displayName: string | null;
  photoURL: string | null;
};

export type ChecklistItem = {
  id: string;
  text: string;
  checked: boolean;
  addedBy?: ItemActor;
  checkedBy?: ItemActor | null;
  checkedAt?: string | null; // ISO string
};

export type Note = {
  id: string;
  userId: string;
  collaborators: string[]; // UIDs — used for security rules & array-contains queries
  collaboratorProfiles: Record<string, CollaboratorProfile>; // uid → profile info
  inviteToken: string | null;
  title: string;
  type: NoteType;
  content: string;
  items: ChecklistItem[];
  color: NoteColor;
  isPinned: boolean;
  isPublic: boolean;
  shareToken: string | null;
  createdAt: Date;
  updatedAt: Date;
};
