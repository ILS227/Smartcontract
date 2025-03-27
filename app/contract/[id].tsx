import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Alert, View, ScrollView, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { auth, db } from '@/firebase/config';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Condition {
  id: string;
  description: string;
  assignedTo: string;
  status: 'pending' | 'in-progress' | 'completed';
  completedAt: Date | null;
  verifiedBy: string[];
}

interface Counterpart {
  id: string;
  description: string;
  providedBy: string;
  linkedConditions: string[];
  status: 'pending' | 'in-progress' | 'completed';
  completedAt: Date | null;
  verifiedBy: string[];
}

interface Contract {
  id: string;
  title: string;
  createdBy: string;
  participants: string[];
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  createdAt: any;
  updatedAt: any;
  conditions: Condition[];
  counterparts: Counterpart[];
}

interface User {
  id: string;
  displayName: string;
  email: string;
}

export default function ContractDetailScreen() {
  const { id } = useLocalSearchParams();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }
    
    setCurrentUser(user.uid);
    loadContract();
  }, [id]);

  const loadContract = async () => {
    try {
      setLoading(true);
      
      if (!id) {
        Alert.alert('Erreur', 'Identifiant de contrat invalide');
        router.back();
        return;
      }
      
      // Charger les détails du contrat
      const contractRef = doc(db, 'contracts', id as string);
      const contractDoc = await getDoc(contractRef);
      
      if (!contractDoc.exists()) {
        Alert.alert('Erreur', 'Ce contrat n\'existe pas');
        router.back();
        return;
      }
      
      const contractData = {
        id: contractDoc.id,
        ...contractDoc.data()
      } as Contract;
      
      setContract(contractData);
      
      // Charger les informations des utilisateurs
      const userIds = [
        contractData.createdBy,
        ...contractData.participants,
        ...contractData.conditions.map(c => c.assignedTo),
        ...contractData.counterparts.map(c => c.providedBy),
      ];
      
      // Éliminer les doublons
      const uniqueUserIds = [...new Set(userIds)];
      
      const usersData: Record<string, User> = {};
      
      // Récupérer les données utilisateur
      for (const userId of uniqueUserIds) {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          usersData[userId] = {
            id: userId,
            displayName: userDoc.data().displayName || 'Utilisateur',
            email: userDoc.data().email || '',
          };
        }
      }
      
      setUsers(usersData);
    } catch (error) {
      console.error('Erreur lors du chargement du contrat:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails du contrat');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: 'pending' | 'active' | 'completed' | 'cancelled' | 'in-progress'): string => {
    switch (status) {
      case 'pending': return '#ffc107';  // jaune
      case 'active': return '#28a745';   // vert
      case 'in-progress': return '#28a745'; // vert
      case 'completed': return '#17a2b8'; // bleu
      case 'cancelled': return '#dc3545'; // rouge
      default: return '#6c757d';         // gris
    }
  };
  
  const getStatusLabel = (status: 'pending' | 'active' | 'completed' | 'cancelled' | 'in-progress'): string => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'active': return 'En cours';
      case 'in-progress': return 'En cours';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      default: return 'Inconnu';
    }
  };

  const activateContract = async () => {
    if (!contract) return;
    
    try {
      await updateDoc(doc(db, 'contracts', contract.id), {
        status: 'active',
      });
      
      // Mettre à jour l'état local
      setContract({
        ...contract,
        status: 'active',
      });
      
      Alert.alert('Succès', 'Le contrat est maintenant actif');
    } catch (error) {
      console.error('Erreur lors de l\'activation du contrat:', error);
      Alert.alert('Erreur', 'Impossible d\'activer le contrat');
    }
  };

  const markConditionAsCompleted = async (conditionId: string) => {
    if (!contract || !currentUser) return;
    
    try {
      const conditionIndex = contract.conditions.findIndex(c => c.id === conditionId);
      if (conditionIndex === -1) return;
      
      const condition = contract.conditions[conditionIndex];
      
      // Si l'utilisateur actuel n'est pas assigné à cette condition et n'est pas le créateur
      if (condition.assignedTo !== currentUser && contract.createdBy !== currentUser) {
        Alert.alert('Non autorisé', 'Vous ne pouvez pas marquer cette condition comme terminée');
        return;
      }
      
      // Mettre à jour le statut de la condition
      await updateDoc(doc(db, 'contracts', contract.id), {
        [`conditions.${conditionIndex}.status`]: 'completed',
        [`conditions.${conditionIndex}.completedAt`]: new Date(),
        [`conditions.${conditionIndex}.verifiedBy`]: arrayUnion(currentUser),
      });
      
      // Mettre à jour l'état local
      const updatedConditions = [...contract.conditions];
      updatedConditions[conditionIndex] = {
        ...condition,
        status: 'completed',
        completedAt: new Date(),
        verifiedBy: [...(condition.verifiedBy || []), currentUser],
      };
      
      setContract({
        ...contract,
        conditions: updatedConditions,
      });
      
      // Vérifier si toutes les conditions sont terminées
      const allCompleted = updatedConditions.every(c => c.status === 'completed');
      if (allCompleted) {
        updateContractStatus();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la condition:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour la condition');
    }
  };

  const markCounterpartAsCompleted = async (counterpartId: string) => {
    if (!contract || !currentUser) return;
    
    try {
      const counterpartIndex = contract.counterparts.findIndex(c => c.id === counterpartId);
      if (counterpartIndex === -1) return;
      
      const counterpart = contract.counterparts[counterpartIndex];
      
      // Si l'utilisateur actuel n'est pas le fournisseur de cette contrepartie et n'est pas le créateur
      if (counterpart.providedBy !== currentUser && contract.createdBy !== currentUser) {
        Alert.alert('Non autorisé', 'Vous ne pouvez pas marquer cette contrepartie comme terminée');
        return;
      }
      
      // Mettre à jour le statut de la contrepartie
      await updateDoc(doc(db, 'contracts', contract.id), {
        [`counterparts.${counterpartIndex}.status`]: 'completed',
        [`counterparts.${counterpartIndex}.completedAt`]: new Date(),
        [`counterparts.${counterpartIndex}.verifiedBy`]: arrayUnion(currentUser),
      });
      
      // Mettre à jour l'état local
      const updatedCounterparts = [...contract.counterparts];
      updatedCounterparts[counterpartIndex] = {
        ...counterpart,
        status: 'completed',
        completedAt: new Date(),
        verifiedBy: [...(counterpart.verifiedBy || []), currentUser],
      };
      
      setContract({
        ...contract,
        counterparts: updatedCounterparts,
      });
      
      // Vérifier si toutes les contreparties sont terminées
      const allCompleted = updatedCounterparts.every(c => c.status === 'completed');
      if (allCompleted) {
        updateContractStatus();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la contrepartie:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour la contrepartie');
    }
  };

  const updateContractStatus = async () => {
    if (!contract) return;
    
    // Vérifier si toutes les conditions et contreparties sont terminées
    const allConditionsCompleted = contract.conditions.every(c => c.status === 'completed');
    const allCounterpartsCompleted = contract.counterparts.every(c => c.status === 'completed');
    
    if (allConditionsCompleted && allCounterpartsCompleted) {
      try {
        await updateDoc(doc(db, 'contracts', contract.id), {
          status: 'completed',
        });
        
        // Mettre à jour l'état local
        setContract({
          ...contract,
          status: 'completed',
        });
        
        Alert.alert('Félicitations', 'Toutes les parties du contrat sont terminées !');
      } catch (error) {
        console.error('Erreur lors de la mise à jour du statut du contrat:', error);
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <ThemedText style={styles.loadingText}>Chargement du contrat...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (!contract) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#dc3545" />
          <ThemedText style={styles.errorText}>Contrat introuvable</ThemedText>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ThemedText style={styles.backButtonText}>Retour</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen 
        options={{
          title: 'Détails du contrat',
          headerBackTitle: 'Retour',
        }} 
      />
      
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.container}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>{contract.title}</ThemedText>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(contract.status) }]}>
              <ThemedText style={styles.statusText}>{getStatusLabel(contract.status)}</ThemedText>
            </View>
          </View>
          
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Créé par:</ThemedText>
              <ThemedText style={styles.infoValue}>
                {users[contract.createdBy]?.displayName || 'Utilisateur inconnu'}
              </ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Date de création:</ThemedText>
              <ThemedText style={styles.infoValue}>
                {contract.createdAt?.toDate().toLocaleDateString() || 'Inconnue'}
              </ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Dernière mise à jour:</ThemedText>
              <ThemedText style={styles.infoValue}>
                {contract.updatedAt?.toDate().toLocaleDateString() || 'Inconnue'}
              </ThemedText>
            </View>
          </View>
          
          {contract.status === 'pending' && currentUser === contract.createdBy && (
            <TouchableOpacity
              style={styles.activateButton}
              onPress={activateContract}
            >
              <ThemedText style={styles.activateButtonText}>Activer le contrat</ThemedText>
            </TouchableOpacity>
          )}
          
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Participants</ThemedText>
            {contract.participants.map((participantId) => (
              <View key={participantId} style={styles.participantItem}>
                <View style={styles.userAvatar}>
                  <ThemedText style={styles.userInitial}>
                    {(users[participantId]?.displayName?.charAt(0) || '?').toUpperCase()}
                  </ThemedText>
                </View>
                <View>
                  <ThemedText style={styles.userName}>
                    {users[participantId]?.displayName || 'Utilisateur inconnu'}
                  </ThemedText>
                  <ThemedText style={styles.userEmail}>
                    {users[participantId]?.email || ''}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
          
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Conditions</ThemedText>
            {contract.conditions.map((condition) => (
              <View key={condition.id} style={styles.conditionItem}>
                <View style={styles.conditionHeader}>
                  <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(condition.status) }]} />
                  <ThemedText style={styles.conditionDescription}>
                    {condition.description}
                  </ThemedText>
                </View>
                
                <View style={styles.conditionInfo}>
                  <ThemedText style={styles.assignedToText}>
                    Assigné à: {users[condition.assignedTo]?.displayName || 'Utilisateur inconnu'}
                  </ThemedText>
                  <ThemedText style={styles.statusText}>
                    {getStatusLabel(condition.status)}
                  </ThemedText>
                </View>
                
                {condition.status !== 'completed' && contract.status === 'active' && (
                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={() => markConditionAsCompleted(condition.id)}
                  >
                    <ThemedText style={styles.completeButtonText}>
                      Marquer comme terminé
                    </ThemedText>
                  </TouchableOpacity>
                )}
                
                {condition.status === 'completed' && (
                  <View style={styles.completedInfo}>
                    <Ionicons name="checkmark-circle" size={16} color="#28a745" />
                    <ThemedText style={styles.completedText}>
                      Terminé le {condition.completedAt?.toLocaleDateString() || 'date inconnue'}
                    </ThemedText>
                  </View>
                )}
              </View>
            ))}
          </View>
          
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Contreparties</ThemedText>
            {contract.counterparts.map((counterpart) => (
              <View key={counterpart.id} style={styles.conditionItem}>
                <View style={styles.conditionHeader}>
                  <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(counterpart.status) }]} />
                  <ThemedText style={styles.conditionDescription}>
                    {counterpart.description}
                  </ThemedText>
                </View>
                
                <View style={styles.conditionInfo}>
                  <ThemedText style={styles.assignedToText}>
                    Fourni par: {users[counterpart.providedBy]?.displayName || 'Utilisateur inconnu'}
                  </ThemedText>
                  <ThemedText style={styles.statusText}>
                    {getStatusLabel(counterpart.status)}
                  </ThemedText>
                </View>
                
                {counterpart.status !== 'completed' && contract.status === 'active' && (
                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={() => markCounterpartAsCompleted(counterpart.id)}
                  >
                    <ThemedText style={styles.completeButtonText}>
                      Marquer comme terminé
                    </ThemedText>
                  </TouchableOpacity>
                )}
                
                {counterpart.status === 'completed' && (
                  <View style={styles.completedInfo}>
                    <Ionicons name="checkmark-circle" size={16} color="#28a745" />
                    <ThemedText style={styles.completedText}>
                      Terminé le {counterpart.completedAt?.toLocaleDateString() || 'date inconnue'}
                    </ThemedText>
                  </View>
                )}
              </View>
            ))}
          </View>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoSection: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontWeight: 'bold',
    width: 120,
  },
  infoValue: {
    flex: 1,
  },
  activateButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  activateButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInitial: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  conditionItem: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  conditionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 8,
    marginRight: 8,
  },
  conditionDescription: {
    flex: 1,
    fontSize: 16,
  },
  conditionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  assignedToText: {
    fontSize: 14,
    color: '#666',
  },
  completeButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  completeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  completedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedText: {
    fontSize: 14,
    color: '#28a745',
    marginLeft: 8,
  },
}); 