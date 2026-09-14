"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { deleteCloudProject, listCloudProjects, persistProjectBlobAssets, saveProjectToCloud, type CloudProject } from "@/lib/supabase/project-sync";
import { useEditorStore } from "@/store/editor-store";

export function AuthProjectControls() {
  const project = useEditorStore((state) => state.project);
  const [user, setUser] = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"guest" | "saved" | "saving" | "error">("guest");
  const [message, setMessage] = useState("");
  const [projects, setProjects] = useState<CloudProject[]>([]);
  const authDialogRef = useRef<HTMLDivElement>(null);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!authOpen) return;
    const firstField = authDialogRef.current?.querySelector<HTMLInputElement>("input");
    firstField?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setAuthOpen(false);
      }
      if (event.key !== "Tab" || !authDialogRef.current) return;
      const focusable = Array.from(authDialogRef.current.querySelectorAll<HTMLElement>("button, input, [href], [tabindex]:not([tabindex='-1'])")).filter((element) => !element.hasAttribute("disabled"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [authOpen]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setStatus(data.user ? "saved" : "guest");
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setStatus(session?.user ? "saved" : "guest");
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const syncProject = async () => {
    await saveProjectToCloud(project);
    const persisted = await persistProjectBlobAssets(project);
    if (persisted !== project) {
      useEditorStore.setState({ project: persisted });
      await saveProjectToCloud(persisted);
    }
  };

  useEffect(() => {
    if (!user) return;
    setStatus("saving");
    const timeout = window.setTimeout(async () => {
      try {
        await syncProject();
        setStatus("saved");
      } catch (error) {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Could not save project.");
      }
    }, 1000);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, user]);

  const accountLabel = useMemo(() => user?.email?.split("@")[0] || "Account", [user]);

  const submitEmailAuth = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return setMessage("Supabase environment variables are not configured yet.");
    setMessage("");
    const result = mode === "signup"
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) return setMessage(result.error.message);
    if (mode === "signup" && !result.data.session) {
      setMessage("Check your email to confirm your account, then sign in.");
      setMode("signin");
      return;
    }
    setAuthOpen(false);
    setEmail("");
    setPassword("");
  };

  const signInWithGoogle = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return setMessage("Supabase environment variables are not configured yet.");
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
    if (error) setMessage(error.message);
  };

  const resetPassword = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return setMessage("Supabase environment variables are not configured yet.");
    if (!email) return setMessage("Enter your email first.");
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    setMessage(error ? error.message : "Password reset email sent.");
  };

  const signOut = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setProjectsOpen(false);
  };

  const saveNow = async () => {
    if (!user) return setAuthOpen(true);
    try {
      setStatus("saving");
      await syncProject();
      setStatus("saved");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not save project.");
    }
  };

  const openProjects = async () => {
    if (!user) return setAuthOpen(true);
    try {
      setProjects(await listCloudProjects());
      setProjectsOpen(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load projects.");
    }
  };

  const loadProject = (cloud: CloudProject) => {
    useEditorStore.setState((state) => ({
      project: cloud.project_data,
      currentTime: 0,
      isPlaying: false,
      selectedLayerId: null,
      selectedComponentId: null,
      selectedComponentIds: [],
      selectedMusicTrackId: null,
      replayKey: state.replayKey + 1,
      pastProjects: [],
      futureProjects: [],
    }));
    setProjectsOpen(false);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <span className={`hidden text-[10px] sm:inline ${status === "error" ? "text-red-300" : status === "saving" ? "text-[#D7FF45]" : "text-white/35"}`}>{!user ? "Guest" : status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : "Save error"}</span>
        <button onClick={saveNow} className="rounded-full border border-[#D7FF45]/30 bg-[#D7FF45]/10 px-3 py-1.5 text-[10px] font-medium text-[#D7FF45] hover:bg-[#D7FF45]/15">Save</button>
        <button onClick={openProjects} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] text-white/55 hover:border-[#8067FF]/40 hover:text-white">My Projects</button>
        {user ? <button onClick={signOut} title={user.email ?? "Signed in"} className="rounded-full border border-[#8067FF]/30 bg-[#8067FF]/10 px-3 py-1.5 text-[10px] text-[#C7BEFF] hover:border-[#D7FF45]/40 hover:text-[#D7FF45]">{accountLabel} · Sign out</button> : <button onClick={() => setAuthOpen(true)} className="rounded-full bg-[#8067FF] px-3 py-1.5 text-[10px] font-semibold text-white hover:bg-[#8f79ff]">Sign in</button>}
      </div>

      {authOpen && <div className="fixed inset-0 z-[100] grid place-items-center bg-black/65 p-4 backdrop-blur-sm"><div ref={authDialogRef} role="dialog" aria-modal="true" aria-labelledby="kinetiq-auth-title" className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#121218] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4"><div><h2 id="kinetiq-auth-title" className="text-lg font-semibold">{mode === "signin" ? "Welcome back" : "Create your Kinetiq account"}</h2><p className="mt-1 text-xs text-white/40">Sign in to save projects and media to the cloud.</p></div><button aria-label="Close sign-in dialog" onClick={() => setAuthOpen(false)} className="text-white/35 hover:text-white">×</button></div>
        {!configured && <div className="mt-4 rounded-lg border border-[#D7FF45]/20 bg-[#D7FF45]/[0.05] p-3 text-[10px] leading-4 text-[#D7FF45]/80">Supabase is not configured yet. Add the public Supabase environment variables in Vercel before using authentication.</div>}
        <button onClick={signInWithGoogle} className="mt-5 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs font-medium hover:border-[#8067FF]/50 hover:bg-[#8067FF]/10">Continue with Google</button>
        <div className="my-4 flex items-center gap-3 text-[10px] text-white/25"><span className="h-px flex-1 bg-white/10" />or continue with email<span className="h-px flex-1 bg-white/10" /></div>
        <div className="space-y-3"><label className="sr-only" htmlFor="kinetiq-email">Email</label><input id="kinetiq-email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs outline-none focus:border-[#D7FF45]/60" /><label className="sr-only" htmlFor="kinetiq-password">Password</label><input id="kinetiq-password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs outline-none focus:border-[#D7FF45]/60" />{message && <div className={`text-[10px] leading-4 ${message.includes("sent") || message.includes("confirm") ? "text-[#D7FF45]" : "text-red-300"}`}>{message}</div>}<button onClick={submitEmailAuth} disabled={!email || password.length < 6} className="w-full rounded-lg bg-[#D7FF45] px-3 py-2.5 text-xs font-bold text-[#0B0B0F] disabled:opacity-40">{mode === "signin" ? "Sign in" : "Create account"}</button></div>
        {mode === "signin" && <button onClick={resetPassword} className="mt-3 w-full text-center text-[10px] text-white/35 hover:text-[#D7FF45]">Forgot password?</button>}
        <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }} className="mt-3 w-full text-center text-[10px] text-white/40 hover:text-[#D7FF45]">{mode === "signin" ? "New to Kinetiq? Create an account" : "Already have an account? Sign in"}</button>
      </div></div>}

      {projectsOpen && <div className="fixed inset-0 z-[100] grid place-items-center bg-black/65 p-4 backdrop-blur-sm"><div className="max-h-[75vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#121218] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 p-4"><div><h2 className="text-base font-semibold">My Projects</h2><p className="mt-0.5 text-[10px] text-white/35">Cloud projects saved to your Kinetiq account.</p></div><button onClick={() => setProjectsOpen(false)} className="text-white/35 hover:text-white">×</button></div>
        <div className="max-h-[60vh] overflow-y-auto p-3">{projects.length === 0 ? <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-xs text-white/30">No cloud projects yet.</div> : projects.map((item) => <div key={item.id} className="mb-2 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3"><button onClick={() => loadProject(item)} className="min-w-0 flex-1 text-left"><div className="truncate text-xs font-medium">{item.name}</div><div className="mt-1 text-[9px] text-white/30">{item.width} × {item.height} · edited {new Date(item.updated_at).toLocaleString()}</div></button><button onClick={async () => { await deleteCloudProject(item.id); setProjects((value) => value.filter((p) => p.id !== item.id)); }} className="rounded-md px-2 py-1 text-[10px] text-white/30 hover:bg-red-500/10 hover:text-red-300">Delete</button></div>)}</div>
      </div></div>}
    </>
  );
}
