import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { auth, db } from '../../firebase/config';
import { collection, query, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

interface User {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  createdAt: any;
}

interface Contract {
  id: string;
  title: string;
  status: string;
  createdAt: any;
}

export default function AdminScreen() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'contracts'>('users');

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        router.replace('/(auth)/login');
        return;
      }
      
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      
      if (!userDoc.exists() || !userDoc.data().isAdmin) {
        setIsAdmin(false);
        Alert.alert(
          "Accès refusé", 
          "Vous n'avez pas les droits d'administrateur pour accéder à cette page.",
          [{ text: "OK", onPress: () => router.replace('/(tabs)') }]
        );
        return;
      }
      
      setIsAdmin(true);
      loadUsers();
      loadContracts();
    } catch (error) {
      console.error('Erreur lors de la vérification des droits admin:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const usersQuery = query(collection(db, 'users'));
      const querySnapshot = await getDocs(usersQuery);
      
      const usersList: User[] = [];
      querySnapshot.forEach((doc) => {
        usersList.push({ 
          id: doc.id,
          ...doc.data()
        } as User);
      });
      
      setUsers(usersList);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    }
  };

  const loadContracts = async () => {
    try {
      const contractsQuery = query(collection(db, 'contracts'));
      const querySnapshot = await getDocs(contractsQuery);
      
      const contractsList: Contract[] = [];
      querySnapshot.forEach((doc) => {
        contractsList.push({ 
          id: doc.id,
          ...doc.data()
        } as Contract);
      });
      
      setContracts(contractsList);
    } catch (error) {
      console.error('Erreur lors du chargement des contrats:', error);
    }
  };

  const deleteContract = async (contractId: string) => {
    try {
      Alert.alert(
        "Supprimer le contrat",
        "Êtes-vous sûr de vouloir supprimer ce contrat ?",
        [
          { text: "Annuler", style: "cancel" },
          { 
            text: "Supprimer", 
            style: "destructive",
            onPress: async () => {
              await deleteDoc(doc(db, 'contracts', contractId));
              setContracts(contracts.filter(c => c.id !== contractId));
              Alert.alert("Succès", "Le contrat a été supprimé");
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erreur lors de la suppression du contrat:', error);
      Alert.alert("Erreur", "Impossible de supprimer le contrat");
    }
  };

  const viewUserDetails = (userId: string) => {
    Alert.alert("Détails", `ID: ${userId}`);
  };

  const viewContractDetails = (contractId: string) => {
    router.push(`/contract/${contractId}`);
  };

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity 
      style={styles.itemCard}
      onPress={() => viewUserDetails(item.id)}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <ThemedText style={styles.cardTitle}>{item.displayName}</ThemedText>
          {item.isAdmin && (
            <View style={styles.adminBadge}>
              <ThemedText style={styles.adminText}>Admin</ThemedText>
            </View>
          )}
        </View>
        <ThemedText style={styles.emailText}>{item.email}</ThemedText>
        <ThemedText style={styles.dateText}>
          Créé le {item.createdAt?.toDate().toLocaleDateString() || 'date inconnue'}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );

  const renderContract = ({ item }: { item: Contract }) => (
    <TouchableOpacity 
      style={styles.itemCard}
      onPress={() => viewContractDetails(item.id)}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <ThemedText style={styles.cardTitle}>{item.title}</ThemedText>
          <TouchableOpacity onPress={() => deleteContract(item.id)}>
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.statusBadge}>
            <ThemedText style={styles.statusText}>{item.status}</ThemedText>
          </View>
          <ThemedText style={styles.dateText}>
            Créé le {item.createdAt?.toDate().toLocaleDateString() || 'date inconnue'}
          </ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <ThemedText style={styles.loadingText}>Vérification des droits d'administration...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
          <ThemedText style={styles.errorText}>Accès refusé</ThemedText>
          <ThemedText style={styles.subText}>
            Vous n'avez pas les droits d'administrateur pour accéder à cette page.
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ThemedText style={styles.headerTitle}>Administration</ThemedText>
        
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'users' && styles.activeTabButton]}
            onPress={() => setActiveTab('users')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
              Utilisateurs
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'contracts' && styles.activeTabButton]}
            onPress={() => setActiveTab('contracts')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'contracts' && styles.activeTabText]}>
              Contrats
            </ThemedText>
          </TouchableOpacity>
        </View>
        
        {activeTab === 'users' ? (
          <FlatList
            data={users}
            renderItem={renderUser}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>Aucun utilisateur trouvé</ThemedText>
              </View>
            }
          />
        ) : (
          <FlatList
            data={contracts}
            renderItem={renderContract}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>Aucun contrat trouvé</ThemedText>
              </View>
            }
          />
        )}
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
    padding: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#FF3B30',
  },
  subText: {
    marginTop: 8,
    textAlign: 'center',
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTabButton: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  listContent: {
    paddingBottom: 20,
  },
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  adminBadge: {
    backgroundColor: '#007AFF',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  adminText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emailText: {
    color: '#666',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#888',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statusBadge: {
    backgroundColor: '#28a745',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
  },
}); 