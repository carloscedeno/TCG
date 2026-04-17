import psycopg2
import sys
import io

# Forzar UTF-8 en la salida de consola para evitar errores en Windows con emojis
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def final_cart_logic_fix():
    try:
        conn = psycopg2.connect(
            user="postgres.sxuotvogwvmxuvwbsscv",
            password="jLta9LqEmpMzCI5r",
            host="aws-0-us-west-2.pooler.supabase.com",
            port="6543",
            dbname="postgres"
        )
        cur = conn.cursor()
        
        print("🛠️  Aplicando robustez definitiva a add_to_cart_v2...")
        
        # Primero goteamos para asegurar limpieza absoluta
        cur.execute("""
            SELECT oidvectortypes(proargtypes) 
            FROM pg_proc 
            WHERE proname = 'add_to_cart_v2' 
            AND pronamespace = 'public'::regnamespace;
        """)
        overloads = cur.fetchall()
        for ov in overloads:
            print(f"🗑️  Goteando overload: add_to_cart_v2({ov[0]})")
            cur.execute(f"DROP FUNCTION IF EXISTS public.add_to_cart_v2({ov[0]})")

        # 2. Re-crear con extracción de UUID súper robusta
        print("📦 Re-creando add_to_cart_v2 con lógica de extracción tolerante...")
        logic = """
CREATE OR REPLACE FUNCTION public.add_to_cart_v2(
    p_identifier text,
    p_quantity integer,
    p_finish text DEFAULT 'nonfoil'::text,
    p_user_id uuid DEFAULT NULL::uuid
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
    DECLARE
      v_user_id uuid;
      v_product_id uuid;
      v_cart_id uuid;
      v_printing_id uuid;
      v_name text;
      v_set_code text;
      v_image_url text;
      v_price numeric;
      v_clean_id text;
      v_p_finish text;
    BEGIN
      -- Normalización de parámetros
      v_p_finish := LOWER(COALESCE(p_finish, 'nonfoil'));
      -- Extraer exactamente el primer UUID que aparezca en la cadena
      v_clean_id := (REGEXP_MATCH(p_identifier, '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'))[1];

      IF v_clean_id IS NULL THEN
         RETURN jsonb_build_object('success', false, 'message', 'Identificador no válido: no se encontró UUID');
      END IF;

      -- Prioridad a auth.uid() para seguridad
      v_user_id := COALESCE(auth.uid(), p_user_id);
      
      IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Sesión no válida');
      END IF;

      -- 1. Intentar encontrar como PRODUCTO físico existente
      SELECT id INTO v_product_id 
      FROM public.products 
      WHERE (id::text = v_clean_id OR (printing_id::text = v_clean_id AND condition = 'NM' AND LOWER(COALESCE(finish, 'nonfoil')) = v_p_finish))
      ORDER BY stock DESC, updated_at DESC
      LIMIT 1;

      -- 2. Si no es un producto físico, intentar crear uno virtual desde el catálogo (printing_id)
      IF v_product_id IS NULL THEN
        v_printing_id := v_clean_id::uuid;
        
        SELECT 
          c.card_name, s.set_code, cp.image_url, 
          COALESCE(
            CASE WHEN v_p_finish = 'foil' THEN ap.avg_market_price_foil_usd ELSE ap.avg_market_price_usd END,
            0
          ) as mkt_price
        INTO v_name, v_set_code, v_image_url, v_price
        FROM public.card_printings cp
        JOIN public.cards c ON cp.card_id = c.card_id
        JOIN public.sets s ON cp.set_id = s.set_id
        LEFT JOIN public.aggregated_prices ap ON cp.printing_id = ap.printing_id
        WHERE cp.printing_id = v_printing_id;

        IF v_name IS NOT NULL THEN
          INSERT INTO public.products (printing_id, condition, finish, stock, price, name, set_code, image_url)
          VALUES (v_printing_id, 'NM', v_p_finish, 0, v_price, v_name, v_set_code, v_image_url)
          ON CONFLICT (printing_id, condition, finish) DO UPDATE SET 
            price = CASE WHEN COALESCE(public.products.price, 0) = 0 THEN EXCLUDED.price ELSE public.products.price END
          RETURNING id INTO v_product_id;
        END IF;
      END IF;

      IF v_product_id IS NULL THEN
         RETURN jsonb_build_object('success', false, 'message', 'No se pudo identificar la entidad');
      END IF;

      -- Obtener o crear carrito activo
      SELECT id INTO v_cart_id FROM public.carts WHERE user_id = v_user_id AND is_active = true LIMIT 1;
      
      IF v_cart_id IS NULL THEN
        INSERT INTO public.carts (user_id, name, is_active)
        VALUES (v_user_id, 'Carrito Principal', true)
        RETURNING id INTO v_cart_id;
      END IF;

      -- Agregar ítem
      INSERT INTO public.cart_items (cart_id, product_id, quantity, updated_at)
      VALUES (v_cart_id, v_product_id, p_quantity, now())
      ON CONFLICT (cart_id, product_id) DO UPDATE SET 
        quantity = public.cart_items.quantity + EXCLUDED.quantity,
        updated_at = now();

      RETURN jsonb_build_object('success', true, 'cart_id', v_cart_id, 'product_id', v_product_id);
    END;
$function$;
"""
        cur.execute(logic)
        conn.commit()
        print("✨ ¡Robusta total aplicada con éxito!")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error final: {e}")

if __name__ == "__main__":
    final_cart_logic_fix()
