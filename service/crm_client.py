import xmlrpc.client
from typing import Optional


class AuthenticationError(Exception):
    """Raised when authentication with Odoo fails."""


class OdooCRMClient:
    def __init__(self, url: str, db: str, username: str, password: str):
        self.url = url
        self.db = db
        self.username = username

        self.common = xmlrpc.client.ServerProxy(f"{url}/xmlrpc/2/common", allow_none=True)
        uid = self.common.authenticate(db, username, password, {})

        if not uid:
            raise AuthenticationError("Authentication failed. Check credentials or DB name.")

        self.uid = uid
        self.models = xmlrpc.client.ServerProxy(f"{url}/xmlrpc/2/object", allow_none=True)

        # Store auth securely (don’t keep password separately)
        self._auth = (db, uid, password)

    def create_lead(self, name: str, email: Optional[str], phone: Optional[str], lead_type: str = "opportunity"):
        return self.models.execute_kw(
            *self._auth,
            "crm.lead", "create",
            [{
                "name": name,
                "contact_name": name,
                "email_from": email,
                "phone": phone,
                "type": lead_type,
            }]
        )

    def update_lead(self, lead_id: int, vals: dict):
        return self.models.execute_kw(
            *self._auth,
            "crm.lead", "write",
            [[lead_id], vals]
        )

    def add_internal_note(self, lead_id: int, note_text: str):
        return self.update_lead(lead_id, {"description": note_text})

    def add_chatter_note(self, lead_id: int, note_text: str):
        return self.models.execute_kw(
            *self._auth,
            "mail.message", "create",
            [{
                "model": "crm.lead",
                "res_id": lead_id,
                "body": note_text,
                "message_type": "comment",
                "subtype_id": 2,
            }]
        )

    def add_contact_details(self, lead_id: int, contact_name: Optional[str] = None,
                            email: Optional[str] = None, phone: Optional[str] = None):
        vals = {}
        if contact_name:
            vals["name"] = contact_name
        if email:
            vals["email"] = email
        if phone:
            vals["phone"] = phone

        partner_id = self.models.execute_kw(
            *self._auth,
            "res.partner", "create",
            [vals]
        )

        self.update_lead(lead_id, {"partner_id": partner_id})
        return partner_id

    def update_contact_address(self, partner_id: int, street: Optional[str] = None,
                               street2: Optional[str] = None, city: Optional[str] = None,
                               state_id: Optional[int] = None, zip_code: Optional[str] = None,
                               country_id: Optional[int] = None):
        vals = {}
        if street:
            vals["street"] = street
        if street2:
            vals["street2"] = street2
        if city:
            vals["city"] = city
        if state_id:
            vals["state_id"] = state_id
        if zip_code:
            vals["zip"] = zip_code
        if country_id:
            vals["country_id"] = country_id

        return self.models.execute_kw(
            *self._auth,
            "res.partner", "write",
            [[partner_id], vals]
        )
