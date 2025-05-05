import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Define the User type based on your database schema
interface User {
  userID: string | null;
  name: string | null;
  accountCreated: string | null;
  userIndex?: number | null;
  totalEntries: number;
  region: string | null;
  isEditor: boolean;
}

// Define the initial state
interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Action type interface
interface UserAction {
  type: string;
  payload?: any;
}

// Initial state
const initialState: UserState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null
};

// Get initial state from localStorage if available
const getInitialState = (): UserState => {
  try {
    const savedState = localStorage.getItem('userState');
    return savedState ? JSON.parse(savedState) : initialState;
  } catch (error) {
    console.error('Error loading state from localStorage:', error);
    return initialState;
  }
};

// Action types
export const UserActionTypes = {
  LOGIN_REQUEST: 'LOGIN_REQUEST',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REGISTER_REQUEST: 'REGISTER_REQUEST',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer function
function userReducer(state: UserState, action: UserAction): UserState {
  switch (action.type) {
    case UserActionTypes.LOGIN_REQUEST:
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case UserActionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    case UserActionTypes.LOGIN_FAILURE:
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
    case UserActionTypes.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        error: null
      };
    case UserActionTypes.REGISTER_REQUEST:
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case UserActionTypes.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    case UserActionTypes.REGISTER_FAILURE:
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
    case UserActionTypes.UPDATE_USER:
      return {
        ...state,
        user: state.user ? {
          ...state.user,
          ...action.payload
        } : action.payload
      };
    case UserActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
}

// Create context with explicit types
type UserStateContextType = UserState;
type UserDispatchContextType = React.Dispatch<UserAction>;

// Create context objects with default values
const UserStateContext = createContext<UserStateContextType>(initialState);
const UserDispatchContext = createContext<UserDispatchContextType>(() => null);

// Provider component
export function UserProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(userReducer, getInitialState());

  // This effect ensures state is saved whenever it changes
  useEffect(() => {
    localStorage.setItem('userState', JSON.stringify(state));
  }, [state]);

  return (
    <UserStateContext.Provider value={state as UserStateContextType}>
      <UserDispatchContext.Provider value={dispatch}>
        {children}
      </UserDispatchContext.Provider>
    </UserStateContext.Provider>
  );
}

// Custom hooks to use state and dispatch
export function useUserState() {
  const context = useContext(UserStateContext);
  if (!context) {
    throw new Error('useUserState must be used within a UserProvider');
  }
  return context;
}

export function useUserDispatch() {
  const context = useContext(UserDispatchContext);
  if (!context) {
    throw new Error('useUserDispatch must be used within a UserProvider');
  }
  return context;
}

// Hook that provides both state and dispatch
export function useUser() {
  const state = useUserState();
  const dispatch = useUserDispatch();
  
  return { ...state, dispatch };
}
