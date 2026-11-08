// SortSwift Inventory API Helper for Supabase Edge Functions (Deno)
const SORTSWIFT_BASE_URL = 'https://inventory-api.sortswift.com/api/inventory';

export function getSortSwiftApiKey(): string {
  return (
    Deno.env.get('SORTSWIFT_API_KEY') ||
    'ss_inv_sbx_e56e17c7ca1fe8dcc88650edcd0bc654f6a37803a64f6e6b54debdcc6d39c358'
  );
}

/**
 * Creates a temporary hold on a physical RAW card on SortSwift.
 * Takes the card off the sellable pool while customer completes checkout / WhatsApp payment.
 */
export async function reserveSortSwiftCard(
  rawCardId: string,
  externalReservationId: string,
  durationMinutes = 60,
  apiKey?: string
): Promise<{ id: string; status: string; rawCardId: string } | null> {
  const key = apiKey || getSortSwiftApiKey();
  const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();

  try {
    const res = await fetch(`${SORTSWIFT_BASE_URL}/api-key/raw-card-reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': key,
      },
      body: JSON.stringify({
        rawCardId,
        externalReservationId,
        expiresAt,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[SortSwift] Reservation failed (${res.status}) for ${rawCardId}: ${errText}`);
      return null;
    }

    const data = await res.json();
    console.log(`[SortSwift] Card reserved successfully: ${rawCardId} -> Reservation ID: ${data.id}`);
    return data;
  } catch (err: any) {
    console.error(`[SortSwift] Network error reserving card ${rawCardId}:`, err.message);
    return null;
  }
}

/**
 * Permanently commits a SortSwift reservation upon Odoo payment/delivery confirmation.
 * Decrements the card's quantity by 1 and marks status = 'removed'.
 */
export async function commitSortSwiftReservation(
  reservationId: string,
  apiKey?: string
): Promise<boolean> {
  const key = apiKey || getSortSwiftApiKey();

  try {
    const res = await fetch(`${SORTSWIFT_BASE_URL}/api-key/raw-card-reservations/${reservationId}/commit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': key,
      },
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[SortSwift] Commit failed (${res.status}) for reservation ${reservationId}: ${errText}`);
      return false;
    }

    const data = await res.json();
    console.log(`[SortSwift] Reservation committed successfully: ${reservationId} (Status: ${data.status})`);
    return true;
  } catch (err: any) {
    console.error(`[SortSwift] Error committing reservation ${reservationId}:`, err.message);
    return false;
  }
}

/**
 * Releases a hold if an order is cancelled or expires without payment.
 * Returns the card to the sellable pool on SortSwift.
 */
export async function releaseSortSwiftReservation(
  reservationId: string,
  apiKey?: string
): Promise<boolean> {
  const key = apiKey || getSortSwiftApiKey();

  try {
    const res = await fetch(`${SORTSWIFT_BASE_URL}/api-key/raw-card-reservations/${reservationId}`, {
      method: 'DELETE',
      headers: {
        'X-API-Key': key,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[SortSwift] Release failed (${res.status}) for reservation ${reservationId}: ${errText}`);
      return false;
    }

    console.log(`[SortSwift] Reservation released successfully: ${reservationId}`);
    return true;
  } catch (err: any) {
    console.error(`[SortSwift] Error releasing reservation ${reservationId}:`, err.message);
    return false;
  }
}

/**
 * Direct Store Sale (POS / In-store counter):
 * Directly dedicates and removes a SortSwift card without an existing web reservation.
 */
export async function deductSortSwiftDirectSale(
  rawCardId: string,
  referenceId: string,
  apiKey?: string
): Promise<boolean> {
  const reservation = await reserveSortSwiftCard(rawCardId, `pos_direct_${referenceId}`, 5, apiKey);
  if (!reservation || !reservation.id) {
    return false;
  }
  return await commitSortSwiftReservation(reservation.id, apiKey);
}
