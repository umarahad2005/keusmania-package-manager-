// Utility functions to verify Firestore connectivity at runtime.
// Usage: import { runFirestoreDiagnostic } from './FirestoreDiagnostics';
// runFirestoreDiagnostic().then(console.log).catch(console.error);
import { db } from './firebase';
import { collection, addDoc, getDoc, doc, serverTimestamp } from 'firebase/firestore';

export async function runFirestoreDiagnostic() {
  const start = Date.now();
  try {
    // Write a test doc
    const writeRef = await addDoc(collection(db, '__diagnostics'), {
      createdAt: serverTimestamp(),
      note: 'connectivity test',
      tsClient: new Date().toISOString()
    });
    // Read it back
    const snap = await getDoc(doc(db, '__diagnostics', writeRef.id));
    const readData = snap.exists() ? snap.data() : null;
    return {
      ok: true,
      message: 'Firestore write/read succeeded',
      id: writeRef.id,
      roundTripMs: Date.now() - start,
      readData
    };
  } catch (err) {
    return {
      ok: false,
      message: 'Firestore diagnostic failed',
      error: err.message,
      code: err.code || null
    };
  }
}

export default { runFirestoreDiagnostic };
