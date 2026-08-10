import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, isStripeConfigured } from "@/lib/payments/stripe";

export type ProfileBilling = {
  id: string;
  email: string;
  full_name: string | null;
  stripe_customer_id: string | null;
  stripe_default_payment_method_id: string | null;
};

/**
 * Create or retrieve a Stripe Customer for a profile and persist the id.
 */
export async function getOrCreateStripeCustomer(
  userId: string
): Promise<{ customerId: string; profile: ProfileBilling }> {
  if (!isStripeConfigured()) {
    throw new Error(
      "Card payments are temporarily unavailable. Please try again later."
    );
  }
  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select(
      "id, email, full_name, stripe_customer_id, stripe_default_payment_method_id"
    )
    .eq("id", userId)
    .single();

  if (error || !profile) {
    throw new Error(error?.message || "Profile not found");
  }

  const stripe = getStripe();

  if (profile.stripe_customer_id) {
    try {
      await stripe.customers.retrieve(profile.stripe_customer_id);
      return { customerId: profile.stripe_customer_id, profile };
    } catch {
      // Customer missing in Stripe — recreate below
      console.warn(
        "[stripe] stored customer missing, recreating",
        profile.stripe_customer_id
      );
    }
  }

  const customer = await stripe.customers.create({
    email: profile.email,
    name: profile.full_name || undefined,
    metadata: {
      supabase_user_id: userId,
      source: "sacred_reference",
    },
  });

  const { error: updateErr } = await admin
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);

  if (updateErr) {
    console.error("[stripe] failed to save customer id", updateErr.message);
  }

  return {
    customerId: customer.id,
    profile: { ...profile, stripe_customer_id: customer.id },
  };
}

export async function setDefaultPaymentMethod(
  userId: string,
  paymentMethodId: string
): Promise<void> {
  const { customerId } = await getOrCreateStripeCustomer(userId);
  const stripe = getStripe();
  const admin = createAdminClient();

  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });

  // Attach if not already (SetupIntent confirm usually attaches)
  try {
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
  } catch (e) {
    // Already attached is fine
    const msg = e instanceof Error ? e.message : String(e);
    if (!msg.toLowerCase().includes("already been attached")) {
      console.warn("[stripe] attach pm:", msg);
    }
  }

  await admin
    .from("profiles")
    .update({ stripe_default_payment_method_id: paymentMethodId })
    .eq("id", userId);
}

export async function getDefaultPaymentMethodSummary(userId: string): Promise<{
  hasCard: boolean;
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
} | null> {
  if (!isStripeConfigured()) {
    return {
      hasCard: false,
      brand: null,
      last4: null,
      expMonth: null,
      expYear: null,
    };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select(
      "stripe_customer_id, stripe_default_payment_method_id"
    )
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.stripe_customer_id) {
    return { hasCard: false, brand: null, last4: null, expMonth: null, expYear: null };
  }

  const stripe = getStripe();
  let pmId = profile.stripe_default_payment_method_id;

  if (!pmId) {
    const customer = await stripe.customers.retrieve(profile.stripe_customer_id);
    if (customer.deleted) {
      return { hasCard: false, brand: null, last4: null, expMonth: null, expYear: null };
    }
    pmId =
      typeof customer.invoice_settings?.default_payment_method === "string"
        ? customer.invoice_settings.default_payment_method
        : customer.invoice_settings?.default_payment_method?.id ?? null;
  }

  if (!pmId) {
    const list = await stripe.paymentMethods.list({
      customer: profile.stripe_customer_id,
      type: "card",
      limit: 1,
    });
    pmId = list.data[0]?.id ?? null;
  }

  if (!pmId) {
    return { hasCard: false, brand: null, last4: null, expMonth: null, expYear: null };
  }

  const pm = await stripe.paymentMethods.retrieve(pmId);
  if (pm.type !== "card" || !pm.card) {
    return { hasCard: false, brand: null, last4: null, expMonth: null, expYear: null };
  }

  return {
    hasCard: true,
    brand: pm.card.brand,
    last4: pm.card.last4,
    expMonth: pm.card.exp_month,
    expYear: pm.card.exp_year,
  };
}
