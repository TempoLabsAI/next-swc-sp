// src/app/api/polar/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";

const storeWebhookEvent = async (supabase: any, body: any) => {
    try {
        const { data, error: insertError } = await supabase
            .from("webhook_events")
            .insert({
                event_type: body.type,
                type: body.type,
                polar_event_id: body.data.id,
                created_at: new Date().toISOString(),
                modified_at: new Date().toISOString(),
                data: body.data,
            })
            .select();

        if (insertError) {
            console.error('Error storing webhook event:', insertError);
        }

        return data;
    } catch (err) {
        console.error('Error in storeWebhookEvent:', err);
    }
};

const webhookHandler = async (body: any) => {
    const supabase = await createClient();

    switch (body.type) {
        case 'subscription.created':
            // Insert new subscription
            const { data, error } = await supabase.from("subscriptions").insert({
                polar_id: body.data.id,
                polar_price_id: body.data.price_id,
                currency: body.data.currency,
                interval: body.data.recurring_interval,
                user_id: body.data.metadata.userId,
                status: body.data.status,
                current_period_start: new Date(body.data.current_period_start).getTime(),
                current_period_end: new Date(body.data.current_period_end).getTime(),
                cancel_at_period_end: body.data.cancel_at_period_end,
                amount: body.data.amount,
                started_at: new Date(body.data.started_at).getTime(),
                ended_at: body.data.ended_at
                    ? new Date(body.data.ended_at).getTime()
                    : null,
                canceled_at: body.data.canceled_at
                    ? new Date(body.data.canceled_at).getTime()
                    : null,
                customer_cancellation_reason: body.data.customer_cancellation_reason || null,
                customer_cancellation_comment: body.data.customer_cancellation_comment || null,
                metadata: body.data.metadata || {},
                custom_field_data: body.data.custom_field_data || {},
                customer_id: body.data.customer_id
            }).select();

            if (error) {
                console.error('Error inserting subscription:', error);
                throw error;
            }
            break;

        case 'subscription.updated':
            // Find existing subscription
            const { data: existingSub } = await supabase
                .from("subscriptions")
                .select()
                .eq("polar_id", body.data.id)
                .single();

            if (existingSub) {
                await supabase
                    .from("subscriptions")
                    .update({
                        amount: body.data.amount,
                        status: body.data.status,
                        current_period_start: new Date(body.data.current_period_start).getTime(),
                        current_period_end: new Date(body.data.current_period_end).getTime(),
                        cancel_at_period_end: body.data.cancel_at_period_end,
                        metadata: body.data.metadata || {},
                        custom_field_data: body.data.custom_field_data || {}
                    })
                    .eq("polar_id", body.data.id);
            }
            break;

        case 'subscription.active':
            const { data: activeSub } = await supabase
                .from("subscriptions")
                .select()
                .eq("polar_id", body.data.id)
                .single();

            if (activeSub) {
                // Update subscription to active
                await supabase
                    .from("subscriptions")
                    .update({
                        status: body.data.status,
                        started_at: new Date(body.data.started_at).getTime()
                    })
                    .eq("polar_id", body.data.id);
            }

            break;

        case 'subscription.canceled':
            const canceledSub = await supabase
                .from("subscriptions")
                .select()
                .eq("polar_id", body.data.id)
                .single();

            if (canceledSub) {
                // Update subscription to canceled
                await supabase
                    .from("subscriptions")
                    .update({
                        status: body.data.status,
                        canceled_at: body.data.canceled_at
                            ? new Date(body.data.canceled_at).getTime()
                            : null,
                        customer_cancellation_reason: body.data.customer_cancellation_reason || null,
                        customer_cancellation_comment: body.data.customer_cancellation_comment || null
                    })
                    .eq("polar_id", body.data.id);

            }
            break;

        case 'subscription.uncanceled':

            const uncanceledSub = await supabase
                .from("subscriptions")
                .select()
                .eq("polar_id", body.data.id)
                .single();

            if (uncanceledSub) {
                // Update subscription to uncanceled
                await supabase
                    .from("subscriptions")
                    .update({
                        status: body.data.status,
                        cancel_at_period_end: false,
                        canceled_at: null,
                        customer_cancellation_reason: null,
                        customer_cancellation_comment: null
                    })
                    .eq("polar_id", body.data.id);
            }
            break;

        case 'subscription.revoked':
            const revokedSub = await supabase
                .from("subscriptions")
                .select()
                .eq("polar_id", body.data.id)
                .single();

            if (revokedSub) {
                // Update subscription to revoked
                await supabase
                    .from("subscriptions")
                    .update({
                        status: 'revoked',
                        ended_at: body.data.ended_at
                            ? new Date(body.data.ended_at).getTime()
                            : null
                    })
                    .eq("polar_id", body.data.id);
            }
            break;

        case 'order.created':
            console.log("order.created:", body);
            // Orders are handled through the subscription events
            break;

        default:
            console.log(`Unhandled event type: ${body?.type}`);
            break;
    }
}

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    let eventId: string | null = null;

    try {
        const body = await req.json();

        // Store the incoming webhook event
        const eventData = await storeWebhookEvent(supabase, body);
        eventId = eventData?.[0]?.id;

        // Process the webhook
        await webhookHandler(body);

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Webhook error:', error);

        // Update event status to error
        if (eventId) {
            await storeWebhookEvent(supabase, req.body);
        }

        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}