import { StyleSheet, FlatList, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useState, useEffect } from 'react';
import { auth, db } from '@/firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ContractModel } from '@/models';

// Définir l'interface pour un contrat
interface Contract {
  id: string;
  title: string;
  participants: string[];
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  updatedAt: {
    toDate: () => Date;
  };
}

export default function ContractsScreen() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadContracts();
  }, []);
  
  const loadContracts = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        setTimeout(() => {
          router.replace('/(auth)/login');
        }, 100);
        return;
      }
      
      const contractsQuery = query(
        collection(db, 'contracts'),
        where('participants', 'array-contains', currentUser.uid),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(contractsQuery);
      const contractsList: Contract[] = [];
      
      querySnapshot.forEach((doc) => {
        contractsList.push({ id: doc.id, ...doc.data() } as Contract);
      });
      
      setContracts(contractsList);
    } catch (error) {
      console.error('Erreur lors du chargement des contrats:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusColor = (status: 'pending' | 'active' | 'completed' | 'cancelled'): string => {
    switch (status) {
      case 'pending': return '#ffc107';  // jaune
      case 'active': return '#28a745';   // vert
      case 'completed': return '#17a2b8'; // bleu
      case 'cancelled': return '#dc3545'; // rouge
      default: return '#6c757d';         // gris
    }
  };
  
  const getStatusLabel = (status: 'pending' | 'active' | 'completed' | 'cancelled'): string => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'active': return 'En cours';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      default: return 'Inconnu';
    }
  };
  
  const renderContract = ({ item }: { item: Contract }) => (
    <TouchableOpacity 
      style={styles.contractCard}
      onPress={() => router.push(`/contract/${item.id}`)}
    >
      <View style={styles.contractHeader}>
        <ThemedText style={styles.contractTitle}>{item.title}</ThemedText>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <ThemedText style={styles.statusText}>{getStatusLabel(item.status)}</ThemedText>
        </View>
      </View>
      
      <View style={styles.contractDetails}>
        <Ionicons name="people-outline" size={16} color="#666" />
        <ThemedText style={styles.participantsText}>
          {item.participants.length} participants
        </ThemedText>
      </View>
      
      <View style={styles.contractFooter}>
        <ThemedText style={styles.dateText}>
          Mis à jour le {item.updatedAt.toDate().toLocaleDateString()}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Mes Contrats</ThemedText>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/new-contract')}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ThemedText>Chargement des contrats...</ThemedText>
          </View>
        ) : contracts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <ThemedText style={styles.emptyText}>Aucun contrat à afficher</ThemedText>
            <ThemedText style={styles.emptySubText}>
              Créez votre premier contrat en appuyant sur le bouton +
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={contracts}
            renderItem={renderContract}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.contractsList}
            showsVerticalScrollIndicator={false}
            refreshing={loading}
            onRefresh={loadContracts}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubText: {
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.7,
  },
  contractsList: {
    paddingBottom: 20,
  },
  contractCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contractHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  contractTitle: {
    fontSize: 18,
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
  contractDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  participantsText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  contractFooter: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#888',
  },
});
