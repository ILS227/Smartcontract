import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, TextInput, Alert, View, ScrollView, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { auth, db } from '@/firebase/config';
import { collection, addDoc, doc, getDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ContractModel } from '@/models';

interface User {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
}

export default function NewContractScreen() {
  const [title, setTitle] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [conditions, setConditions] = useState<{id: string, description: string, assignedTo: string}[]>([]);
  const [counterparts, setCounterparts] = useState<{id: string, description: string, providedBy: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }

    const fetchUserData = async () => {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setCurrentUser({
          id: user.uid,
          displayName: userDoc.data().displayName || user.displayName || '',
          email: userDoc.data().email || user.email || '',
          photoURL: userDoc.data().photoURL || user.photoURL || '',
        });
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (searchUser.length > 2) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchUser]);

  const searchUsers = async () => {
    try {
      setSearchLoading(true);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '>=', searchUser), where('email', '<=', searchUser + '\uf8ff'));
      const querySnapshot = await getDocs(q);
      
      const results: User[] = [];
      querySnapshot.forEach((doc) => {
        // Ne pas inclure l'utilisateur actuel dans les résultats
        if (doc.id !== auth.currentUser?.uid) {
          results.push({
            id: doc.id,
            displayName: doc.data().displayName || '',
            email: doc.data().email || '',
            photoURL: doc.data().photoURL || '',
          });
        }
      });
      
      setSearchResults(results);
    } catch (error) {
      console.error('Erreur lors de la recherche d\'utilisateurs:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const selectUser = (user: User) => {
    setSelectedUser(user);
    setSearchUser('');
    setSearchResults([]);
  };

  const addCondition = () => {
    setConditions([
      ...conditions, 
      { 
        id: Date.now().toString(), 
        description: '', 
        assignedTo: selectedUser?.id || ''
      }
    ]);
  };

  const addCounterpart = () => {
    setCounterparts([
      ...counterparts, 
      { 
        id: Date.now().toString(), 
        description: '', 
        providedBy: auth.currentUser?.uid || ''
      }
    ]);
  };

  const updateCondition = (id: string, description: string) => {
    setConditions(conditions.map(c => 
      c.id === id ? { ...c, description } : c
    ));
  };

  const updateCounterpart = (id: string, description: string) => {
    setCounterparts(counterparts.map(c => 
      c.id === id ? { ...c, description } : c
    ));
  };

  const removeCondition = (id: string) => {
    setConditions(conditions.filter(c => c.id !== id));
  };

  const removeCounterpart = (id: string) => {
    setCounterparts(counterparts.filter(c => c.id !== id));
  };

  const createContract = async () => {
    if (!title) {
      Alert.alert('Erreur', 'Veuillez donner un titre au contrat');
      return;
    }

    if (!selectedUser) {
      Alert.alert('Erreur', 'Veuillez sélectionner un utilisateur');
      return;
    }

    if (conditions.length === 0 || counterparts.length === 0) {
      Alert.alert('Erreur', 'Ajoutez au moins une condition et une contrepartie');
      return;
    }

    // Vérifier que toutes les conditions et contreparties ont une description
    const emptyCondition = conditions.find(c => !c.description);
    if (emptyCondition) {
      Alert.alert('Erreur', 'Veuillez remplir toutes les descriptions des conditions');
      return;
    }

    const emptyCounterpart = counterparts.find(c => !c.description);
    if (emptyCounterpart) {
      Alert.alert('Erreur', 'Veuillez remplir toutes les descriptions des contreparties');
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }

      const contractData = {
        ...ContractModel,
        title,
        createdBy: user.uid,
        participants: [user.uid, selectedUser.id],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'pending',
        conditions: conditions.map(c => ({
          id: c.id,
          description: c.description,
          assignedTo: c.assignedTo,
          status: 'pending',
        })),
        counterparts: counterparts.map(c => ({
          id: c.id,
          description: c.description,
          providedBy: c.providedBy,
          status: 'pending',
        })),
      };

      const docRef = await addDoc(collection(db, 'contracts'), contractData);
      
      Alert.alert('Succès', 'Contrat créé avec succès', [
        { 
          text: 'OK', 
          onPress: () => router.push(`/contract/${docRef.id}`) 
        }
      ]);
    } catch (error) {
      console.error('Erreur lors de la création du contrat:', error);
      Alert.alert('Erreur', 'Impossible de créer le contrat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen 
        options={{
          title: 'Nouveau contrat',
          headerBackTitle: 'Retour',
        }} 
      />
      
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.container}>
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Détails du contrat</ThemedText>
            
            <TextInput
              style={styles.input}
              placeholder="Titre du contrat"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Avec qui ?</ThemedText>
            
            {selectedUser ? (
              <View style={styles.selectedUserContainer}>
                <View style={styles.userInfo}>
                  <View style={styles.userAvatar}>
                    <ThemedText style={styles.userInitial}>
                      {selectedUser.displayName.charAt(0).toUpperCase()}
                    </ThemedText>
                  </View>
                  <View>
                    <ThemedText style={styles.userName}>{selectedUser.displayName}</ThemedText>
                    <ThemedText style={styles.userEmail}>{selectedUser.email}</ThemedText>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => setSelectedUser(null)}
                >
                  <Ionicons name="close-circle" size={24} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <TextInput
                  style={styles.input}
                  placeholder="Rechercher par email"
                  value={searchUser}
                  onChangeText={setSearchUser}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                
                {searchLoading && (
                  <ActivityIndicator style={styles.searchLoading} color="#007AFF" />
                )}
                
                {searchResults.length > 0 && (
                  <View style={styles.searchResults}>
                    {searchResults.map(user => (
                      <TouchableOpacity
                        key={user.id}
                        style={styles.userResult}
                        onPress={() => selectUser(user)}
                      >
                        <View style={styles.userAvatar}>
                          <ThemedText style={styles.userInitial}>
                            {user.displayName.charAt(0).toUpperCase()}
                          </ThemedText>
                        </View>
                        <View>
                          <ThemedText style={styles.userName}>{user.displayName}</ThemedText>
                          <ThemedText style={styles.userEmail}>{user.email}</ThemedText>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Conditions</ThemedText>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={addCondition}
              >
                <Ionicons name="add" size={20} color="white" />
              </TouchableOpacity>
            </View>

            {conditions.length === 0 ? (
              <ThemedText style={styles.emptyText}>
                Ajoutez des conditions que {selectedUser?.displayName || "l'autre utilisateur"} devra remplir
              </ThemedText>
            ) : (
              conditions.map((condition, index) => (
                <View key={condition.id} style={styles.conditionContainer}>
                  <View style={styles.conditionHeader}>
                    <ThemedText style={styles.conditionTitle}>Condition {index + 1}</ThemedText>
                    <TouchableOpacity onPress={() => removeCondition(condition.id)}>
                      <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={styles.conditionInput}
                    placeholder="Description de la condition"
                    value={condition.description}
                    onChangeText={(text) => updateCondition(condition.id, text)}
                    multiline
                  />
                </View>
              ))
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Contreparties</ThemedText>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={addCounterpart}
              >
                <Ionicons name="add" size={20} color="white" />
              </TouchableOpacity>
            </View>

            {counterparts.length === 0 ? (
              <ThemedText style={styles.emptyText}>
                Ajoutez des contreparties que vous fournirez
              </ThemedText>
            ) : (
              counterparts.map((counterpart, index) => (
                <View key={counterpart.id} style={styles.conditionContainer}>
                  <View style={styles.conditionHeader}>
                    <ThemedText style={styles.conditionTitle}>Contrepartie {index + 1}</ThemedText>
                    <TouchableOpacity onPress={() => removeCounterpart(counterpart.id)}>
                      <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={styles.conditionInput}
                    placeholder="Description de la contrepartie"
                    value={counterpart.description}
                    onChangeText={(text) => updateCounterpart(counterpart.id, text)}
                    multiline
                  />
                </View>
              ))
            )}
          </View>

          <TouchableOpacity
            style={[styles.createButton, loading && styles.buttonDisabled]}
            onPress={createContract}
            disabled={loading}
          >
            <ThemedText style={styles.createButtonText}>
              {loading ? 'Création...' : 'Créer le contrat'}
            </ThemedText>
          </TouchableOpacity>
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  selectedUserContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
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
  removeButton: {
    padding: 4,
  },
  searchLoading: {
    marginTop: 10,
  },
  searchResults: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    maxHeight: 200,
  },
  userResult: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  conditionContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  conditionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  conditionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  conditionInput: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 60,
  },
  createButton: {
    backgroundColor: '#007AFF',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 