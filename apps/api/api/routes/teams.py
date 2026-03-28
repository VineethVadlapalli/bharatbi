from __future__ import annotations

"""Teams API — invite members, manage roles (admin/analyst/viewer), list team."""
from uuid import UUID
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import text

from apps.api.api.db import async_session

router = APIRouter()

DEV_ORG_ID = "00000000-0000-0000-0000-000000000001"
DEV_USER_ID = "00000000-0000-0000-0000-000000000002"

VALID_ROLES = ["admin", "analyst", "viewer"]


class InviteRequest(BaseModel):
    email: str
    role: str = "analyst"


class RoleUpdate(BaseModel):
    role: str


@router.get("/members")
async def list_members():
    """List all team members in the org."""
    async with async_session() as db:
        result = await db.execute(
            text("SELECT id, email, name, role, created_at FROM users WHERE org_id = :org_id ORDER BY created_at"),
            {"org_id": DEV_ORG_ID},
        )
        return [dict(r) for r in result.mappings().all()]


@router.post("/invite")
async def invite_member(req: InviteRequest):
    """Invite a new team member by email."""
    if req.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Role must be one of: {VALID_ROLES}")

    async with async_session() as db:
        # Check if already a member
        existing = await db.execute(
            text("SELECT id FROM users WHERE email = :email AND org_id = :org_id"),
            {"email": req.email, "org_id": DEV_ORG_ID},
        )
        if existing.first():
            raise HTTPException(status_code=400, detail="User is already a team member")

        # Check if invite already pending
        pending = await db.execute(
            text("SELECT id FROM team_invites WHERE email = :email AND org_id = :org_id AND status = 'pending'"),
            {"email": req.email, "org_id": DEV_ORG_ID},
        )
        if pending.first():
            raise HTTPException(status_code=400, detail="Invite already pending for this email")

        result = await db.execute(
            text("""
                INSERT INTO team_invites (org_id, email, role, invited_by)
                VALUES (:org_id, :email, :role, :invited_by)
                RETURNING id, email, role, status, created_at, expires_at
            """),
            {"org_id": DEV_ORG_ID, "email": req.email, "role": req.role, "invited_by": DEV_USER_ID},
        )
        await db.commit()
        row = result.mappings().first()
        return dict(row)


@router.get("/invites")
async def list_invites():
    """List pending invitations."""
    async with async_session() as db:
        result = await db.execute(
            text("""
                SELECT ti.id, ti.email, ti.role, ti.status, ti.created_at, ti.expires_at, u.name as invited_by_name
                FROM team_invites ti
                LEFT JOIN users u ON ti.invited_by = u.id
                WHERE ti.org_id = :org_id
                ORDER BY ti.created_at DESC
            """),
            {"org_id": DEV_ORG_ID},
        )
        return [dict(r) for r in result.mappings().all()]


@router.patch("/members/{user_id}/role")
async def update_role(user_id: UUID, body: RoleUpdate):
    """Change a team member's role."""
    if body.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Role must be one of: {VALID_ROLES}")

    async with async_session() as db:
        result = await db.execute(
            text("UPDATE users SET role = :role WHERE id = :id AND org_id = :org_id"),
            {"role": body.role, "id": str(user_id), "org_id": DEV_ORG_ID},
        )
        await db.commit()
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="User not found")
    return {"status": "updated", "user_id": str(user_id), "role": body.role}


@router.delete("/members/{user_id}")
async def remove_member(user_id: UUID):
    """Remove a team member (cannot remove yourself)."""
    if str(user_id) == DEV_USER_ID:
        raise HTTPException(status_code=400, detail="Cannot remove yourself")

    async with async_session() as db:
        result = await db.execute(
            text("DELETE FROM users WHERE id = :id AND org_id = :org_id"),
            {"id": str(user_id), "org_id": DEV_ORG_ID},
        )
        await db.commit()
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="User not found")
    return {"status": "removed"}


@router.delete("/invites/{invite_id}")
async def cancel_invite(invite_id: UUID):
    """Cancel a pending invitation."""
    async with async_session() as db:
        result = await db.execute(
            text("DELETE FROM team_invites WHERE id = :id AND org_id = :org_id"),
            {"id": str(invite_id), "org_id": DEV_ORG_ID},
        )
        await db.commit()
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Invite not found")
    return {"status": "cancelled"}
