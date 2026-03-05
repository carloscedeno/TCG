from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
from typing import List, Dict, Any
from ...core.config import settings

conf = ConnectionConfig(
    MAIL_USERNAME=settings.SMTP_USERNAME,
    MAIL_PASSWORD=settings.SMTP_PASSWORD,
    MAIL_FROM=settings.EMAILS_FROM_EMAIL,
    MAIL_PORT=settings.SMTP_PORT,
    MAIL_SERVER=settings.SMTP_SERVER,
    MAIL_STARTTLS=settings.SMTP_TLS,
    MAIL_SSL_TLS=not settings.SMTP_TLS,  # If not TLS, usually SSL
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)

fm = FastMail(conf)

class EmailService:
    @staticmethod
    async def send_order_confirmation(user_email: str, order_id: str, order_total: float, items: List[Dict[str, Any]]):
        """Send order confirmation to the buyer."""
        if not settings.SMTP_PASSWORD:
            print("Email Service: SMTP Password not configured, skipping email.")
            return

        items_html = "".join([
            f"<li>{item['quantity']}x {item['products']['name']} - ${item['products']['price']}</li>"
            for item in items
        ])

        html = f"""
        <html>
            <body>
                <h2>¡Gracias por tu compra en Geekorium Shop!</h2>
                <p>Tu pedido <strong>{order_id}</strong> ha sido confirmado.</p>
                <h3>Resumen de la compra:</h3>
                <ul>
                    {items_html}
                </ul>
                <h3>Total: ${order_total}</h3>
                <p>Nos pondremos en contacto pronto para el envío.</p>
            </body>
        </html>
        """

        message = MessageSchema(
            subject=f"Confirmación de Pedido {order_id} - Geekorium Shop",
            recipients=[user_email],
            body=html,
            subtype=MessageType.html
        )

        try:
            await fm.send_message(message)
            print(f"Order confirmation email sent to {user_email}")
        except Exception as e:
            print(f"Failed to send order confirmation email: {str(e)}")

    @staticmethod
    async def send_new_order_notification(admin_email: str, order_id: str, current_user_id: str, order_total: float, items: List[Dict[str, Any]]):
        """Send new order alert to the store admin."""
        if not settings.SMTP_PASSWORD:
            return

        items_html = "".join([
            f"<li>{item['quantity']}x {item['products']['name']} - ${item['products']['price']}</li>"
            for item in items
        ])

        html = f"""
        <html>
            <body>
                <h2>¡Nueva Venta en Geekorium Shop!</h2>
                <p>Se ha registrado un nuevo pedido con el ID: <strong>{order_id}</strong>.</p>
                <p>ID del Usuario: {current_user_id}</p>
                <h3>Artículos comprados:</h3>
                <ul>
                    {items_html}
                </ul>
                <h3>Total: ${order_total}</h3>
                <p>Por favor revisa el panel de administración para más detalles.</p>
            </body>
        </html>
        """

        message = MessageSchema(
            subject=f"¡Nueva Venta! Pedido {order_id}",
            recipients=[admin_email],
            body=html,
            subtype=MessageType.html
        )

        try:
            await fm.send_message(message)
            print(f"New order notification sent to {admin_email}")
        except Exception as e:
            print(f"Failed to send admin notification email: {str(e)}")
