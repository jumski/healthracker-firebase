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
    const trackerRef = userSnap.data().tracker;
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

async function fetchEntries(trackerSnap) {
  const entriesRefs = trackerSnap.data().entries;
  const entriesSnaps = await Promise.all(entriesRefs.map(e => e.get()));

  return entriesSnaps.filter(e => e.exists);
}

async function fetchState(uid) {
  const userSnap = await findOrCreateUser(uid, 'Andrew');
  const trackerSnap = await findOrCreateTracker(userSnap, 'Andrews tracker');
  const entriesSnaps = await fetchEntries(trackerSnap);

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

async function saveEntry(trackerSnap, date, entryData) {
  const entries = trackerSnap.data().entries;
  let newEntries = entries;
  const entryRef = db.collection('entries').doc(date);

  await entryRef.set(entryData, { merge: true });

  if (!entries.find(e => e.id === entryRef.id)) {
    newEntries = [ ...entries, entryRef ];
  }

  await trackerSnap.ref.set({ entries: newEntries }, { merge: true });

  return await entryRef.get();
}

async function run() {
  const result = await auth.signInAnonymously();
  const uid = 123;

  const userSnap = await findOrCreateUser(uid, 'Andrew');

  let trackerSnap = await findOrCreateTracker(userSnap, 'Andrews tracker');
  let entriesSnaps = await fetchEntries(trackerSnap);
  console.log(entriesSnaps.map(e => e.data()));

  await saveEntry(trackerSnap, '2020-01-23', { parameters: { cough: true } });

  trackerSnap = await findOrCreateTracker(userSnap, 'Andrews tracker');
  entriesSnaps = await fetchEntries(trackerSnap);
  console.log(entriesSnaps.map(e => e.data()));
}

run();

///////////////////
// process.exit(1);
