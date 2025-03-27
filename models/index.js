// Définition des modèles de données pour l'application SmartContract

// Modèle utilisateur
export const UserModel = {
  id: '', // ID Firebase Auth
  email: '',
  displayName: '',
  photoURL: '',
  createdAt: new Date(),
  contacts: [], // Liste des IDs d'utilisateurs connectés
  pendingInvitations: [], // Invitations en attente
  isAdmin: false, // Indique si l'utilisateur est administrateur
};

// Modèle de contrat
export const ContractModel = {
  id: '',
  title: '',
  createdBy: '', // ID de l'utilisateur créateur
  participants: [], // Liste des IDs des participants
  isPublic: false, // Contrat public ou privé
  createdAt: new Date(),
  updatedAt: new Date(),
  status: 'pending', // pending, active, completed, cancelled
  conditions: [], // Liste des conditions (voir ConditionModel)
  counterparts: [], // Liste des contreparties (voir CounterpartModel)
};

// Modèle de condition
export const ConditionModel = {
  id: '',
  description: '',
  assignedTo: '', // ID de l'utilisateur assigné
  deadline: null, // Date limite (facultatif)
  status: 'pending', // pending, in-progress, completed
  completedAt: null, // Date de complétion
  verifiedBy: [], // IDs des utilisateurs ayant vérifié
};

// Modèle de contrepartie
export const CounterpartModel = {
  id: '',
  description: '',
  providedBy: '', // ID de l'utilisateur fournissant la contrepartie
  linkedConditions: [], // IDs des conditions liées
  status: 'pending', // pending, in-progress, completed
  completedAt: null, // Date de complétion
  verifiedBy: [], // IDs des utilisateurs ayant vérifié
};

// Modèle d'invitation
export const InvitationModel = {
  id: '',
  fromUser: '', // ID de l'expéditeur
  toUser: '', // ID du destinataire (peut être null si par email)
  toEmail: '', // Email du destinataire (si pas d'ID)
  status: 'pending', // pending, accepted, rejected
  createdAt: new Date(),
  respondedAt: null, // Date de réponse
}; 