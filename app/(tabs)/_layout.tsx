import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useEffect, useState } from 'react';
import { auth, db } from '@/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

export default function TabLayout() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        return;
      }
      
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      
      if (userDoc.exists() && userDoc.data().isAdmin) {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des droits admin:', error);
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarStyle: {
          backgroundColor: '#fff',
          elevation: 0,
          borderTopWidth: 0,
          boxShadow: 'none',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Contrats',
          headerTitle: 'Mes Contrats',
          tabBarIcon: ({ color, size }) => (
            <IconSymbol
              name="doc.text"
              size={Platform.OS === 'android' ? size * 0.8 : size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          headerTitle: 'Mon Profil',
          tabBarIcon: ({ color, size }) => (
            <IconSymbol
              name="person"
              size={Platform.OS === 'android' ? size * 0.8 : size}
              color={color}
            />
          ),
        }}
      />
      {isAdmin && (
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Admin',
            headerTitle: 'Administration',
            tabBarIcon: ({ color, size }) => (
              <IconSymbol
                name="shield"
                size={Platform.OS === 'android' ? size * 0.8 : size}
                color={color}
              />
            ),
          }}
        />
      )}
    </Tabs>
  );
}
