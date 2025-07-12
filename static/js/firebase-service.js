// Firebase Service for Authentication and Chat Management
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signInWithPopup, 
    signOut,
    onAuthStateChanged,
    updateProfile
} from 'firebase/auth';
import { 
    collection, 
    addDoc, 
    query, 
    where, 
    orderBy, 
    onSnapshot, 
    deleteDoc,
    doc,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { auth, googleProvider, db } from '../../firebase-config.js';

class FirebaseService {
    constructor() {
        this.currentUser = null;
        this.unsubscribeAuth = null;
        this.unsubscribeChats = null;
        this.chatCleanupInterval = null;
        this.initAuthListener();
        this.startChatCleanup();
    }

    // Authentication Methods
    initAuthListener() {
        this.unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            this.currentUser = user;
            this.onAuthStateChange(user);
        });
    }

    async signUpWithEmail(email, password, displayName) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName });
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async signInWithEmail(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async signInWithGoogle() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return { success: true, user: result.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async signOut() {
        try {
            await signOut(auth);
            this.currentUser = null;
            if (this.unsubscribeChats) {
                this.unsubscribeChats();
                this.unsubscribeChats = null;
            }
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Chat Management Methods
    async saveMessage(message, isUser = true) {
        if (!this.currentUser) {
            throw new Error('User must be authenticated to save messages');
        }

        try {
            const chatData = {
                userId: this.currentUser.uid,
                message: message,
                isUser: isUser,
                timestamp: serverTimestamp(),
                expiresAt: Timestamp.fromDate(new Date(Date.now() + 6 * 60 * 60 * 1000)) // 6 hours from now
            };

            const docRef = await addDoc(collection(db, 'chats'), chatData);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error saving message:', error);
            return { success: false, error: error.message };
        }
    }

    loadUserChats(callback) {
        if (!this.currentUser) {
            callback([]);
            return null;
        }

        const q = query(
            collection(db, 'chats'),
            where('userId', '==', this.currentUser.uid),
            where('expiresAt', '>', Timestamp.now()),
            orderBy('expiresAt'),
            orderBy('timestamp', 'asc')
        );

        this.unsubscribeChats = onSnapshot(q, (querySnapshot) => {
            const chats = [];
            querySnapshot.forEach((doc) => {
                chats.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            callback(chats);
        });

        return this.unsubscribeChats;
    }

    // Cleanup expired chats every 30 minutes
    startChatCleanup() {
        this.chatCleanupInterval = setInterval(async () => {
            await this.cleanupExpiredChats();
        }, 30 * 60 * 1000); // 30 minutes
    }

    async cleanupExpiredChats() {
        try {
            const q = query(
                collection(db, 'chats'),
                where('expiresAt', '<=', Timestamp.now())
            );

            const querySnapshot = await getDocs(q);
            const deletePromises = [];

            querySnapshot.forEach((doc) => {
                deletePromises.push(deleteDoc(doc.ref));
            });

            await Promise.all(deletePromises);
            console.log(`Cleaned up ${deletePromises.length} expired chat messages`);
        } catch (error) {
            console.error('Error cleaning up expired chats:', error);
        }
    }

    // Event handler for auth state changes (to be overridden)
    onAuthStateChange(user) {
        // This will be overridden by the main application
        console.log('Auth state changed:', user ? 'Signed in' : 'Signed out');
    }

    // Cleanup method
    destroy() {
        if (this.unsubscribeAuth) {
            this.unsubscribeAuth();
        }
        if (this.unsubscribeChats) {
            this.unsubscribeChats();
        }
        if (this.chatCleanupInterval) {
            clearInterval(this.chatCleanupInterval);
        }
    }
}

// Create and export a singleton instance
const firebaseService = new FirebaseService();
export default firebaseService;
