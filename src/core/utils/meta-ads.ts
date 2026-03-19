/**
 * Meta Ads Utility
 * Handles communication with Meta Graph API to retrieve lead details.
 */

export interface MetaLeadData {
    first_name: string;
    last_name?: string;
    email?: string;
    phone?: string;
    source: string;
}

export async function getMetaLeadDetails(leadId: string): Promise<MetaLeadData | null> {
    const accessToken = process.env.FB_PAGE_TOKEN;
    if (!accessToken) {
        console.error("Meta Ads Error: FB_PAGE_TOKEN is not defined in environment variables.");
        return null;
    }

    try {
        const response = await fetch(
            `https://graph.facebook.com/v21.0/${leadId}?access_token=${accessToken}`
        );

        if (!response.ok) {
            const error = await response.json();
            console.error("Meta Graph API Error:", error);
            return null;
        }

        const data = await response.json();

        // Parse field_data to extract usable info
        const leadInfo: MetaLeadData = {
            first_name: "Lead",
            last_name: "Meta",
            source: "meta_ads"
        };

        if (data.field_data && Array.isArray(data.field_data)) {
            data.field_data.forEach((field: any) => {
                const value = field.values ? field.values[0] : null;
                if (!value) return;

                switch (field.name) {
                    case "full_name":
                        const names = value.split(" ");
                        leadInfo.first_name = names[0];
                        leadInfo.last_name = names.slice(1).join(" ");
                        break;
                    case "first_name":
                        leadInfo.first_name = value;
                        break;
                    case "last_name":
                        leadInfo.last_name = value;
                        break;
                    case "email":
                        leadInfo.email = value;
                        break;
                    case "phone_number":
                        leadInfo.phone = value;
                        break;
                }
            });
        }

        return leadInfo;
    } catch (err) {
        console.error("Failed to fetch lead details from Meta:", err);
        return null;
    }
}
