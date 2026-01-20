
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  updateDoc, 
  doc, 
  query, 
  orderBy, 
  setDoc, 
  getDoc,
  increment,
  runTransaction
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Account, Invoice, Transaction, InvoiceStatus } from '../types';

/**
 * Ruthton Express Billing - Cloud Persistence Module
 * Project: ruthtonexpress-billing
 */
const firebaseConfig = {
  apiKey: "AIzaSy_CLOUD_KEY_PLACEHOLDER", 
  authDomain: "ruthtonexpress-billing.firebaseapp.com",
  projectId: "ruthtonexpress-billing",
  storageBucket: "ruthtonexpress-billing.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export const ApiService = {
  lastError: '',

  /**
   * Verified connectivity with the Firebase Cloud Network
   */
  async checkHealth(): Promise<{ status: string; database: string; error?: string; url?: string }> {
    try {
      const docRef = doc(db, "settings", "global");
      await getDoc(docRef);
      return {
        status: 'online',
        database: 'Firebase Cloud Firestore',
        url: 'firestore.googleapis.com'
      };
    } catch (err: any) {
      return {
        status: 'offline',
        database: 'Disconnected',
        error: err.message,
        url: 'firestore.googleapis.com'
      };
    }
  },

  async getAccounts(): Promise<Account[]> {
    try {
      const querySnapshot = await getDocs(collection(db, "accounts"));
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as Account));
    } catch (err) {
      console.error("Firestore getAccounts failed:", err);
      return [];
    }
  },

  async saveAccount(account: Account): Promise<void> {
    await setDoc(doc(db, "accounts", account.id), account);
  },

  async getInvoices(): Promise<Invoice[]> {
    try {
      const q = query(collection(db, "invoices"), orderBy("date", "desc"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as Invoice));
    } catch (err) {
      console.error("Firestore getInvoices failed:", err);
      return [];
    }
  },

  async saveInvoice(invoice: Invoice): Promise<void> {
    await runTransaction(db, async (transaction) => {
      const invoiceRef = doc(db, "invoices", invoice.id);
      const accountRef = doc(db, "accounts", invoice.accountId);
      
      transaction.set(invoiceRef, invoice);
      transaction.update(accountRef, {
        currentBalance: increment(invoice.amount)
      });
    });
  },

  async updateInvoiceStatus(invoiceId: string, status: InvoiceStatus): Promise<void> {
    await runTransaction(db, async (transaction) => {
      const invoiceRef = doc(db, "invoices", invoiceId);
      const invoiceSnap = await transaction.get(invoiceRef);
      
      if (!invoiceSnap.exists()) throw new Error("Invoice not found in cloud ledger");
      
      const invData = invoiceSnap.data() as Invoice;
      
      // Credit balance adjustment for payments
      if (invData.status !== InvoiceStatus.PAID && status === InvoiceStatus.PAID) {
        const accountRef = doc(db, "accounts", invData.accountId);
        transaction.update(accountRef, {
          currentBalance: increment(-invData.amount)
        });
      }
      
      transaction.update(invoiceRef, { status });
    });
  },

  async markInvoiceEmailSent(invoiceId: string): Promise<void> {
    const invoiceRef = doc(db, "invoices", invoiceId);
    await updateDoc(invoiceRef, { emailSent: true });
  },

  async saveTransaction(txn: Transaction): Promise<void> {
    await runTransaction(db, async (transaction) => {
      const txnRef = doc(collection(db, "transactions"));
      const accountRef = doc(db, "accounts", txn.accountId);
      
      transaction.set(txnRef, txn);
      transaction.update(accountRef, {
        currentBalance: increment(txn.amount)
      });
    });
  },

  async getSettings(): Promise<any> {
    const docRef = doc(db, "settings", "global");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return docSnap.data();
    
    return {
      station_name: 'Ruthton Express',
      station_id: 'RE-XPRS',
      support_email: 'billing@ruthtonexpress.com',
      tax_rate: 7.25
    };
  },

  async updateSettings(settings: any): Promise<void> {
    await setDoc(doc(db, "settings", "global"), settings);
  }
};
