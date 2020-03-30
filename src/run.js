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

    if (trackerSnap.exists) {
      return trackerSnap;
    }
  }

  return false;
}

async function createTracker(userSnap, trackerName) {
  const trackerRef = db.collection('trackers').doc();
  await trackerRef.set({ name: trackerName, entries: [] });
  await userSnap.ref.set({ tracker: trackerRef }, { merge: true });

  return await trackerRef.get();
}

async function findOrCreateTracker(userSnap, trackerName) {
  return (await findTracker(userSnap))
      || (await createTracker(userSnap, trackerName));
}

async function findEntries(trackerSnap) {
  const entriesRefs = trackerSnap.data().entries;
  const entriesSnaps = await Promise.all(entriesRefs.map(e => e.get()));

  return entriesSnaps.filter(e => e.exists);
}

async function fetchState(uid) {
  const result = await auth.signInAnonymously();
  const userSnap = await findOrCreateUser(uid, 'Andrew');
  const trackerSnap = await findOrCreateTracker(userSnap, 'Andrews tracker');
  const entriesSnaps = await findEntries(trackerSnap);

  return {
    data: {
      user: userSnap.data(),
      tracker: trackerSnap.data(),
      entries: entriesSnaps.map(e => e.data())
    },
    snaps: {
      user: userSnap,
      tracker: trackerSnap,
      entries: entriesSnaps
    }
  }
}

async function run() {
  const { data: state } = await fetchState(123);
  console.log('state', state);
}

run();

///////////////////
// process.exit(1);
