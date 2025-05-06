"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  user_type: 'owner' | 'renter';
  phone?: string;
}

interface AuthContextType {
  user: any;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, userType: 'owner' | 'renter') => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch user profile data
  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      console.log('Fetched profile:', data);
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Initial session:', session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        console.log('Setting initial profile:', profile);
        setProfile(profile);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state changed:', _event, session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        console.log('Setting profile after auth change:', profile);
        setProfile(profile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, name: string, userType: 'owner' | 'renter') => {
    try {
      console.log('Signing up user:', { email, name, userType });
      // First, create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            user_type: userType
          }
        }
      });

      if (authError) {
        console.error('Auth error during signup:', authError);
        return { error: authError };
      }

      if (authData.user) {
        console.log('Auth user created:', authData.user);
        // Insert the user details into the users table
        const { error: profileError } = await supabase.from('users').insert({
          id: authData.user.id,
          email: authData.user.email!,
          name,
          user_type: userType,
        }).select().single();

        if (profileError) {
          console.error("Error creating user profile:", profileError);
          // If profile creation fails, we should clean up the auth user
          await supabase.auth.admin.deleteUser(authData.user.id);
          return { error: profileError };
        }

        console.log('User profile created successfully');
        return { error: null };
      }

      return { error: new Error("No user data returned from signup") };
    } catch (error) {
      console.error("Signup error:", error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Signing in user:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data.user) {
        console.log('Sign in successful:', data.user);
        const profile = await fetchProfile(data.user.id);
        console.log('Setting profile after sign in:', profile);
        setProfile(profile);
      }

      if (error) {
        console.error('Sign in error:', error);
      }

      return { error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    console.log('Signing out user');
    await supabase.auth.signOut();
    setProfile(null);
    router.push("/auth/login");
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
} 