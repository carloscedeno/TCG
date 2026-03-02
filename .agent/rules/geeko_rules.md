# The Geeko Rules: Design & Flow Integrity

To prevent regression and maintain the core "Geeko-Asesor" flow, these rules MUST be followed:

## 1. 🔐 Admin Detection (AuthContext)

- **Rule**: Never rely solely on Supabase `app_metadata.role`.
- **Implementation**: Always fallback to a `supabase.from('profiles').select('role')` query if metadata is empty.

## 2. 📦 User Menu (Layout)

- **Rule**: Never remove **Gestión de Pedidos** (/admin/orders) or **Mis Pedidos** (/profile).

## 3. 🏍️ WhatsApp Assisted Flow

- **Rule**: Guest orders are tracked via WhatsApp; registered via Profile.

## 4. 🔠 Visual Language

- **Rule**: Follow the "Geeko Noir" aesthetic (Black, Gold, Teal).
