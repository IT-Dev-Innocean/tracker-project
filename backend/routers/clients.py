from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from database import get_db, Client
from schemas import ClientCreateModel, ClientUpdateModel
from dependencies import get_current_user
from utils import can_manage_clients

router = APIRouter()

VALID_CLIENT_STATUSES = {"active", "inactive"}


def _serialize_client(client: Client) -> dict:
    return {
        "id": client.id,
        "client_code": client.client_code,
        "client_name": client.client_name,
        "status": client.status or "active",
        "created_at": client.created_at.isoformat() if client.created_at else None,
        "created_by": client.created_by,
    }


def _require_client_manager(db: Session, current_user: str):
    if not can_manage_clients(db, current_user):
        raise HTTPException(
            status_code=403,
            detail="Only Admin or Project Owner can manage clients.",
        )


@router.get("/api/clients")
def list_clients(
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    clients = db.query(Client).filter(Client.status == "active").order_by(Client.client_name.asc()).all()
    return {"clients": [_serialize_client(c) for c in clients]}


@router.post("/api/clients")
def create_client(
    payload: ClientCreateModel,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_client_manager(db, current_user)

    code = (payload.client_code or "").strip()
    name = (payload.client_name or "").strip()
    status = (payload.status or "active").strip().lower()

    if not code:
        raise HTTPException(status_code=400, detail="Client code is required.")
    if not name:
        raise HTTPException(status_code=400, detail="Client name is required.")
    if status not in VALID_CLIENT_STATUSES:
        raise HTTPException(
            status_code=400,
            detail="Status must be 'active' or 'inactive'.",
        )

    existing = db.query(Client).filter(Client.client_code == code).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Client code already exists.",
        )

    client = Client(
        client_code=code,
        client_name=name,
        status=status,
        created_by=current_user,
    )
    db.add(client)
    db.commit()
    db.refresh(client)
    return {
        "message": "Client created successfully.",
        "client": _serialize_client(client),
    }


@router.put("/api/clients/{client_id}")
def update_client(
    client_id: int,
    payload: ClientUpdateModel,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_client_manager(db, current_user)

    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found.")

    if payload.client_code is not None:
        code = payload.client_code.strip()
        if not code:
            raise HTTPException(status_code=400, detail="Client code is required.")
        duplicate = (
            db.query(Client)
            .filter(Client.client_code == code, Client.id != client_id)
            .first()
        )
        if duplicate:
            raise HTTPException(
                status_code=400,
                detail="Client code already exists.",
            )
        client.client_code = code

    if payload.client_name is not None:
        name = payload.client_name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="Client name is required.")
        client.client_name = name

    if payload.status is not None:
        status = payload.status.strip().lower()
        if status not in VALID_CLIENT_STATUSES:
            raise HTTPException(
                status_code=400,
                detail="Status must be 'active' or 'inactive'.",
            )
        client.status = status

    db.commit()
    db.refresh(client)
    return {
        "message": "Client updated successfully.",
        "client": _serialize_client(client),
    }


@router.delete("/api/clients/{client_id}")
def delete_client(
    client_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_client_manager(db, current_user)

    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found.")

    db.delete(client)
    db.commit()
    return {"message": "Client deleted successfully."}
