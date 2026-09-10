import type { Project, VisualComponent } from "@/lib/project-schema";
import { getSupabaseClient } from "@/lib/supabase/client";

export type CloudProject = {
  id: string;
  user_id: string;
  name: string;
  width: number;
  height: number;
  fps: number;
  duration: number;
  project_data: Project;
  created_at: string;
  updated_at: string;
};

export async function saveProjectToCloud(project: Project) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to save this project.");

  const timeline = project.scenes[0];
  const payload = {
    id: project.id,
    user_id: user.id,
    name: project.name,
    width: project.width,
    height: project.height,
    fps: project.fps,
    duration: timeline.durationInSeconds,
    project_data: project,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("projects").upsert(payload, { onConflict: "id" });
  if (error) throw error;
}

export async function listCloudProjects() {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("projects")
    .select("id,user_id,name,width,height,fps,duration,project_data,created_at,updated_at")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as CloudProject[];
}

export async function deleteCloudProject(projectId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw error;
}

export async function uploadProjectAsset(file: File, projectId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${user.id}/${projectId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("project-assets")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("project-assets").getPublicUrl(path);

  const { error: assetError } = await supabase.from("assets").insert({
    user_id: user.id,
    project_id: projectId,
    type: file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "audio",
    file_name: file.name,
    storage_path: path,
    mime_type: file.type,
    size_bytes: file.size,
  });
  if (assetError) throw assetError;

  return data.publicUrl;
}

async function uploadBlobUrl(src: string, fileName: string, mimeType: string, projectId: string) {
  if (!src.startsWith("blob:")) return src;
  const response = await fetch(src);
  const blob = await response.blob();
  const file = new File([blob], fileName || "asset", { type: blob.type || mimeType });
  return (await uploadProjectAsset(file, projectId)) ?? src;
}

export async function persistProjectBlobAssets(project: Project) {
  let changed = false;
  const scenes = [] as Project["scenes"];

  for (const scene of project.scenes) {
    const layers = [] as typeof scene.layers;
    for (const layer of scene.layers) {
      const components: VisualComponent[] = [];
      for (const component of layer.components) {
        if ((component.type === "image" || component.type === "video") && component.src?.startsWith("blob:")) {
          const nextSrc = await uploadBlobUrl(component.src, component.name, component.type === "image" ? "image/*" : "video/*", project.id);
          components.push({ ...component, src: nextSrc } as VisualComponent);
          changed = changed || nextSrc !== component.src;
        } else {
          components.push(component);
        }
      }
      layers.push({ ...layer, components });
    }

    const musicTracks = [] as typeof scene.musicTracks;
    for (const track of scene.musicTracks) {
      if (track.src?.startsWith("blob:")) {
        const nextSrc = await uploadBlobUrl(track.src, track.name, "audio/*", project.id);
        musicTracks.push({ ...track, src: nextSrc });
        changed = changed || nextSrc !== track.src;
      } else {
        musicTracks.push(track);
      }
    }

    scenes.push({ ...scene, layers, musicTracks });
  }

  return changed ? { ...project, scenes } : project;
}
