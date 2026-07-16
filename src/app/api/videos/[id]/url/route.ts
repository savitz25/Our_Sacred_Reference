import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSignedRecordingUrl } from "@/lib/storage/recordings";

/**
 * Private signed URL for a library video (owner or practitioner only).
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: video } = await supabase
      .from("videos")
      .select("*")
      .eq("id", id)
      .single();

    if (!video) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isPractitioner =
      profile?.role === "practitioner" || profile?.role === "admin";

    if (video.user_id !== user.id && !isPractitioner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!video.storage_path || video.status !== "ready") {
      return NextResponse.json(
        {
          error: "Recording not ready",
          status: video.status,
        },
        { status: 404 }
      );
    }

    const signedUrl = await createSignedRecordingUrl(video.storage_path, 3600);
    if (!signedUrl) {
      return NextResponse.json(
        {
          error:
            "Could not create signed URL. Ensure the file exists in session-recordings and Supabase S3 upload completed.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      url: signedUrl,
      expiresIn: 3600,
      title: video.title,
      storagePath: video.storage_path,
    });
  } catch (e) {
    console.error("video url", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
