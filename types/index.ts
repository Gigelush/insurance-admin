// Re-export all types from the shared package
// This file exists for backward compatibility — all imports using "@/types" still work
export type {
    Policy,
    FileAttachment,
    ClaimHistoryItem,
    ClaimPayment,
    RegressDetails,
    ClaimReserve,
    Claim,
    UserProfile,
    Request,
    Message,
    Collaborator,
    Avizare,
} from "../../shared/types";
