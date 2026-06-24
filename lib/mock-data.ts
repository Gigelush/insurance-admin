import { Policy, Claim, UserProfile, Request } from "@/types";

export const MOCK_POLICIES: Policy[] = [
    {
        id: "NN-LOC-93821",
        holder: "Gigi Stanca",
        type: "Home Insurance",
        address: "Str. Primaverii 24, Bucuresti",
        status: "Active",
        expiry: "2027-01-01"
    }
];

export const MOCK_CLAIMS: Claim[] = [];

export const MOCK_USER_PROFILE: UserProfile = {
    name: "Gigi Stanca",
    avatar: null,
    address: "",
    cnp: "",
    phone: ""
};

export const MOCK_REQUESTS: Request[] = [];

export const SEED_DATA = {
    policies: MOCK_POLICIES,
    claims: MOCK_CLAIMS,
    messages: [],
    userProfile: MOCK_USER_PROFILE,
    requests: MOCK_REQUESTS,
    collaborators: []
};
