import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const writeupId = searchParams.get("writeupId");

    if (!writeupId) {
      return NextResponse.json({ error: "writeupId is required" }, { status: 400 });
    }

    const user = await getCurrentUser();

    const count = await db.bookmark.count({
      where: {
        contentType: "WRITEUP_LIKE",
        contentId: writeupId,
      },
    });

    let hasLiked = false;
    if (user) {
      const userLike = await db.bookmark.findUnique({
        where: {
          userId_contentType_contentId: {
            userId: user.id,
            contentType: "WRITEUP_LIKE",
            contentId: writeupId,
          },
        },
      });
      hasLiked = !!userLike;
    }

    return NextResponse.json({ count, hasLiked, isLoggedIn: !!user });
  } catch (error: any) {
    console.error("Fetch writeup likes error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required to like write-ups" }, { status: 401 });
    }

    const body = await req.json();
    const { writeupId } = body;

    if (!writeupId || typeof writeupId !== "string") {
      return NextResponse.json({ error: "writeupId is required" }, { status: 400 });
    }

    // Verify writeup exists and is published
    const writeup = await db.writeUp.findUnique({
      where: { id: writeupId },
      select: { id: true, title: true, status: true, authorId: true },
    });

    if (!writeup || writeup.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Write-up not found or unpublished" }, { status: 404 });
    }

    // Check existing like
    const existingLike = await db.bookmark.findUnique({
      where: {
        userId_contentType_contentId: {
          userId: user.id,
          contentType: "WRITEUP_LIKE",
          contentId: writeupId,
        },
      },
    });

    let hasLiked = false;

    if (existingLike) {
      // Unlike
      await db.bookmark.delete({
        where: { id: existingLike.id },
      });
      hasLiked = false;
    } else {
      // Like
      await db.bookmark.create({
        data: {
          userId: user.id,
          contentType: "WRITEUP_LIKE",
          contentId: writeupId,
        },
      });
      hasLiked = true;

      // Notify the author if it's someone else
      if (writeup.authorId !== user.id) {
        await db.notification.create({
          data: {
            userId: writeup.authorId,
            title: "Write-up Endorsed",
            message: `${user.name} liked your write-up: "${writeup.title}"`,
            type: "INFO",
            link: `/writeups/${writeupId}`,
          },
        });
      }
    }

    const count = await db.bookmark.count({
      where: {
        contentType: "WRITEUP_LIKE",
        contentId: writeupId,
      },
    });

    return NextResponse.json({ count, hasLiked });
  } catch (error: any) {
    console.error("Toggle writeup like error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
