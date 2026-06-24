import { z } from "zod";

// --- Claims ---

export const createClaimSchema = z.object({
    policyId: z.string().min(1, "Policy ID is required"),
    holderName: z.string().min(1, "Holder name is required"),
    date: z.string().min(1, "Date is required"),
    time: z.string().optional().default(""),
    description: z.string().optional().default(""),
    type: z.string().optional(),
    status: z.string().optional(),
    submittedAt: z.string().optional(),
    id: z.string().optional(),
    location: z.string().optional(),
    cause: z.string().optional(),
    witnesses: z.string().optional(),
    email: z.string().optional(),
    details: z.any().optional(),
    hasRegress: z.boolean().optional(),
});

// Allow partial updates — but disallow overwriting the primary key
export const updateClaimSchema = z.object({
    id: z.never({ message: "Cannot change claim ID" }).optional(),
}).passthrough();

// --- Policies ---

export const createPolicySchema = z.object({
    holder: z.string().min(1, "Holder name is required"),
    type: z.string().min(1, "Policy type is required"),
    address: z.string().min(1, "Address is required"),
    status: z.enum(["Active", "Expired", "Pending"]).optional().default("Active"),
    expiry: z.string().min(1, "Expiry date is required"),
    cnp: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    startDate: z.string().optional(),
    insuredLocations: z.array(z.string()).optional(),
    details: z.any().optional(),
});

export const updatePolicySchema = z.object({
    id: z.never({ message: "Cannot change policy ID" }).optional(),
}).passthrough();

// --- Avizări ---

export const createAvizareSchema = z.object({
    policyId: z.string().min(1, "Policy ID is required"),
    holderName: z.string().min(1, "Holder name is required"),
    date: z.string().min(1, "Date is required"),
    time: z.string().optional().default(""),
    description: z.string().optional().default(""),
    cause: z.string().optional(),
    dataAvizare: z.string().optional(),
});

// --- User Profile ---

export const updateUserProfileSchema = z.object({
    name: z.string().optional(),
    avatar: z.string().nullable().optional(),
    address: z.string().optional(),
    cnp: z.string().optional(),
    phone: z.string().optional(),
    city: z.string().optional(),
    county: z.string().optional(),
});

// --- Messages ---

export const createMessageSchema = z.object({
    text: z.string().min(1, "Message text is required"),
    sender: z.enum(["user", "agent"]),
    claimId: z.string().optional(),
    attachment: z.object({
        name: z.string(),
        type: z.string(),
        content: z.string(),
        category: z.enum(["photo", "document", "estimate", "other"]).optional(),
        uploadedAt: z.string(),
    }).optional(),
});

// --- Collaborators ---

export const createCollaboratorSchema = z.object({
    name: z.string().min(1, "Name is required"),
    companyName: z.string().optional(),
    type: z.string().optional(),
    specialty: z.string().min(1, "Specialty is required"),
    phone: z.string().min(1, "Phone is required"),
    email: z.string().email("Valid email is required"),
    region: z.string().min(1, "Region is required"),
    status: z.enum(["active", "inactive"]).optional().default("active"),
});

// --- Requests ---

export const createRequestSchema = z.object({
    name: z.string().min(1, "Name is required"),
    type: z.string().min(1, "Type is required"),
    address: z.string().min(1, "Address is required"),
    status: z.enum(["Pending", "Approved", "Rejected"]).optional().default("Pending"),
    coverage: z.number().optional(),
    details: z.string().optional(),
});

// --- File Attachments ---

export const fileAttachmentSchema = z.object({
    name: z.string().min(1, "File name is required"),
    type: z.string().min(1, "File type is required"),
    content: z.string().min(1, "File content is required"),
    category: z.enum(["photo", "document", "estimate", "other"]).optional(),
    uploadedAt: z.string().optional(),
});

// --- Helper ---

export function validateBody<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
    const result = schema.safeParse(data);
    if (!result.success) {
        const messages = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
        return { success: false, error: messages };
    }
    return { success: true, data: result.data };
}
