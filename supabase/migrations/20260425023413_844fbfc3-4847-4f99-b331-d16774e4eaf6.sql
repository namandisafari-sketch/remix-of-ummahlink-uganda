-- ============================================
-- 1) OPERATOR APPLICATIONS
-- ============================================
CREATE TABLE public.operator_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  city TEXT,
  district TEXT,
  license_no TEXT,
  license_authority TEXT,
  bio TEXT,
  website TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_operator_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.operator_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit application"
  ON public.operator_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own application"
  ON public.operator_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all applications"
  ON public.operator_applications FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update applications"
  ON public.operator_applications FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete applications"
  ON public.operator_applications FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_operator_applications_updated_at
  BEFORE UPDATE ON public.operator_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 2) TOUR BOOKINGS
-- ============================================
CREATE TABLE public.tour_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_id UUID NOT NULL,
  package_id UUID NOT NULL,
  user_id UUID, -- nullable: operator can record walk-in customers
  passenger_name TEXT NOT NULL,
  passenger_phone TEXT NOT NULL,
  passenger_email TEXT,
  passport_no TEXT,
  emergency_contact TEXT,
  notes TEXT,
  total_amount BIGINT NOT NULL DEFAULT 0,
  paid_amount BIGINT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'UGX',
  departure_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tour_bookings_operator ON public.tour_bookings(operator_id);
CREATE INDEX idx_tour_bookings_package ON public.tour_bookings(package_id);
CREATE INDEX idx_tour_bookings_user ON public.tour_bookings(user_id);
CREATE INDEX idx_tour_bookings_departure ON public.tour_bookings(departure_date);

ALTER TABLE public.tour_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customer views own booking"
  ON public.tour_bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Operator owner views bookings"
  ON public.tour_bookings FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.tour_operators o WHERE o.id = tour_bookings.operator_id AND o.owner_user_id = auth.uid()));

CREATE POLICY "Admins view all bookings"
  ON public.tour_bookings FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Operator owner inserts bookings"
  ON public.tour_bookings FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.tour_operators o WHERE o.id = tour_bookings.operator_id AND o.owner_user_id = auth.uid()));

CREATE POLICY "Customer creates own booking"
  ON public.tour_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Operator owner updates bookings"
  ON public.tour_bookings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.tour_operators o WHERE o.id = tour_bookings.operator_id AND o.owner_user_id = auth.uid()));

CREATE POLICY "Admins update bookings"
  ON public.tour_bookings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Operator owner deletes bookings"
  ON public.tour_bookings FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.tour_operators o WHERE o.id = tour_bookings.operator_id AND o.owner_user_id = auth.uid()));

CREATE POLICY "Admins delete bookings"
  ON public.tour_bookings FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_tour_bookings_updated_at
  BEFORE UPDATE ON public.tour_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 3) TOUR BOOKING PAYMENTS (deposits / installments)
-- ============================================
CREATE TABLE public.tour_booking_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.tour_bookings(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UGX',
  method TEXT NOT NULL CHECK (method IN ('manual_cash','manual_bank','manual_momo','pesapal')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','refunded')),
  reference TEXT,
  pesapal_order_tracking_id TEXT,
  pesapal_transaction_id TEXT,
  recorded_by UUID,
  note TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_booking_payments_booking ON public.tour_booking_payments(booking_id);
CREATE INDEX idx_booking_payments_status ON public.tour_booking_payments(status);

ALTER TABLE public.tour_booking_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customer views own booking payments"
  ON public.tour_booking_payments FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.tour_bookings b WHERE b.id = tour_booking_payments.booking_id AND b.user_id = auth.uid()));

CREATE POLICY "Operator owner views booking payments"
  ON public.tour_booking_payments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tour_bookings b
    JOIN public.tour_operators o ON o.id = b.operator_id
    WHERE b.id = tour_booking_payments.booking_id AND o.owner_user_id = auth.uid()
  ));

CREATE POLICY "Admins view all booking payments"
  ON public.tour_booking_payments FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Operator owner inserts booking payments"
  ON public.tour_booking_payments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.tour_bookings b
    JOIN public.tour_operators o ON o.id = b.operator_id
    WHERE b.id = tour_booking_payments.booking_id AND o.owner_user_id = auth.uid()
  ));

CREATE POLICY "Customer inserts own booking payment"
  ON public.tour_booking_payments FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.tour_bookings b WHERE b.id = tour_booking_payments.booking_id AND b.user_id = auth.uid()));

CREATE POLICY "Operator owner updates booking payments"
  ON public.tour_booking_payments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.tour_bookings b
    JOIN public.tour_operators o ON o.id = b.operator_id
    WHERE b.id = tour_booking_payments.booking_id AND o.owner_user_id = auth.uid()
  ));

CREATE POLICY "Admins update booking payments"
  ON public.tour_booking_payments FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete booking payments"
  ON public.tour_booking_payments FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_booking_payments_updated_at
  BEFORE UPDATE ON public.tour_booking_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-sync booking paid_amount when payment is completed
CREATE OR REPLACE FUNCTION public.sync_booking_paid_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_booking UUID;
BEGIN
  target_booking := COALESCE(NEW.booking_id, OLD.booking_id);
  UPDATE public.tour_bookings
  SET paid_amount = COALESCE((
    SELECT SUM(amount) FROM public.tour_booking_payments
    WHERE booking_id = target_booking AND status = 'completed'
  ), 0)
  WHERE id = target_booking;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_booking_paid_amount
  AFTER INSERT OR UPDATE OR DELETE ON public.tour_booking_payments
  FOR EACH ROW EXECUTE FUNCTION public.sync_booking_paid_amount();