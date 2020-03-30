import { firebase, firestore } from './initialize';

const auth = firebase.auth();
const db = firestore;

async function findOrCreateUser(id, name) {
  const userRef = db.collection('users').doc(id.toString());
  const userSnap = await userRef.get();

  if (userSnap.exists) {
    return userSnap;
  }

  await userRef.set({ name: name }, { merge: true });
  return await userRef.get();
}

async function findTracker(userSnap) {
  if (userSnap.data().tracker) {
    const trackerRef = db.collection('trackers').doc(userSnap.data().tracker.toString());
    const trackerSnap = await trackerRef.get();

    if (trackerSnap.exist) {
      return trackerSnap;
    }
  }

  return false;
}

async function createTracker(userSnap, trackerName) {
  const trackerRef = db.collection('trackers').doc();
  await trackerRef.set({ name: trackerName });
  await userSnap.ref.set({ tracker: trackerRef }, { merge: true });

  return await trackerRef.get();
}

async function findOrCreateTracker(userSnap, trackerName) {
  return (await findTracker(userSnap))
      || (await createTracker(userSnap, trackerName));
}

async function run() {
  const result = await auth.signInAnonymously();
  const userSnap = await findOrCreateUser(99, 'Andrew');
  const trackerSnap = await findOrCreateTracker(userSnap, 'Andrews tracker');
  await findOrCreateTracker(userSnap, 'Andrews tracker');
  await findOrCreateTracker(userSnap, 'Andrews tracker');
  await findOrCreateTracker(userSnap, 'Andrews tracker');
  await findOrCreateTracker(userSnap, 'Andrews tracker');
  console.log({ user: userSnap.data(), tracker: trackerSnap.data() });
}

run();

///////////////////
// process.exit(1);
