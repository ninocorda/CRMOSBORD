import { NextRequest, NextResponse } from "next/server";
import { getMetaLeadDetails } from "@/core/utils/meta-ads";
import { upsertLead } from "@/infrastructure/database/repositories";

/**
 * Meta Webhook Route
 * GET: Handles verification from Meta
 * POST: Handles actual lead data notifications
 */

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    const verifyToken = process.env.FB_VERIFY_TOKEN;

    if (mode === "subscribe" && token === verifyToken) {
        console.log("WEBHOOK_VERIFIED");
        return new NextResponse(challenge, { status: 200 });
    } else {
        return new NextResponse("Forbidden", { status: 403 });
    }
}

export async function POST(req: NextRequest) {
    const body = await req.json();

    // Check if it's a leadgen event
    if (body.object === "page") {
        for (const entry of body.entry) {
            for (const change of entry.changes) {
                if (change.field === "leadgen") {
                    const leadgenId = change.value.leadgen_id;
                    console.log("New Meta Lead received:", leadgenId);

                    // Fetch lead details from Meta Graph API
                    const leadData = await getMetaLeadDetails(leadgenId);

                    if (leadData) {
                        try {
                            // Save lead to database
                            await upsertLead({
                                first_name: leadData.first_name,
                                last_name: leadData.last_name || "",
                                email: leadData.email,
                                phone: leadData.phone,
                                source: "meta_ads",
                                status: "nuevo",
                                notes: `Lead id: ${leadgenId}`
                            });
                            console.log("Lead saved successfully to CRM.");
                        } catch (error) {
                            console.error("Error saving lead from webhook:", error);
                        }
                    }
                }
            }
        }
    }

    // Always respond with 200 OK to Meta
    return NextResponse.json({ success: true });
}
