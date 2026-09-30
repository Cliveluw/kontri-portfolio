import { supabase } from "./supabase";

export async function submitBookingInquiry(inquiry) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("booking_inquiries")
    .insert([
      {
        name: inquiry.name.trim(),
        email: inquiry.email.trim(),
        phone: inquiry.phone?.trim() || null,
        service: inquiry.service,
        preferred_date:
          inquiry.preferred_date || null,
        location: inquiry.location?.trim() || null,
        message: inquiry.message.trim(),
        budget: inquiry.budget?.trim() || null,
        referral_source:
          inquiry.referral_source?.trim() || null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error(
      "Could not submit booking enquiry:",
      error
    );

    throw error;
  }

  return data;
}