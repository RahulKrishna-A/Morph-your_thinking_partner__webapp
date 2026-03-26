"use client";

import { useCallback, useEffect, useState } from "react";
import {
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import type { User } from "firebase/auth";
import { v4 as uuidv4 } from "uuid";
import { db, storage } from "@/lib/firebase";
import type { SessionItem } from "@/lib/types";

const LOCAL_SESSION_KEY = "morph.active_session";

export function useSessions(user: User | null) {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionDocStatus, setSessionDocStatus] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [vmUrl, setVmUrl] = useState<string | null>(null);

  // Load saved session from localStorage
  useEffect(() => {
    if (!user) return;
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as {
        sessionId?: string;
        userId?: string;
      };
      if (parsed.userId === user.uid && parsed.sessionId) {
        setSessionId(parsed.sessionId);
      }
    } catch {
      localStorage.removeItem(LOCAL_SESSION_KEY);
    }
  }, [user]);

  // Listen to all sessions for sidebar
  useEffect(() => {
    if (!user) return;

    const sessionsRef = collection(db, "User", user.uid, "Sessions");
    const q = query(sessionsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: SessionItem[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          sessionId: doc.id,
          status: data.status ?? undefined,
          createdAt: data.createdAt?.toDate() ?? undefined,
          dumpAudioUrl: data.dumpAudioUrl ?? undefined,
          vmUrl: data.vmUrl ?? undefined,
        };
      });
      setSessions(items);
    });

    return () => unsubscribe();
  }, [user]);

  // Listen to active session doc
  useEffect(() => {
    if (!user || !sessionId) return;

    const sessionDocRef = doc(db, "User", user.uid, "Sessions", sessionId);
    const unsubscribe = onSnapshot(sessionDocRef, (snapshot) => {
      if (!snapshot.exists()) {
        setSessionDocStatus(null);
        setAudioUrl(null);
        setVmUrl(null);
        return;
      }
      const data = snapshot.data();
      setSessionDocStatus(data.status ?? null);
      setAudioUrl(data.dumpAudioUrl ?? null);
      setVmUrl(data.vmUrl ?? null);
    });

    return () => unsubscribe();
  }, [sessionId, user]);

  const createNewSession = useCallback(() => {
    const newSessionId = uuidv4();
    setSessionId(newSessionId);
    setSessionDocStatus(null);
    setAudioUrl(null);
    setVmUrl(null);

    if (user) {
      localStorage.setItem(
        LOCAL_SESSION_KEY,
        JSON.stringify({ sessionId: newSessionId, userId: user.uid })
      );
    }

    return newSessionId;
  }, [user]);

  const selectSession = useCallback(
    (id: string) => {
      setSessionId(id);
      setSessionDocStatus(null);
      setAudioUrl(null);
      setVmUrl(null);
      if (user) {
        localStorage.setItem(
          LOCAL_SESSION_KEY,
          JSON.stringify({ sessionId: id, userId: user.uid })
        );
      }
    },
    [user]
  );

  const submitRecording = useCallback(
    async (recordingBlob: Blob) => {
      if (!user || !sessionId) return;

      const storageRef = ref(
        storage,
        `audio/${user.uid}/${sessionId}/dump.webm`
      );
      await uploadBytes(storageRef, recordingBlob, {
        contentType: "audio/webm",
      });
      const downloadURL = await getDownloadURL(storageRef);

      const sessionDocRef = doc(db, "User", user.uid, "Sessions", sessionId);
      await setDoc(sessionDocRef, {
        sessionId,
        dumpAudioUrl: downloadURL,
        status: "recording_submitted",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const userRef = doc(db, "User", user.uid);
      await updateDoc(userRef, { credits: increment(-1) });

      setAudioUrl(downloadURL);
    },
    [user, sessionId]
  );

  return {
    sessions,
    sessionId,
    sessionDocStatus,
    audioUrl,
    vmUrl,
    createNewSession,
    selectSession,
    submitRecording,
  };
}
