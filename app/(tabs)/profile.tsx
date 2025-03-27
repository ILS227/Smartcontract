import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView, Image, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '@/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState<'user' | 'contracts'>('user');
  const [userData, setUserData] = useState<any>({ displayName: '', email: '', photoURL: null });
  const [loading, setLoading] = useState(true);

  // Charger les données utilisateur au chargement
  useEffect(() => {
    loadUserData();
  }, []);

  // Fonction pour récupérer les données de l'utilisateur
  const loadUserData = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        router.replace('/(auth)/login');
        return;
      }
      
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      
      if (userDoc.exists()) {
        setUserData({
          displayName: userDoc.data().displayName || currentUser.displayName || 'Utilisateur',
          email: currentUser.email,
          photoURL: userDoc.data().photoURL || currentUser.photoURL,
          // Autres données utilisateur
        });
      } else {
        setUserData({
          displayName: currentUser.displayName || 'Utilisateur',
          email: currentUser.email,
          photoURL: currentUser.photoURL,
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données utilisateur:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour se déconnecter
  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  // Fonction pour les écrans non implémentés
  const handleNotImplemented = (feature: string) => {
    Alert.alert('Fonctionnalité à venir', `La fonctionnalité "${feature}" sera disponible prochainement.`);
  };

  // Rendu de l'espace utilisateur
  const renderUserSpace = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Informations personnelles</ThemedText>
        <TouchableOpacity 
          style={styles.profileCard} 
          onPress={() => handleNotImplemented('Modification du profil')}
        >
          <View style={styles.profileHeader}>
            {userData.photoURL ? (
              <Image source={{ uri: userData.photoURL }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={40} color="#999" />
              </View>
            )}
            <View style={styles.profileInfo}>
              <ThemedText style={styles.profileName}>{userData.displayName}</ThemedText>
              <ThemedText style={styles.profileEmail}>{userData.email}</ThemedText>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Apparence</ThemedText>
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => handleNotImplemented('Thème de l\'application')}
        >
          <Ionicons name="color-palette-outline" size={24} color="#007AFF" />
          <ThemedText style={styles.menuItemText}>Thème de l'application</ThemedText>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Compte</ThemedText>
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => handleNotImplemented('Paramètres de sécurité')}
        >
          <Ionicons name="shield-checkmark-outline" size={24} color="#007AFF" />
          <ThemedText style={styles.menuItemText}>Sécurité</ThemedText>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.menuItem, styles.logoutButton]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
          <ThemedText style={[styles.menuItemText, styles.logoutText]}>Déconnexion</ThemedText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // Rendu de l'espace contrats
  const renderContractsSpace = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Gestion des contrats</ThemedText>
        
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => router.push('/new-contract')}
        >
          <View style={styles.contractIcon}>
            <Ionicons name="add-circle" size={24} color="#fff" />
          </View>
          <ThemedText style={styles.menuItemText}>Créer un nouveau contrat</ThemedText>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => router.push('/(tabs)')}
        >
          <View style={[styles.contractIcon, { backgroundColor: '#28a745' }]}>
            <Ionicons name="list" size={24} color="#fff" />
          </View>
          <ThemedText style={styles.menuItemText}>Mes contrats en cours</ThemedText>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Historique</ThemedText>
        
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => handleNotImplemented('Contrats terminés')}
        >
          <View style={[styles.contractIcon, { backgroundColor: '#17a2b8' }]}>
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
          </View>
          <ThemedText style={styles.menuItemText}>Contrats terminés</ThemedText>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => handleNotImplemented('Contrats annulés')}
        >
          <View style={[styles.contractIcon, { backgroundColor: '#dc3545' }]}>
            <Ionicons name="close-circle" size={24} color="#fff" />
          </View>
          <ThemedText style={styles.menuItemText}>Contrats annulés</ThemedText>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Tabs pour basculer entre les espaces */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'user' && styles.activeTab]}
            onPress={() => setActiveTab('user')}
          >
            <Ionicons 
              name={activeTab === 'user' ? 'person' : 'person-outline'} 
              size={20} 
              color={activeTab === 'user' ? '#007AFF' : '#999'} 
            />
            <ThemedText style={[styles.tabText, activeTab === 'user' && styles.activeTabText]}>
              Espace Utilisateur
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'contracts' && styles.activeTab]}
            onPress={() => setActiveTab('contracts')}
          >
            <Ionicons 
              name={activeTab === 'contracts' ? 'document-text' : 'document-text-outline'} 
              size={20} 
              color={activeTab === 'contracts' ? '#007AFF' : '#999'} 
            />
            <ThemedText style={[styles.tabText, activeTab === 'contracts' && styles.activeTabText]}>
              Espace Contrat
            </ThemedText>
          </TouchableOpacity>
        </View>
        
        {/* Contenu de l'onglet actif */}
        {activeTab === 'user' ? renderUserSpace() : renderContractsSpace()}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#999',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
  },
  section: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  profileImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
  },
  menuItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItemText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
  },
  logoutButton: {
    marginTop: 8,
  },
  logoutText: {
    color: '#FF3B30',
  },
  contractIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 