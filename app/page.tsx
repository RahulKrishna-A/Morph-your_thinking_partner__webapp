"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useConversation } from "@elevenlabs/react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { auth, db, storage } from "@/lib/firebase";

type RecordingState =
  | "idle"
  | "recording"
  | "recorded"
  | "uploading"
  | "submitted"
  | "error";

type CallState = "idle" | "calling" | "in_call" | "error";
type SessionDoc = { status?: string; dumpAudioUrl?: string };

const LOCAL_SESSION_KEY = "morph.active_session";
const CALL_AGENT_URL = "https://us-central1-morph-thinking-partner.cloudfunctions.net/onAgentCall"
const ELEVEN_AGENT_ID =
  process.env.NEXT_PUBLIC_ELEVEN_AGENT_ID ?? "YOUR_AGENT_ID";

export default function Home() {
  const router = useRouter();
  const conversation = useConversation();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [recordingState, setRecordingState] =
    useState<RecordingState>("idle");
  const [callState, setCallState] = useState<CallState>("idle");

  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [localAudioPreviewUrl, setLocalAudioPreviewUrl] = useState<string | null>(
    null
  );
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [sessionDocStatus, setSessionDocStatus] = useState<string | null>(null);
  const [backendConversationId, setBackendConversationId] = useState<
    string | null
  >(null);
  const [elevenConversationId, setElevenConversationId] = useState<
    string | null
  >(null);
  const [statusMessage, setStatusMessage] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

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

  useEffect(() => {
    if (!user) return;
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as { sessionId?: string; userId?: string };
      if (parsed.userId === user.uid && parsed.sessionId) {
        setSessionId(parsed.sessionId);
        setStatusMessage(`Resumed local session: ${parsed.sessionId}`);
      }
    } catch {
      localStorage.removeItem(LOCAL_SESSION_KEY);
    }
  }, [user]);

  useEffect(() => {
    if (!user || !sessionId) return;

    const sessionDocRef = doc(db, "User", user.uid, "Sessions", sessionId);
    const unsubscribe = onSnapshot(sessionDocRef, (snapshot) => {
      if (!snapshot.exists()) {
        setSessionDocStatus(null);
        return;
      }

      const data = snapshot.data() as SessionDoc;
      setSessionDocStatus(data.status ?? null);
      if (data.dumpAudioUrl) {
        setAudioUrl(data.dumpAudioUrl);
      }
    });

    return () => unsubscribe();
  }, [sessionId, user]);

  useEffect(() => {
    return () => {
      if (localAudioPreviewUrl) {
        URL.revokeObjectURL(localAudioPreviewUrl);
      }
    };
  }, [localAudioPreviewUrl]);

  const createNewSession = () => {
    const newSessionId = uuidv4();

    if (localAudioPreviewUrl) {
      URL.revokeObjectURL(localAudioPreviewUrl);
    }

    setSessionId(newSessionId);
    setRecordingState("idle");
    setCallState("idle");
    setRecordingBlob(null);
    setLocalAudioPreviewUrl(null);
    setAudioUrl(null);
    setSessionDocStatus(null);
    setBackendConversationId(null);
    setElevenConversationId(null);
    setStatusMessage("Session created. You can start recording.");

    if (user) {
      localStorage.setItem(
        LOCAL_SESSION_KEY,
        JSON.stringify({ sessionId: newSessionId, userId: user.uid })
      );
    }
  };

  const startRecording = async () => {
    if (!sessionId) {
      setStatusMessage("Please create a new session first.");
      return;
    }

    try {
      if (localAudioPreviewUrl) {
        URL.revokeObjectURL(localAudioPreviewUrl);
      }

      setRecordingBlob(null);
      setLocalAudioPreviewUrl(null);
      setSessionDocStatus(null);
      setBackendConversationId(null);
      setElevenConversationId(null);
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

      mediaRecorder.onstop = () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordingBlob(blob);
        setLocalAudioPreviewUrl(URL.createObjectURL(blob));
        setRecordingState("recorded");
        setStatusMessage("Recording complete. Submit to create sessionDoc.");
      };

      mediaRecorder.start();
      setRecordingState("recording");
      setStatusMessage("Recording...");
    } catch (error) {
      console.error("Could not start recording", error);
      setRecordingState("error");
      setStatusMessage("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const submitRecording = async () => {
    if (!user || !sessionId || !recordingBlob) return;

    try {
      setRecordingState("uploading");
      setStatusMessage("Uploading and creating sessionDoc...");

      const storageRef = ref(storage, `audio/${user.uid}/${sessionId}/dump.webm`);
      await uploadBytes(storageRef, recordingBlob, { contentType: "audio/webm" });
      const downloadURL = await getDownloadURL(storageRef);

      const sessionDocRef = doc(db, "User", user.uid, "Sessions", sessionId);
      await setDoc(sessionDocRef, {
        sessionId,
        dumpAudioUrl: downloadURL,
        status: "recording_submitted",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setAudioUrl(downloadURL);
      setRecordingState("submitted");
      setStatusMessage(
        "Recording submitted. Waiting for status: ready_for_call on sessionDoc."
      );
    } catch (error) {
      console.error("Submit failed", error);
      setRecordingState("error");
      setStatusMessage("Submit failed. Check console for details.");
    }
  };

  const callAgent = async () => {
    if (!user || !sessionId) return;

    try {
      setCallState("calling");
      setStatusMessage("Calling backend to start agent...");

      const response = await axios.post(CALL_AGENT_URL, {
        sessionId,
        userId: user.uid,
      });

      const returnedConversationId = response.data?.conversationId as
        | string
        | undefined;

      const conversationToken = response.data?.conversationToken as string
      const agentContext = response.data?.agentContext as string



      await navigator.mediaDevices.getUserMedia({ audio: true });
      const startedConversationId = await conversation.startSession({
        conversationToken,
        connectionType: "webrtc",
        dynamicVariables: {
          greeting: "good morning",
          morph_context: agentContext,
        },
      });

      setElevenConversationId(startedConversationId);
      setCallState("in_call");
      setStatusMessage("Agent call started.");
    } catch (error) {
      console.error("Failed to call agent", error);
      setCallState("error");
      setStatusMessage("Failed to call agent. Check console for details.");
    }
  };

  if (authLoading) return null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 p-8 font-sans dark:bg-black">
      {!sessionId && (
        <button onClick={createNewSession} style={{ padding: "8px 16px" }}>
          Create New Session
        </button>
      )}

      {sessionId && (
        <>
          <p>
            <strong>Session ID:</strong> {sessionId}
          </p>
          <button onClick={createNewSession} style={{ padding: "8px 16px" }}>
            Create New Session
          </button>
        </>
      )}

      <div className="flex gap-4">
        <button
          onClick={startRecording}
          disabled={
            !sessionId ||
            recordingState === "recording" ||
            recordingState === "uploading"
          }
          style={{ padding: "8px 16px" }}
        >
          Record Start
        </button>

        <button
          onClick={stopRecording}
          disabled={recordingState !== "recording"}
          style={{ padding: "8px 16px" }}
        >
          Record End
        </button>
      </div>

      <button
        onClick={submitRecording}
        disabled={recordingState !== "recorded"}
        style={{ padding: "8px 16px" }}
      >
        Submit Recording
      </button>

      {sessionDocStatus === "ready_for_call" && (
        <button
          onClick={callAgent}
          disabled={callState === "calling"}
          style={{ padding: "8px 16px" }}
        >
          Call Agent
        </button>
      )}

      {statusMessage && <p>{statusMessage}</p>}

      {sessionDocStatus && (
        <p>
          <strong>sessionDoc.status:</strong> {sessionDocStatus}
        </p>
      )}

      {localAudioPreviewUrl && (
        <audio controls src={localAudioPreviewUrl}>
          <track kind="captions" />
        </audio>
      )}

      {audioUrl && (
        <p>
          <strong>dumpAudio:</strong>{" "}
          <a href={audioUrl} target="_blank" rel="noreferrer">
            {audioUrl}
          </a>
        </p>
      )}

      {backendConversationId && (
        <p>
          <strong>Backend conversationId:</strong> {backendConversationId}
        </p>
      )}

      {elevenConversationId && (
        <p>
          <strong>Eleven conversationId:</strong> {elevenConversationId}
        </p>
      )}
    </div>
  );
}
