from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db, Board, BoardMember, Team, TeamMembership, User
from dependencies import (
    effective_system_role,
    get_current_user_record,
    is_admin_user,
    user_managed_team_ids,
)
from schemas import TeamAssignmentModel, TeamCreateModel, TeamUpdateModel

router = APIRouter()


def _team_dict(db: Session, team: Team) -> dict:
    memberships = (
        db.query(TeamMembership)
        .filter(TeamMembership.team_id == team.id)
        .order_by(TeamMembership.membership_role, TeamMembership.username)
        .all()
    )
    managers = [m.username for m in memberships if m.membership_role == "manager"]
    staff = [m.username for m in memberships if m.membership_role == "staff"]
    projects = db.query(Board).filter(Board.team_id == team.id).all()
    return {
        "id": team.id,
        "name": team.name,
        "description": team.description,
        "created_at": team.created_at,
        "manager_username": managers[0] if managers else None,
        "managers": managers,
        "staff": staff,
        "member_count": len(memberships),
        "project_count": len(projects),
        "projects": [{"id": project.id, "name": project.name} for project in projects],
        "members": [
            {"username": m.username, "membership_role": m.membership_role}
            for m in memberships
        ],
    }


def _require_team_management(db: Session, actor: User, team_id: int):
    if is_admin_user(actor):
        return
    if (
        effective_system_role(actor) != "manager"
        or team_id not in user_managed_team_ids(db, actor.username)
    ):
        raise HTTPException(
            status_code=403, detail="Manager access to this team is required"
        )


@router.get("/api/teams/directory")
def team_directory(
    actor: User = Depends(get_current_user_record), db: Session = Depends(get_db)
):
    query = db.query(Team)
    if not is_admin_user(actor):
        visible_ids = {
            row[0]
            for row in db.query(TeamMembership.team_id)
            .filter(TeamMembership.username == actor.username)
            .all()
        }
        query = query.filter(Team.id.in_(visible_ids)) if visible_ids else query.filter(False)
    teams = query.order_by(Team.name).all()
    visible_team_ids = {team.id for team in teams}
    memberships = (
        db.query(TeamMembership)
        .filter(TeamMembership.team_id.in_(visible_team_ids))
        .all()
        if visible_team_ids
        else []
    )
    users = {user.username: user for user in db.query(User).all()}
    teams_by_id = {team.id: team for team in teams}
    members = []
    for membership in memberships:
        user = users.get(membership.username)
        if not user:
            continue
        owned_projects = db.query(Board).filter(Board.owner_username == user.username).all()
        member_board_ids = {
            row[0]
            for row in db.query(BoardMember.board_id)
            .filter(
                BoardMember.member_username == user.username,
                BoardMember.status == "accepted",
            )
            .all()
        }
        projects = {
            project.id: project
            for project in owned_projects
        }
        if member_board_ids:
            projects.update(
                {
                    project.id: project
                    for project in db.query(Board)
                    .filter(Board.id.in_(member_board_ids))
                    .all()
                }
            )
        members.append(
            {
                "id": f"{membership.team_id}:{user.username}",
                "username": user.username,
                "full_name": user.full_name,
                "email": user.email,
                "avatar": user.avatar,
                "system_role": effective_system_role(user),
                "role": membership.membership_role,
                "status": user.account_status,
                "team_id": membership.team_id,
                "team_name": teams_by_id[membership.team_id].name,
                "projects": [
                    {"id": project.id, "name": project.name}
                    for project in projects.values()
                ],
                "project_count": len(projects),
            }
        )
    if is_admin_user(actor):
        assigned_usernames = {membership.username for membership in memberships}
        for user in users.values():
            if user.username in assigned_usernames:
                continue
            members.append(
                {
                    "id": f"unassigned:{user.username}",
                    "username": user.username,
                    "full_name": user.full_name,
                    "email": user.email,
                    "avatar": user.avatar,
                    "system_role": effective_system_role(user),
                    "role": effective_system_role(user),
                    "status": user.account_status,
                    "team_id": None,
                    "team_name": None,
                    "project_count": db.query(Board)
                    .filter(Board.owner_username == user.username)
                    .count(),
                }
            )
    return {
        "teams": [_team_dict(db, team) for team in teams],
        "members": sorted(members, key=lambda item: (item["team_name"] or "", item["username"])),
        "viewer_role": effective_system_role(actor),
    }


@router.get("/api/teams")
def list_teams(
    actor: User = Depends(get_current_user_record), db: Session = Depends(get_db)
):
    return team_directory(actor=actor, db=db)


@router.post("/api/teams")
def create_team(
    payload: TeamCreateModel,
    actor: User = Depends(get_current_user_record),
    db: Session = Depends(get_db),
):
    if not is_admin_user(actor):
        raise HTTPException(status_code=403, detail="Admin access required")
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Team name is required")
    if db.query(Team).filter(Team.name == name).first():
        raise HTTPException(status_code=409, detail="Team name already exists")
    team = Team(name=name, description=payload.description)
    db.add(team)
    db.commit()
    db.refresh(team)
    return {"team": _team_dict(db, team)}


@router.put("/api/teams/{team_id}")
def update_team(
    team_id: int,
    payload: TeamUpdateModel,
    actor: User = Depends(get_current_user_record),
    db: Session = Depends(get_db),
):
    if not is_admin_user(actor):
        raise HTTPException(status_code=403, detail="Admin access required")
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if payload.name is not None:
        name = payload.name.strip()
        if not name:
            raise HTTPException(status_code=422, detail="Team name is required")
        duplicate = db.query(Team).filter(Team.name == name, Team.id != team_id).first()
        if duplicate:
            raise HTTPException(status_code=409, detail="Team name already exists")
        team.name = name
    if payload.description is not None:
        team.description = payload.description
    db.commit()
    return {"team": _team_dict(db, team)}


@router.delete("/api/teams/{team_id}")
def delete_team(
    team_id: int,
    actor: User = Depends(get_current_user_record),
    db: Session = Depends(get_db),
):
    if not is_admin_user(actor):
        raise HTTPException(status_code=403, detail="Admin access required")
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    db.query(TeamMembership).filter(TeamMembership.team_id == team_id).delete()
    db.delete(team)
    db.commit()
    return {"message": "Team deleted"}


@router.post("/api/teams/{team_id}/assignments")
def assign_team_member(
    team_id: int,
    payload: TeamAssignmentModel,
    actor: User = Depends(get_current_user_record),
    db: Session = Depends(get_db),
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    _require_team_management(db, actor, team_id)
    target = (
        db.query(User)
        .filter(
            (User.username == payload.username)
            | (User.email == payload.username.lower())
        )
        .first()
    )
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    membership_role = payload.membership_role.lower()
    if membership_role not in {"manager", "staff"}:
        raise HTTPException(status_code=422, detail="Invalid membership role")
    if not is_admin_user(actor) and membership_role != "staff":
        raise HTTPException(status_code=403, detail="Managers may assign staff only")
    if effective_system_role(target) != membership_role:
        raise HTTPException(
            status_code=409,
            detail=f"User global role must be {membership_role} before assignment",
        )
    membership = (
        db.query(TeamMembership)
        .filter(
            TeamMembership.team_id == team_id,
            TeamMembership.username == target.username,
        )
        .first()
    )
    if membership:
        membership.membership_role = membership_role
    else:
        membership = TeamMembership(
            team_id=team_id,
            username=target.username,
            membership_role=membership_role,
        )
        db.add(membership)
    db.commit()
    return {"team": _team_dict(db, team)}


@router.delete("/api/teams/{team_id}/assignments/{username}")
def remove_team_member(
    team_id: int,
    username: str,
    actor: User = Depends(get_current_user_record),
    db: Session = Depends(get_db),
):
    _require_team_management(db, actor, team_id)
    membership = (
        db.query(TeamMembership)
        .filter(
            TeamMembership.team_id == team_id,
            TeamMembership.username == username,
        )
        .first()
    )
    if not membership:
        raise HTTPException(status_code=404, detail="Team assignment not found")
    if not is_admin_user(actor) and membership.membership_role != "staff":
        raise HTTPException(status_code=403, detail="Managers may remove staff only")
    db.delete(membership)
    db.commit()
    return {"message": "Team assignment removed"}
