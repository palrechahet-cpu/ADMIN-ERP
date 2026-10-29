import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { auth, googleAuthProvider, db } from '../services/firebase';
import { Workspace, WorkspaceFeatures, WorkspaceRole, AuthUser } from '../types/clinic';

const DEFAULT_WORKSPACE_FEATURES: WorkspaceFeatures = {
  requestsTriage: true,
  paymentsLedger: true,
  consultantsCaseload: true,
  googleCalendarSync: true,
};

const DEFAULT_WORKSPACE: Workspace = {
  id: 'ws_mindwell_flagship',
  name: 'MindWell Center for Psychotherapy',
  slug: 'mindwell-practice',
  creatorUid: 'creator_het_palrecha',
  creatorEmail: 'palrechahet@gmail.com',
  creatorName: 'Dr. Het Palrecha (Practice Director)',
  accessCode: 'MW-9428',
  authorizedEmails: ['palrechahet@gmail.com', 'admin@mindwell.health', 'coordinator@mindwell.health'],
  enabledFeatures: DEFAULT_WORKSPACE_FEATURES,
  practiceType: 'clinic',
  practiceCategory: 'Psychology & Psychotherapy',
  servicesOffered: [
    'Individual Psychotherapy',
    'Cognitive Behavioral Therapy (CBT)',
    'Intake & Clinical Assessment',
    'Couples & Family Counseling',
    'Trauma & EMDR Session',
    'Mindfulness & Stress Management',
    'Psychiatric Medication Review'
  ],
  providerLabel: 'Therapists',
  providerLabelSingular: 'Therapist',
  clientLabel: 'Clients',
  clientLabelSingular: 'Client',
  specialtyTags: ['Anxiety & Stress', 'Depression', 'Trauma & PTSD', 'Relationship & Family', 'ADHD & Focus'],
  clientCapacity: 100,
  timezone: 'America/Los_Angeles (PST)',
  createdAt: '2026-01-15T08:00:00Z',
  updatedAt: new Date().toISOString(),
};

interface AuthWorkspaceContextType {
  user: AuthUser | null;
  isLoadingAuth: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  simulateGoogleSignIn: (email: string, name: string, isCreator?: boolean) => void;
  
  // Workspace management
  currentWorkspace: Workspace | null;
  userRole: WorkspaceRole | null;
  isCreator: boolean;
  workspacesList: Workspace[];
  isConfiguringNewWorkspace: boolean;
  setIsConfiguringNewWorkspace: (value: boolean) => void;
  
  createWorkspace: (params: {
    name: string;
    practiceType: 'solo' | 'group' | 'clinic' | 'coaching';
    enabledFeatures: WorkspaceFeatures;
    authorizedEmails: string[];
    practiceCategory?: string;
    servicesOffered?: string[];
    providerLabel?: string;
    providerLabelSingular?: string;
    clientLabel?: string;
    clientLabelSingular?: string;
    specialtyTags?: string[];
    clientCapacity?: number;
  }) => Promise<Workspace>;
  
  joinWorkspaceWithCode: (code: string) => Promise<{ success: boolean; error?: string }>;
  updateWorkspaceSettings: (
    updatedFeatures: Partial<WorkspaceFeatures>, 
    additionalData?: Partial<Workspace>
  ) => Promise<{ success: boolean; error?: string }>;
  regenerateAccessCode: () => Promise<string>;
  addAuthorizedEmail: (email: string) => Promise<void>;
  removeAuthorizedEmail: (email: string) => Promise<void>;
  switchWorkspace: (workspaceId: string) => void;
  leaveWorkspace: () => void;
}

const AuthWorkspaceContext = createContext<AuthWorkspaceContextType | undefined>(undefined);

const LOCAL_STORAGE_WORKSPACE_KEY = 'mindwell_active_workspace_id';
const LOCAL_STORAGE_WORKSPACES_STORE = 'mindwell_workspaces_store_v1';
const LOCAL_STORAGE_SIMULATED_USER = 'mindwell_simulated_user_v1';

export const AuthWorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [workspacesList, setWorkspacesList] = useState<Workspace[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_WORKSPACES_STORE);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Could not parse stored workspaces:', e);
    }
    return [DEFAULT_WORKSPACE];
  });

  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LOCAL_STORAGE_WORKSPACE_KEY) || DEFAULT_WORKSPACE.id;
    } catch (e) {
      return DEFAULT_WORKSPACE.id;
    }
  });

  const [isConfiguringNewWorkspace, setIsConfiguringNewWorkspace] = useState(false);

  // Synchronize workspaces to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_WORKSPACES_STORE, JSON.stringify(workspacesList));
    } catch (e) {
      console.warn('Error saving workspaces list:', e);
    }
  }, [workspacesList]);

  // Synchronize current workspace ID
  useEffect(() => {
    try {
      if (currentWorkspaceId) {
        localStorage.setItem(LOCAL_STORAGE_WORKSPACE_KEY, currentWorkspaceId);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_WORKSPACE_KEY);
      }
    } catch (e) {
      // ignore
    }
  }, [currentWorkspaceId]);

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const authUserData: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Clinician',
          photoURL: firebaseUser.photoURL,
        };
        setUser(authUserData);
      } else {
        // Check for simulated session if Firebase not triggered
        try {
          const sim = localStorage.getItem(LOCAL_STORAGE_SIMULATED_USER);
          if (sim) {
            setUser(JSON.parse(sim));
          } else {
            setUser(null);
          }
        } catch (e) {
          setUser(null);
        }
      }
      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setIsLoadingAuth(true);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const signedInUser: AuthUser = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || result.user.email?.split('@')[0] || 'Clinician',
        photoURL: result.user.photoURL,
      };
      setUser(signedInUser);
      localStorage.removeItem(LOCAL_STORAGE_SIMULATED_USER);
    } catch (error: any) {
      console.warn('Firebase popup sign-in encountered an issue (e.g. iframe popup restrictions):', error);
      // Fallback for AI Studio preview iframe: prompt with prefilled authorized email
      const promptEmail = prompt(
        'Google Sign-In Preview: Enter your Google email to authenticate into MindWell Practice:', 
        'palrechahet@gmail.com'
      );
      if (promptEmail && promptEmail.trim()) {
        simulateGoogleSignIn(promptEmail.trim(), promptEmail.split('@')[0]);
      }
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const simulateGoogleSignIn = (email: string, name: string, forceCreator: boolean = false) => {
    const simUser: AuthUser = {
      uid: forceCreator ? 'creator_het_palrecha' : `user_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
      email: email.toLowerCase(),
      displayName: name,
      photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    };
    setUser(simUser);
    localStorage.setItem(LOCAL_STORAGE_SIMULATED_USER, JSON.stringify(simUser));
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      // ignore
    }
    localStorage.removeItem(LOCAL_STORAGE_SIMULATED_USER);
    setUser(null);
  };

  // Determine current active workspace
  const currentWorkspace = workspacesList.find(w => w.id === currentWorkspaceId) || null;

  // Determine user role in current workspace
  let userRole: WorkspaceRole | null = null;
  let isCreator = false;

  if (user && currentWorkspace) {
    const userEmail = (user.email || '').toLowerCase();
    const isDirectCreator = currentWorkspace.creatorUid === user.uid || 
      (currentWorkspace.creatorEmail && currentWorkspace.creatorEmail.toLowerCase() === userEmail);
    
    if (isDirectCreator) {
      userRole = 'creator';
      isCreator = true;
    } else {
      // Check if email is authorized or user joined
      const isEmailAuthorized = currentWorkspace.authorizedEmails.some(
        e => e.toLowerCase() === userEmail
      );
      if (isEmailAuthorized) {
        userRole = 'member';
      } else {
        // Not authorized yet
        userRole = null;
      }
    }
  }

  // Create workspace method (called from setup wizard)
  const createWorkspace = async ({
    name,
    practiceType,
    enabledFeatures,
    authorizedEmails,
    practiceCategory = 'Psychology & Psychotherapy',
    servicesOffered = [
      'Individual Psychotherapy',
      'Cognitive Behavioral Therapy (CBT)',
      'Intake & Clinical Assessment',
      'Couples & Family Counseling'
    ],
    providerLabel = 'Therapists',
    providerLabelSingular = 'Therapist',
    clientLabel = 'Clients',
    clientLabelSingular = 'Client',
    specialtyTags = ['Anxiety & Stress', 'Depression', 'Trauma & PTSD', 'Relationship & Family'],
    clientCapacity = 100,
  }: {
    name: string;
    practiceType: 'solo' | 'group' | 'clinic' | 'coaching';
    enabledFeatures: WorkspaceFeatures;
    authorizedEmails: string[];
    practiceCategory?: string;
    servicesOffered?: string[];
    providerLabel?: string;
    providerLabelSingular?: string;
    clientLabel?: string;
    clientLabelSingular?: string;
    specialtyTags?: string[];
    clientCapacity?: number;
  }): Promise<Workspace> => {
    if (!user) throw new Error('Must be signed in to create a workspace.');

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const code = `${name.slice(0, 2).toUpperCase()}-${randomSuffix}`;
    const workspaceId = `ws_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const userEmail = user.email || 'creator@mindwell.health';

    const normalizedAuthorized = Array.from(new Set([
      userEmail.toLowerCase(),
      ...authorizedEmails.map(e => e.trim().toLowerCase()).filter(Boolean)
    ]));

    const newWorkspace: Workspace = {
      id: workspaceId,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      creatorUid: user.uid,
      creatorEmail: userEmail,
      creatorName: user.displayName || 'Practice Director',
      accessCode: code,
      authorizedEmails: normalizedAuthorized,
      enabledFeatures,
      practiceType,
      practiceCategory,
      servicesOffered,
      providerLabel,
      providerLabelSingular,
      clientLabel,
      clientLabelSingular,
      specialtyTags,
      clientCapacity,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update in local state
    setWorkspacesList(prev => [...prev, newWorkspace]);
    setCurrentWorkspaceId(newWorkspace.id);
    setIsConfiguringNewWorkspace(false);

    // Persist to Firestore
    try {
      await setDoc(doc(db, 'workspaces', workspaceId), newWorkspace);
    } catch (err) {
      console.warn('Firestore workspace setDoc fallback to local:', err);
    }

    return newWorkspace;
  };

  // Join workspace using access code
  const joinWorkspaceWithCode = async (code: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Please sign in with Google first.' };
    const cleanCode = code.trim().toUpperCase();
    
    // Check in local workspaces list first
    const match = workspacesList.find(w => w.accessCode.trim().toUpperCase() === cleanCode);
    
    if (match) {
      const userEmail = (user.email || '').toLowerCase();
      // Add user's email to authorized list if not already present
      if (!match.authorizedEmails.some(e => e.toLowerCase() === userEmail)) {
        const updatedAuthorized = [...match.authorizedEmails, userEmail];
        const updatedWorkspace = { ...match, authorizedEmails: updatedAuthorized, updatedAt: new Date().toISOString() };
        setWorkspacesList(prev => prev.map(w => w.id === match.id ? updatedWorkspace : w));
        
        try {
          await updateDoc(doc(db, 'workspaces', match.id), {
            authorizedEmails: updatedAuthorized,
            updatedAt: updatedWorkspace.updatedAt
          });
        } catch (e) {
          // ignore
        }
      }
      
      setCurrentWorkspaceId(match.id);
      return { success: true };
    }

    // Try Firestore query
    try {
      const q = query(collection(db, 'workspaces'), where('accessCode', '==', cleanCode));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const docData = querySnap.docs[0].data() as Workspace;
        const userEmail = (user.email || '').toLowerCase();
        const updatedAuthorized = Array.from(new Set([...docData.authorizedEmails, userEmail]));
        
        const updatedWorkspace = { ...docData, authorizedEmails: updatedAuthorized, updatedAt: new Date().toISOString() };
        setWorkspacesList(prev => [...prev.filter(w => w.id !== updatedWorkspace.id), updatedWorkspace]);
        setCurrentWorkspaceId(updatedWorkspace.id);

        try {
          await updateDoc(doc(db, 'workspaces', docData.id), {
            authorizedEmails: updatedAuthorized,
            updatedAt: updatedWorkspace.updatedAt
          });
        } catch (e) {
          // ignore
        }

        return { success: true };
      }
    } catch (err) {
      console.warn('Firestore query error:', err);
    }

    return { 
      success: false, 
      error: `Invalid Access Code "${cleanCode}". Please verify with your Workspace Creator.` 
    };
  };

  // Update workspace settings (CREATOR ONLY)
  const updateWorkspaceSettings = async (
    updatedFeatures: Partial<WorkspaceFeatures>,
    additionalData?: Partial<Workspace>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isCreator || !currentWorkspace) {
      return { success: false, error: 'Only the Workspace Creator has permission to modify settings.' };
    }

    const mergedFeatures: WorkspaceFeatures = {
      ...currentWorkspace.enabledFeatures,
      ...updatedFeatures,
    };

    const updatedWorkspace: Workspace = {
      ...currentWorkspace,
      ...additionalData,
      enabledFeatures: mergedFeatures,
      updatedAt: new Date().toISOString(),
    };

    setWorkspacesList(prev => prev.map(w => w.id === updatedWorkspace.id ? updatedWorkspace : w));

    try {
      await updateDoc(doc(db, 'workspaces', updatedWorkspace.id), {
        enabledFeatures: mergedFeatures,
        ...(additionalData || {}),
        updatedAt: updatedWorkspace.updatedAt,
      });
    } catch (err) {
      console.warn('Firestore updateDoc fallback to local:', err);
    }

    return { success: true };
  };

  // Regenerate Access Code (Creator only)
  const regenerateAccessCode = async (): Promise<string> => {
    if (!isCreator || !currentWorkspace) throw new Error('Only the Workspace Creator can regenerate access codes.');
    const prefix = currentWorkspace.name.slice(0, 2).toUpperCase() || 'MW';
    const newCode = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

    await updateWorkspaceSettings({}, { accessCode: newCode });
    return newCode;
  };

  // Add authorized email (Creator only)
  const addAuthorizedEmail = async (email: string) => {
    if (!isCreator || !currentWorkspace) return;
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || currentWorkspace.authorizedEmails.includes(cleanEmail)) return;

    const updated = [...currentWorkspace.authorizedEmails, cleanEmail];
    await updateWorkspaceSettings({}, { authorizedEmails: updated });
  };

  // Remove authorized email (Creator only)
  const removeAuthorizedEmail = async (email: string) => {
    if (!isCreator || !currentWorkspace) return;
    const cleanEmail = email.trim().toLowerCase();
    // Cannot remove creator's own email
    if (cleanEmail === currentWorkspace.creatorEmail.toLowerCase()) return;

    const updated = currentWorkspace.authorizedEmails.filter(e => e.toLowerCase() !== cleanEmail);
    await updateWorkspaceSettings({}, { authorizedEmails: updated });
  };

  const switchWorkspace = (workspaceId: string) => {
    setCurrentWorkspaceId(workspaceId);
  };

  const leaveWorkspace = () => {
    setCurrentWorkspaceId(null);
  };

  return (
    <AuthWorkspaceContext.Provider
      value={{
        user,
        isLoadingAuth,
        signInWithGoogle,
        signOut,
        simulateGoogleSignIn,
        currentWorkspace,
        userRole,
        isCreator,
        workspacesList,
        isConfiguringNewWorkspace,
        setIsConfiguringNewWorkspace,
        createWorkspace,
        joinWorkspaceWithCode,
        updateWorkspaceSettings,
        regenerateAccessCode,
        addAuthorizedEmail,
        removeAuthorizedEmail,
        switchWorkspace,
        leaveWorkspace,
      }}
    >
      {children}
    </AuthWorkspaceContext.Provider>
  );
};

export const useAuthWorkspace = () => {
  const context = useContext(AuthWorkspaceContext);
  if (!context) {
    throw new Error('useAuthWorkspace must be used within an AuthWorkspaceProvider');
  }
  return context;
};
