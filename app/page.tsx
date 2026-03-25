"use client";

import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, collection, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import { auth, db, storage } from "@/lib/firebase";

type RecordingState = "idle" | "recording" | "uploading" | "done" | "error";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Auth gate
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
      } else {
        router.replace("/login");
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const startRecording = async () => {
    try {
      setAudioUrl(null);
      setStatusMessage("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks so the mic indicator goes away
        streamRef.current?.getTracks().forEach((t) => t.stop());

        setRecordingState("uploading");
        setStatusMessage("Uploading…");

        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const uid = user!.uid;

          // Auto-generate a Firestore session document (gives us the ID)
          const sessionsColRef = collection(db, "User", uid, "Sessions");
          const sessionDocRef = doc(sessionsColRef); // auto-id
          const sessionId = sessionDocRef.id;

          // Upload to Storage: audio/{uid}/{sessionId}/dump.webm
          const storageRef = ref(storage, `audio/${uid}/${sessionId}/dump.webm`);
          await uploadBytes(storageRef, blob, { contentType: "audio/webm" });
          const downloadURL = await getDownloadURL(storageRef);

          // Write Firestore doc
          await setDoc(sessionDocRef, {
            dumpAudio: downloadURL,
            createdAt: serverTimestamp(),
          });

          setAudioUrl(downloadURL);
          setRecordingState("done");
          setStatusMessage("Upload complete.");
        } catch (err) {
          console.error("Upload failed", err);
          setRecordingState("error");
          setStatusMessage("Upload failed. Check console for details.");
        }
      };

      mediaRecorder.start();
      setRecordingState("recording");
      setStatusMessage("Recording…");
    } catch (err) {
      console.error("Could not start recording", err);
      setRecordingState("error");
      setStatusMessage("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  if (authLoading) return null;

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black gap-4 p-8">
      <div className="flex gap-4">
        <button
          onClick={startRecording}
          disabled={recordingState === "recording" || recordingState === "uploading"}
          style={{ padding: "8px 16px" }}
        >
          Start Recording
        </button>
        <button
          onClick={stopRecording}
          disabled={recordingState !== "recording"}
          style={{ padding: "8px 16px" }}
        >
          Stop Recording
        </button>
      </div>

      {statusMessage && <p>{statusMessage}</p>}

      {audioUrl && (
        <p>
          <strong>dumpAudio:</strong>{" "}
          <a href={audioUrl} target="_blank" rel="noreferrer">
            {audioUrl}
          </a>
        </p>
      )}
    </div>
  );
}
