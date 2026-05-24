import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

export async function uploadProfileImage(uid, localUri) {
  if (!uid || !localUri) {
    throw new Error('Profile image upload requires a valid user and image.');
  }

  const response = await fetch(localUri);
  const blob = await response.blob();
  const imageRef = ref(storage, `profiles/${uid}/avatar.jpg`);
  await uploadBytes(imageRef, blob, { contentType: 'image/jpeg' });
  return getDownloadURL(imageRef);
}
